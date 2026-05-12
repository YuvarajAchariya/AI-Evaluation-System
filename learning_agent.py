"""
=============================================================
  LEARNING AGENT  —  Agentic AI Assistive Evaluation System
  File: learning_agent.py  (place beside evaluation_system.py)
=============================================================

  PURPOSE:
    Upgrades FeedbackMemory from a passive store into an active
    Learning Agent that wakes up every 5 corrections, analyzes
    all past data, and generates a calibration note that is
    injected into every future LLM evaluation prompt.

    Four analyses per cycle:
      A1 — Global bias detection  (is AI over/under scoring overall?)
      A2 — Topic pattern detection (which topics is AI weakest on?)
      A3 — Score range weakness   (where in 1-10 is AI least accurate?)
      A4 — Trend detection        (is AI getting better or worse?)

    Output:
      → Calibration note saved to MongoDB (feedback_memory_meta)
      → Loaded by _build_learning_context() and prepended to LLM prompt
      → Note first, raw corrections follow (your chosen order)

  CONNECTS TO:
    evaluation_system.py  → FeedbackMemory.store_correction()
                            _build_learning_context()
                            MongoDataLayer (2 new methods)

=============================================================
"""

import re
import logging
import numpy as np
from datetime import datetime, timezone
from collections import defaultdict

# ─────────────────────────────────────────────────────────────
#  CONSTANTS
# ─────────────────────────────────────────────────────────────

ANALYSIS_TRIGGER_EVERY   = 5      # run analysis every N corrections
MIN_CORRECTIONS_FOR_TOPIC = 2     # need at least this many to report a topic
MIN_CORRECTIONS_FOR_TREND = 4     # need at least this many to report a trend

# Score range buckets
RANGE_LOW  = (1, 4)
RANGE_MID  = (5, 7)
RANGE_HIGH = (8, 10)

# Topic keyword groups — add more as your subject domain grows
# Format: "label": [keywords that identify this topic]
TOPIC_GROUPS = {
    "databases"       : ["database", "sql", "query", "table", "schema", "mongodb",
                         "relational", "nosql", "index", "join"],
    "algorithms"      : ["algorithm", "complexity", "sorting", "search", "recursion",
                         "dynamic", "greedy", "tree", "graph", "bfs", "dfs"],
    "networks"        : ["network", "protocol", "tcp", "ip", "http", "dns",
                         "routing", "packet", "bandwidth", "latency"],
    "operating systems": ["process", "thread", "memory", "scheduling", "deadlock",
                          "semaphore", "kernel", "virtual", "paging", "cache"],
    "programming"     : ["function", "class", "object", "inheritance", "loop",
                         "array", "pointer", "variable", "syntax", "compile"],
    "data structures" : ["stack", "queue", "linked", "list", "heap", "hash",
                         "binary", "node", "traversal", "balancing"],
    "machine learning": ["model", "training", "neural", "regression", "classification",
                         "feature", "gradient", "loss", "epoch", "dataset"],
    "security"        : ["encryption", "authentication", "firewall", "vulnerability",
                         "attack", "hash", "certificate", "ssl", "tls", "cipher"],
}


# ─────────────────────────────────────────────────────────────
#  CALIBRATION RESULT  —  what LearningAgent.analyze() returns
# ─────────────────────────────────────────────────────────────

class CalibrationResult:
    """
    Holds all analysis outputs from one learning cycle.
    Converted to a MongoDB document and to a prompt-ready string.
    """

    def __init__(self, n_corrections: int):
        self.n_corrections      = n_corrections
        self.generated_at       = datetime.now(timezone.utc).isoformat()

        # A1
        self.global_mean_gap    = 0.0
        self.global_mae         = 0.0
        self.global_bias        = "balanced"   # underscoring / overscoring / balanced

        # A2
        self.weak_topics        = []           # list of (topic, mean_gap, count)

        # A3
        self.weakest_range      = None         # "low" / "mid" / "high" / None
        self.range_maes         = {}           # {"low": x, "mid": y, "high": z}

        # A4
        self.trend              = "stable"     # improving / worsening / stable
        self.trend_delta        = 0.0          # MAE change second_half - first_half
        self.first_half_mae     = None
        self.second_half_mae    = None

        # Final output
        self.calibration_note   = ""
        self.version            = 1

    def to_dict(self) -> dict:
        return {
            "calibration_note"      : self.calibration_note,
            "generated_at"          : self.generated_at,
            "based_on_n_corrections": self.n_corrections,
            "version"               : self.version,
            "global_mean_gap"       : round(self.global_mean_gap, 2),
            "global_mae"            : round(self.global_mae, 2),
            "global_bias"           : self.global_bias,
            "weak_topics"           : self.weak_topics,
            "weakest_range"         : self.weakest_range,
            "range_maes"            : {
                k: round(v, 2) for k, v in self.range_maes.items()
            },
            "trend"                 : self.trend,
            "trend_delta"           : round(self.trend_delta, 2),
            "first_half_mae"        : (round(self.first_half_mae, 2)
                                       if self.first_half_mae is not None else None),
            "second_half_mae"       : (round(self.second_half_mae, 2)
                                       if self.second_half_mae is not None else None),
        }


# ─────────────────────────────────────────────────────────────
#  LEARNING AGENT
# ─────────────────────────────────────────────────────────────

class LearningAgent:
    """
    Active analysis engine that plugs into FeedbackMemory.

    Usage
    -----
    # Create once alongside FeedbackMemory:
        self.learning_agent = LearningAgent(data_layer=self.db)

    # Call inside store_correction() after appending to self.records:
        if len(self.records) % ANALYSIS_TRIGGER_EVERY == 0:
            self.learning_agent.run_cycle(self.records)

    # Call inside _build_learning_context() to get the note:
        note = self.learning_agent.get_calibration_note()
    """

    def __init__(self, data_layer):
        """
        Parameters
        ----------
        data_layer : MongoDataLayer
            The existing data layer — we add 2 new methods to it.
        """
        self.db               = data_layer
        self._cached_result   = None    # last CalibrationResult in RAM
        self._load_from_mongo()         # reload from MongoDB on startup
        logging.info("[LearningAgent] Initialised — analysis every "
                     f"{ANALYSIS_TRIGGER_EVERY} corrections")

    # ── Startup: load last calibration from MongoDB ───────
    def _load_from_mongo(self):
        doc = self.db.load_calibration_note()
        if doc:
            n = doc.get("based_on_n_corrections", 0)
            logging.info(
                f"[LearningAgent] Loaded calibration from MongoDB "
                f"(based on {n} corrections)"
            )
            # Reconstruct a minimal CalibrationResult so get_calibration_note() works
            cr = CalibrationResult(n_corrections=n)
            cr.calibration_note = doc.get("calibration_note", "")
            cr.version          = doc.get("version", 1)
            cr.global_bias      = doc.get("global_bias", "balanced")
            cr.trend            = doc.get("trend", "stable")
            cr.weak_topics      = doc.get("weak_topics", [])
            cr.weakest_range    = doc.get("weakest_range", None)
            cr.range_maes       = doc.get("range_maes", {})
            self._cached_result = cr
        else:
            logging.info("[LearningAgent] No calibration in MongoDB yet")

    # ── Public: trigger a full analysis cycle ─────────────
    def run_cycle(self, records: list) -> CalibrationResult:
        """
        Called automatically every ANALYSIS_TRIGGER_EVERY corrections.
        Runs all 4 analyses, builds calibration note, saves to MongoDB.

        Parameters
        ----------
        records : list[dict]
            All correction records from FeedbackMemory.records (in-memory mirror)

        Returns
        -------
        CalibrationResult
        """
        n = len(records)
        print(f"\n{'═' * 65}")
        print(f"  🧠  LEARNING AGENT — Analysis Cycle Triggered")
        print(f"  📊  Analysing {n} correction(s)...")
        print(f"{'═' * 65}")

        cr = CalibrationResult(n_corrections=n)

        # Preserve version number from last result
        if self._cached_result:
            cr.version = self._cached_result.version + 1

        # ── Run 4 analyses ────────────────────────────────
        self._a1_global_bias(records, cr)
        self._a2_topic_patterns(records, cr)
        self._a3_score_range(records, cr)
        self._a4_trend(records, cr)

        # ── Build the calibration note ────────────────────
        cr.calibration_note = self._build_note(cr)

        # ── Save to MongoDB ───────────────────────────────
        self.db.save_calibration_note(cr.to_dict())

        # ── Cache in RAM ──────────────────────────────────
        self._cached_result = cr

        self._print_cycle_summary(cr)
        return cr

    # ── Public: get note for prompt injection ─────────────
    def get_calibration_note(self) -> str:
        """
        Returns the latest calibration note for prompt injection.
        Returns empty string if no analysis has run yet.
        """
        if self._cached_result and self._cached_result.calibration_note:
            return self._cached_result.calibration_note
        return ""

    # ── Public: get full result for reporting ─────────────
    def get_latest_result(self):
        return self._cached_result

    # ════════════════════════════════════════════════════
    #  A1 — Global Bias Detection
    # ════════════════════════════════════════════════════
    def _a1_global_bias(self, records: list, cr: CalibrationResult):
        """
        Computes mean score_gap and MAE across ALL corrections.
        score_gap = evaluator_score - ai_score
        positive  = AI underscored (human gave more)
        negative  = AI overscored  (human gave less)
        """
        gaps = [
            r["score_gap"]
            for r in records
            if isinstance(r.get("score_gap"), (int, float))
        ]
        if not gaps:
            logging.info("[LearningAgent] A1 — no valid gaps found")
            return

        mean_gap = float(np.mean(gaps))
        mae      = float(np.mean([abs(g) for g in gaps]))

        cr.global_mean_gap = mean_gap
        cr.global_mae      = mae

        if mean_gap > 0.5:
            cr.global_bias = "underscoring"
        elif mean_gap < -0.5:
            cr.global_bias = "overscoring"
        else:
            cr.global_bias = "balanced"

        logging.info(
            f"[LearningAgent] A1 — bias={cr.global_bias} "
            f"mean_gap={mean_gap:+.2f} MAE={mae:.2f}"
        )

    # ════════════════════════════════════════════════════
    #  A2 — Topic Pattern Detection (Simple)
    # ════════════════════════════════════════════════════
    def _a2_topic_patterns(self, records: list, cr: CalibrationResult):
        """
        Groups corrections by topic keyword match.
        For each topic with enough corrections, computes mean gap.
        Flags topics where abs(mean_gap) > 1.0 as weak spots.
        Simple mode: just flags which topics AI is weakest on.
        """
        # Group records by topic
        topic_records = defaultdict(list)

        for r in records:
            question_text = (r.get("question", "") + " " +
                             r.get("student_answer", "")).lower()
            gap = r.get("score_gap")
            if not isinstance(gap, (int, float)):
                continue

            matched = False
            for topic, keywords in TOPIC_GROUPS.items():
                if any(kw in question_text for kw in keywords):
                    topic_records[topic].append(gap)
                    matched = True

            # Bucket unmatched records into "general"
            if not matched:
                topic_records["general"].append(gap)

        weak_topics = []
        for topic, gaps in topic_records.items():
            if len(gaps) < MIN_CORRECTIONS_FOR_TOPIC:
                continue
            mean_gap = float(np.mean(gaps))
            # Only flag as weak if gap is meaningful
            if abs(mean_gap) > 1.0:
                direction = "underscores" if mean_gap > 0 else "overscores"
                weak_topics.append({
                    "topic"    : topic,
                    "direction": direction,
                    "mean_gap" : round(mean_gap, 2),
                    "count"    : len(gaps),
                })

        # Sort by abs gap descending — worst first
        weak_topics.sort(key=lambda x: abs(x["mean_gap"]), reverse=True)
        cr.weak_topics = weak_topics

        logging.info(
            f"[LearningAgent] A2 — {len(weak_topics)} weak topic(s) found: "
            f"{[t['topic'] for t in weak_topics]}"
        )

    # ════════════════════════════════════════════════════
    #  A3 — Score Range Weakness
    # ════════════════════════════════════════════════════
    def _a3_score_range(self, records: list, cr: CalibrationResult):
        """
        Groups corrections by the AI's original score range.
        Finds which range has highest MAE → weakest range.
        """
        buckets = {"low": [], "mid": [], "high": []}

        for r in records:
            ai_score = r.get("ai_score")
            gap      = r.get("score_gap")
            if not isinstance(ai_score, int) or not isinstance(gap, (int, float)):
                continue

            if RANGE_LOW[0] <= ai_score <= RANGE_LOW[1]:
                buckets["low"].append(abs(gap))
            elif RANGE_MID[0] <= ai_score <= RANGE_MID[1]:
                buckets["mid"].append(abs(gap))
            elif RANGE_HIGH[0] <= ai_score <= RANGE_HIGH[1]:
                buckets["high"].append(abs(gap))

        range_maes   = {}
        weakest_mae  = -1
        weakest_name = None

        for name, abs_gaps in buckets.items():
            if abs_gaps:
                mae = float(np.mean(abs_gaps))
                range_maes[name] = mae
                if mae > weakest_mae:
                    weakest_mae  = mae
                    weakest_name = name

        cr.range_maes   = range_maes
        cr.weakest_range = weakest_name

        logging.info(
            f"[LearningAgent] A3 — range MAEs={range_maes} "
            f"weakest={weakest_name}"
        )

    # ════════════════════════════════════════════════════
    #  A4 — Trend Detection
    # ════════════════════════════════════════════════════
    def _a4_trend(self, records: list, cr: CalibrationResult):
        """
        Splits records into first half and second half.
        Compares mean absolute error between the two halves.
        """
        overrides = [
            r for r in records
            if isinstance(r.get("score_gap"), (int, float))
            and r.get("score_gap") != 0
        ]

        if len(overrides) < MIN_CORRECTIONS_FOR_TREND:
            cr.trend = "stable"
            cr.trend_delta = 0.0
            logging.info(
                f"[LearningAgent] A4 — not enough overrides for trend "
                f"({len(overrides)} < {MIN_CORRECTIONS_FOR_TREND})"
            )
            return

        n          = len(overrides)
        first_half = overrides[:n // 2]
        second_half = overrides[n // 2:]

        first_mae  = float(np.mean([abs(r["score_gap"]) for r in first_half]))
        second_mae = float(np.mean([abs(r["score_gap"]) for r in second_half]))
        delta      = second_mae - first_mae   # negative = improving

        cr.first_half_mae  = first_mae
        cr.second_half_mae = second_mae
        cr.trend_delta     = delta

        if delta < -0.3:
            cr.trend = "improving"
        elif delta > 0.3:
            cr.trend = "worsening"
        else:
            cr.trend = "stable"

        logging.info(
            f"[LearningAgent] A4 — trend={cr.trend} "
            f"first_MAE={first_mae:.2f} second_MAE={second_mae:.2f} "
            f"delta={delta:+.2f}"
        )

    # ════════════════════════════════════════════════════
    #  BUILD CALIBRATION NOTE
    # ════════════════════════════════════════════════════
    def _build_note(self, cr: CalibrationResult) -> str:
        """
        Assembles the 4 analysis results into one human-readable
        calibration note for injection into the LLM prompt.
        """
        SEP  = "═" * 55
        THIN = "─" * 55
        lines = [
            f"\n{SEP}",
            f"LEARNING AGENT CALIBRATION  "
            f"(v{cr.version} — based on {cr.n_corrections} human corrections)",
            SEP,
        ]

        # ── A1 — Global bias ─────────────────────────────
        lines.append("\n📊  GLOBAL SCORING BIAS:")
        if cr.global_bias == "underscoring":
            lines.append(
                f"   You have been UNDERSCORING by an average of "
                f"{cr.global_mean_gap:+.1f} points (MAE={cr.global_mae:.1f} pts)."
            )
            lines.append(
                "   → Adjust scores UPWARD by 1-2 points, especially "
                "for partial or borderline answers."
            )
        elif cr.global_bias == "overscoring":
            lines.append(
                f"   You have been OVERSCORING by an average of "
                f"{abs(cr.global_mean_gap):.1f} points (MAE={cr.global_mae:.1f} pts)."
            )
            lines.append(
                "   → Adjust scores DOWNWARD by 1-2 points. "
                "Be stricter on incomplete or vague answers."
            )
        else:
            lines.append(
                f"   Your global scoring is WELL CALIBRATED "
                f"(mean gap={cr.global_mean_gap:+.2f} pts, MAE={cr.global_mae:.1f} pts)."
            )
            lines.append("   → Continue current evaluation approach.")

        # ── A2 — Topic weaknesses ─────────────────────────
        lines.append(f"\n{THIN}")
        lines.append("🎯  TOPIC WEAKNESSES:")
        if cr.weak_topics:
            for t in cr.weak_topics[:3]:   # show top 3 worst topics
                lines.append(
                    f"   • {t['topic'].upper()}: AI {t['direction']} "
                    f"by {abs(t['mean_gap']):.1f} pts on average "
                    f"({t['count']} correction(s))"
                )
            lines.append(
                "   → Pay extra attention to these topics when evaluating."
            )
        else:
            lines.append(
                "   No specific topic weaknesses detected yet — "
                "scoring is consistent across topics."
            )

        # ── A3 — Score range weakness ─────────────────────
        lines.append(f"\n{THIN}")
        lines.append("📏  SCORE RANGE ACCURACY:")
        range_labels = {
            "low" : "low scores (1-4)",
            "mid" : "mid-range scores (5-7)",
            "high": "high scores (8-10)",
        }
        if cr.weakest_range and cr.range_maes:
            weakest_label = range_labels.get(cr.weakest_range, cr.weakest_range)
            weakest_mae   = cr.range_maes.get(cr.weakest_range, 0)
            lines.append(
                f"   Your least accurate range is {weakest_label} "
                f"(MAE={weakest_mae:.1f} pts)."
            )
            if cr.weakest_range == "mid":
                lines.append(
                    "   → Give extra thought to borderline answers (5-7). "
                    "Partial credit decisions are your weakest area."
                )
            elif cr.weakest_range == "low":
                lines.append(
                    "   → Be careful when scoring poor answers. "
                    "Ensure 1-4 scores are justified with specific gaps."
                )
            else:
                lines.append(
                    "   → Be careful when scoring strong answers. "
                    "Ensure 8-10 scores reflect genuinely complete responses."
                )
        else:
            lines.append(
                "   Not enough range data yet — evaluate across all score ranges."
            )

        # ── A4 — Trend ────────────────────────────────────
        lines.append(f"\n{THIN}")
        lines.append("📈  ACCURACY TREND:")
        if cr.trend == "improving":
            lines.append(
                f"   Your accuracy is IMPROVING ↑ "
                f"(MAE dropped from {cr.first_half_mae:.1f} to "
                f"{cr.second_half_mae:.1f} pts)."
            )
            lines.append("   → Continue current evaluation approach.")
        elif cr.trend == "worsening":
            lines.append(
                f"   ⚠️  Your accuracy is WORSENING ↓ "
                f"(MAE rose from {cr.first_half_mae:.1f} to "
                f"{cr.second_half_mae:.1f} pts)."
            )
            lines.append(
                "   → Apply ALL calibration notes above more strictly. "
                "You are drifting from human judgment."
            )
        else:
            lines.append(
                "   Your accuracy trend is STABLE → "
                f"(delta={cr.trend_delta:+.2f} pts)."
            )

        lines.append(f"\n{SEP}\n")
        return "\n".join(lines)

    # ── Pretty print cycle summary ────────────────────────
    def _print_cycle_summary(self, cr: CalibrationResult):
        trend_icons = {
            "improving": "↑ IMPROVING",
            "worsening": "↓ WORSENING ⚠️",
            "stable"   : "→ STABLE",
        }
        bias_icons = {
            "underscoring": "⬇️  UNDERSCORING",
            "overscoring" : "⬆️  OVERSCORING",
            "balanced"    : "✅  BALANCED",
        }
        THIN = "─" * 65
        print(f"\n{THIN}")
        print(f"  ✅  Learning Agent Cycle v{cr.version} Complete")
        print(THIN)
        print(f"  Corrections analysed : {cr.n_corrections}")
        print(f"  Global bias          : {bias_icons.get(cr.global_bias, cr.global_bias)}"
              f"  (mean gap={cr.global_mean_gap:+.2f} pts)")
        print(f"  Global MAE           : {cr.global_mae:.2f} pts")
        if cr.weak_topics:
            topics = ", ".join(t["topic"] for t in cr.weak_topics[:3])
            print(f"  Weak topics          : {topics}")
        else:
            print(f"  Weak topics          : None detected")
        if cr.weakest_range:
            print(f"  Weakest score range  : {cr.weakest_range} "
                  f"(MAE={cr.range_maes.get(cr.weakest_range, 0):.2f} pts)")
        print(f"  Accuracy trend       : {trend_icons.get(cr.trend, cr.trend)}")
        print(f"  Calibration note v{cr.version} → saved to MongoDB feedback_memory_meta")
        print(f"{THIN}\n")


# ─────────────────────────────────────────────────────────────
#  MONGO METHODS — add these to MongoDataLayer in evaluation_system.py
# ─────────────────────────────────────────────────────────────

CALIBRATION_COLLECTION = "feedback_memory_meta"


def mongo_save_calibration_note(db_instance, note_dict: dict):
    """
    Upserts the calibration note into feedback_memory_meta.
    There is always exactly ONE document in this collection.
    Call as: self.db.feedback_memory_meta.replace_one(...)
    """
    db_instance.db[CALIBRATION_COLLECTION].replace_one(
        {},           # match any document (there's only one)
        note_dict,    # replace with new note
        upsert=True   # create if not exists
    )
    logging.info(
        f"[LearningAgent] Calibration note v{note_dict.get('version', '?')} "
        f"saved to MongoDB {CALIBRATION_COLLECTION}"
    )


def mongo_load_calibration_note(db_instance) -> dict:
    """
    Loads the single calibration document from feedback_memory_meta.
    Returns {} if not found.
    """
    doc = db_instance.db[CALIBRATION_COLLECTION].find_one({}, {"_id": 0})
    return doc or {}


# ─────────────────────────────────────────────────────────────
#  UPGRADED _build_learning_context — replaces the existing one
#  in EvaluationAgent inside evaluation_system.py
# ─────────────────────────────────────────────────────────────

def build_learning_context_upgraded(memory,
                                    learning_agent,
                                    question      : str,
                                    student_answer: str,
                                    max_shots     : int = 3) -> tuple:
    """
    Upgraded replacement for EvaluationAgent._build_learning_context().

    Order in prompt:
      1. Calibration note  (pattern summary — Learning Agent output)
      2. Raw past corrections (specific examples — FeedbackMemory output)

    Parameters
    ----------
    memory          : FeedbackMemory instance
    learning_agent  : LearningAgent instance
    question        : str
    student_answer  : str
    max_shots       : int  — max raw corrections to append

    Returns
    -------
    (context_string, n_shots, similar_records)
    context_string  : str   — full context for LLM prompt injection
    n_shots         : int   — number of raw corrections injected
    similar_records : list  — the raw correction dicts (for self-reflection Q2)
    """
    SEP  = "═" * 55
    THIN = "─" * 55
    parts = []

    # ── Part 1: Calibration note (always first) ───────────
    calibration_note = learning_agent.get_calibration_note()
    if calibration_note:
        parts.append(calibration_note)

    # ── Part 2: Raw past corrections ──────────────────────
    similar = memory.retrieve_similar(
        question=question,
        student_answer=student_answer,
        top_k=max_shots,
    )

    if similar:
        raw_lines = [
            f"\n{SEP}",
            "SPECIFIC PAST CORRECTION EXAMPLES:",
            THIN,
        ]
        for i, rec in enumerate(similar, 1):
            raw_lines.append(
                f"\nExample {i}:"
                f"\n  Question  : {rec['question'][:120]}..."
                f"\n  AI gave   : {rec['ai_score']} / 10"
                f"\n  Human gave: {rec['evaluator_score']} / 10"
                f"\n  Gap       : {rec['score_gap']:+d} pts"
                f"\n  Reason    : {rec['override_reason']}"
                f"\n  Note      : {rec['evaluator_feedback'][:150]}"
            )
        raw_lines.append(f"\n{SEP}")
        parts.append("\n".join(raw_lines))

    full_context = "\n".join(parts)
    n_shots      = len(similar)
    return full_context, n_shots, similar


# ─────────────────────────────────────────────────────────────
#  INTEGRATION PATCH — exact changes for evaluation_system.py
# ─────────────────────────────────────────────────────────────
"""
STEP 1 — Add import at the top of evaluation_system.py:

    from learning_agent import (
        LearningAgent,
        CalibrationResult,
        ANALYSIS_TRIGGER_EVERY,
        mongo_save_calibration_note,
        mongo_load_calibration_note,
        build_learning_context_upgraded,
    )

─────────────────────────────────────────────────────────────
STEP 2 — Add 2 methods to MongoDataLayer class:

    def save_calibration_note(self, note_dict: dict):
        mongo_save_calibration_note(self, note_dict)

    def load_calibration_note(self) -> dict:
        return mongo_load_calibration_note(self)

─────────────────────────────────────────────────────────────
STEP 3 — In FeedbackMemory.__init__(), add one line:

    def __init__(self, embedder, data_layer):
        self.embedder  = embedder
        self.db        = data_layer
        self.records   = []
        self.index     = None
        self.dim       = None
        self.learning_agent = LearningAgent(data_layer=data_layer)  ← ADD
        self._load_and_rebuild()

─────────────────────────────────────────────────────────────
STEP 4 — In FeedbackMemory.store_correction(), add after
  self.records.append(record) and self.index.add(emb):

        # ── Learning Agent: trigger analysis every 5 corrections ──
        if len(self.records) % ANALYSIS_TRIGGER_EVERY == 0:
            self.learning_agent.run_cycle(self.records)

─────────────────────────────────────────────────────────────
STEP 5 — In EvaluationAgent.__init__(), store reference to memory:

    (already done — self.memory = feedback_memory exists)

─────────────────────────────────────────────────────────────
STEP 6 — In EvaluationAgent.evaluate(), replace the existing
  _build_learning_context() call:

  OLD:
    learning_ctx, n_shots = self._build_learning_context(
        question, self.student_answer)

  NEW:
    learning_ctx, n_shots, similar = build_learning_context_upgraded(
        memory         = self.memory,
        learning_agent = self.memory.learning_agent,
        question       = question,
        student_answer = self.student_answer,
        max_shots      = MAX_CONTEXT_SHOTS,
    )

  Also update the print line:
  OLD:
    print(f"[MEMORY] ✓ Injecting {n_shots} past correction(s) into prompt")
  NEW:
    calib = self.memory.learning_agent.get_calibration_note()
    if calib:
        print("[MEMORY] ✓ Calibration note injected into prompt")
    if n_shots > 0:
        print(f"[MEMORY] ✓ Injecting {n_shots} raw correction(s) into prompt")

─────────────────────────────────────────────────────────────
STEP 7 — In save_evaluation() call inside main(), add one field:

    data_layer.save_evaluation({
        **result,
        ...existing fields...,
        "calibration_version": (
            memory.learning_agent.get_latest_result().version
            if memory.learning_agent.get_latest_result() else 0
        ),
    })

  This tracks which calibration version was active during each evaluation.
"""