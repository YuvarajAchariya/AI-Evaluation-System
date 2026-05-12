"""
=============================================================
  SELF-REFLECTION ENGINE  —  Agentic AI Assistive Evaluation System
  File: self_reflection.py  (place beside evaluation_system.py)
=============================================================

  PURPOSE:
    Adds internal self-reflection to EvaluationAgent.evaluate().
    Runs INSIDE evaluate() after the first LLM call returns,
    BEFORE the result is handed to QAAgent or print_report().

    Three reflection questions:
      Q1 — Did I use the RAG context meaningfully?
      Q2 — Does my score align with past correction patterns?
      Q3 — Am I showing anchoring bias?  (too harsh / too lenient)

    If self_confidence ends up "low" → triggers one self-correction
    (a small focused second LLM call to revise the score).

    The reflection report is attached to result["self_reflection"]
    and saved to MongoDB automatically via save_evaluation().

  CONNECTS TO:
    qa_agent.py  — Check 4 reads self_reflection.self_confidence
                   and adds a confidence warning if "low"

=============================================================
"""

import re
import logging
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────
#  CONSTANTS
# ─────────────────────────────────────────────────────────────

# How many keywords must overlap between RAG chunks and feedback
# for RAG to be considered "used meaningfully"
RAG_OVERLAP_THRESHOLD = 3

# If past corrections show AI was off by this many points on average,
# flag as possible pattern repeat
PATTERN_GAP_THRESHOLD = 1.5

# Anchoring: if answer is very short (chars) but score is high → suspicious
SHORT_ANSWER_CHAR_LIMIT  = 80
SHORT_ANSWER_HIGH_SCORE  = 7

# Anchoring: if answer is very long (chars) but score is very low → suspicious
LONG_ANSWER_CHAR_LIMIT   = 400
LONG_ANSWER_LOW_SCORE    = 3

# Self-correction prompt max tokens — keep small, this is a targeted fix
SELF_CORRECTION_MAX_TOKENS = 600


# ─────────────────────────────────────────────────────────────
#  HELPER — keyword extractor
# ─────────────────────────────────────────────────────────────

def _extract_keywords(text: str, min_length: int = 4) -> set:
    """
    Extract meaningful words from text.
    Filters out short stop-words, returns lowercase set.
    """
    STOP_WORDS = {
        "this", "that", "with", "have", "from", "they", "will",
        "been", "were", "also", "their", "what", "which", "when",
        "does", "some", "than", "then", "into", "your", "about",
        "answer", "student", "correct", "question", "marks", "score",
        "evaluation", "feedback", "explain", "explanation",
    }
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    return {w for w in words if len(w) >= min_length and w not in STOP_WORDS}


# ─────────────────────────────────────────────────────────────
#  REFLECTION REPORT  —  what SelfReflectionEngine returns
# ─────────────────────────────────────────────────────────────

class ReflectionReport:
    """
    Holds all findings from the 3 reflection questions.
    Attached to result["self_reflection"] before evaluate() returns.
    """

    def __init__(self):
        # Q1
        self.rag_used_meaningfully  = True
        self.rag_overlap_count      = 0
        self.rag_keywords_found     = []

        # Q2
        self.pattern_alignment      = "consistent"   # consistent / possible_underscore / possible_overscore
        self.pattern_mean_gap       = 0.0
        self.pattern_note           = ""

        # Q3
        self.anchoring_detected     = False
        self.anchoring_note         = ""

        # Overall
        self.self_confidence        = "high"         # high / medium / low
        self.reflection_notes       = []
        self.self_correction_applied = False
        self.original_score         = None           # set if correction applied
        self.timestamp              = datetime.now(timezone.utc).isoformat()

    def flag(self, note: str):
        """Add a reflection note — accumulates all findings."""
        self.reflection_notes.append(note)

    def compute_confidence(self):
        """
        Derive overall self_confidence from findings.
        Rules:
          Any 2+ flags          → low
          Exactly 1 flag        → medium
          No flags              → high
        """
        flags = 0
        if not self.rag_used_meaningfully:
            flags += 1
        if self.pattern_alignment != "consistent":
            flags += 1
        if self.anchoring_detected:
            flags += 1

        if flags >= 2:
            self.self_confidence = "low"
        elif flags == 1:
            self.self_confidence = "medium"
        else:
            self.self_confidence = "high"

    def to_dict(self) -> dict:
        """Serialisable for MongoDB."""
        return {
            "rag_used_meaningfully"   : self.rag_used_meaningfully,
            "rag_overlap_count"       : self.rag_overlap_count,
            "rag_keywords_found"      : self.rag_keywords_found[:10],
            "pattern_alignment"       : self.pattern_alignment,
            "pattern_mean_gap"        : round(self.pattern_mean_gap, 2),
            "pattern_note"            : self.pattern_note,
            "anchoring_detected"      : self.anchoring_detected,
            "anchoring_note"          : self.anchoring_note,
            "self_confidence"         : self.self_confidence,
            "reflection_notes"        : self.reflection_notes,
            "self_correction_applied" : self.self_correction_applied,
            "original_score"          : self.original_score,
            "timestamp"               : self.timestamp,
        }


# ─────────────────────────────────────────────────────────────
#  SELF-REFLECTION ENGINE
# ─────────────────────────────────────────────────────────────

class SelfReflectionEngine:
    """
    Plugs into EvaluationAgent as self.reflector.

    Usage inside EvaluationAgent.evaluate():

        report = self.reflector.reflect(
            result            = result,
            rag_chunks        = rag_context,
            similar_corrections = similar,   # from memory.retrieve_similar()
            student_answer    = self.student_answer,
            llm               = self.llm,
            question          = question,
            correct_answer    = self.correct_answer,
        )
        result["self_reflection"] = report.to_dict()

        # self_correction already applied to result["score"] if triggered
    """

    def __init__(self):
        logging.info("[SelfReflection] Engine initialised — 3 questions active")

    # ── Public entry point ────────────────────────────────
    def reflect(self,
                result              : dict,
                rag_chunks          : list,
                similar_corrections : list,
                student_answer      : str,
                llm,                          # GroqLLM instance
                question            : str,
                correct_answer      : str) -> ReflectionReport:
        """
        Run all 3 reflection questions. If confidence ends up "low",
        trigger one self-correction LLM call.

        Returns ReflectionReport (attach to result["self_reflection"]).
        Note: if self-correction runs, result["score"] and result["grade"]
        are updated IN PLACE before this method returns.
        """
        report = ReflectionReport()

        score = result.get("score")
        if not isinstance(score, int):
            # Can't reflect meaningfully on a non-integer score
            report.flag("Score is not an integer — reflection skipped")
            report.self_confidence = "low"
            return report

        # ── Run the 3 questions ───────────────────────────
        self._q1_rag_usage(result, rag_chunks, report)
        self._q2_pattern_alignment(result, similar_corrections, report)
        self._q3_anchoring_bias(result, student_answer, report)

        # ── Compute overall confidence ────────────────────
        report.compute_confidence()

        self._print_reflection_summary(report, score)

        # ── Self-correction if confidence is low ──────────
        if report.self_confidence == "low":
            self._self_correct(
                result         = result,
                report         = report,
                llm            = llm,
                question       = question,
                correct_answer = correct_answer,
                student_answer = student_answer,
            )

        return report

    # ════════════════════════════════════════════════════
    #  Q1 — RAG Usage Check
    # ════════════════════════════════════════════════════
    def _q1_rag_usage(self, result: dict,
                      rag_chunks: list, report: ReflectionReport):
        """
        Checks if the LLM's feedback shares meaningful vocabulary
        with the retrieved RAG chunks.

        If overlap < RAG_OVERLAP_THRESHOLD → RAG was likely ignored.
        """
        if not rag_chunks:
            # No RAG chunks were retrieved — not the LLM's fault
            report.rag_used_meaningfully = True
            report.flag("RAG returned no chunks — cannot check RAG usage")
            logging.info("[SelfReflection] Q1 — No RAG chunks available, skipping")
            return

        # Keywords from all RAG chunks combined
        rag_text     = " ".join(rag_chunks)
        rag_keywords = _extract_keywords(rag_text)

        # Keywords from the LLM's feedback fields
        feedback_text = " ".join([
            str(result.get("conceptual_accuracy", "")),
            str(result.get("completeness",        "")),
            str(result.get("detailed_feedback",   "")),
        ])
        feedback_keywords = _extract_keywords(feedback_text)

        # Overlap = words that appear in both
        overlap = rag_keywords & feedback_keywords
        count   = len(overlap)

        report.rag_overlap_count  = count
        report.rag_keywords_found = sorted(list(overlap))[:15]

        if count < RAG_OVERLAP_THRESHOLD:
            report.rag_used_meaningfully = False
            note = (
                f"RAG context appears unused — only {count} keyword(s) "
                f"overlap between retrieved chunks and feedback "
                f"(threshold: {RAG_OVERLAP_THRESHOLD}). "
                f"LLM may have evaluated from general knowledge alone."
            )
            report.flag(note)
            logging.warning(f"[SelfReflection] Q1 FAIL — overlap={count}")
        else:
            report.rag_used_meaningfully = True
            logging.info(
                f"[SelfReflection] Q1 PASS — "
                f"RAG overlap={count} keywords: {sorted(overlap)[:5]}"
            )

    # ════════════════════════════════════════════════════
    #  Q2 — Pattern Alignment
    # ════════════════════════════════════════════════════
    def _q2_pattern_alignment(self, result: dict,
                               similar_corrections: list,
                               report: ReflectionReport):
        """
        Looks at past corrections retrieved from FeedbackMemory.
        Computes mean score_gap (evaluator_score - ai_score).

        If mean gap > +PATTERN_GAP_THRESHOLD → AI historically underscores
            → flag possible_underscore
        If mean gap < -PATTERN_GAP_THRESHOLD → AI historically overscores
            → flag possible_overscore
        """
        if not similar_corrections:
            report.pattern_alignment = "consistent"
            report.pattern_note      = "No past corrections available for comparison"
            logging.info("[SelfReflection] Q2 — No past corrections, skipping")
            return

        # score_gap = evaluator_score - ai_score
        # positive gap → AI underscored (human gave more)
        # negative gap → AI overscored (human gave less)
        gaps = [
            r.get("score_gap", 0)
            for r in similar_corrections
            if isinstance(r.get("score_gap"), (int, float))
        ]

        if not gaps:
            report.pattern_alignment = "consistent"
            report.pattern_note      = "Past corrections had no valid score_gap data"
            return

        mean_gap = sum(gaps) / len(gaps)
        report.pattern_mean_gap = mean_gap

        current_score = result.get("score", 5)

        if mean_gap > PATTERN_GAP_THRESHOLD:
            report.pattern_alignment = "possible_underscore"
            note = (
                f"Past {len(gaps)} similar correction(s) show AI underscored "
                f"by an average of {mean_gap:+.1f} pts. "
                f"Current score={current_score} may be too low — "
                f"consider {current_score + round(mean_gap)} as a fairer score."
            )
            report.pattern_note = note
            report.flag(note)
            logging.warning(
                f"[SelfReflection] Q2 FAIL — possible underscore "
                f"mean_gap={mean_gap:+.2f}"
            )

        elif mean_gap < -PATTERN_GAP_THRESHOLD:
            report.pattern_alignment = "possible_overscore"
            note = (
                f"Past {len(gaps)} similar correction(s) show AI overscored "
                f"by an average of {mean_gap:+.1f} pts. "
                f"Current score={current_score} may be too high — "
                f"consider {max(1, current_score + round(mean_gap))} as a fairer score."
            )
            report.pattern_note = note
            report.flag(note)
            logging.warning(
                f"[SelfReflection] Q2 FAIL — possible overscore "
                f"mean_gap={mean_gap:+.2f}"
            )

        else:
            report.pattern_alignment = "consistent"
            report.pattern_note = (
                f"Score is consistent with past correction pattern "
                f"(mean gap={mean_gap:+.2f} pts, threshold=±{PATTERN_GAP_THRESHOLD})"
            )
            logging.info(
                f"[SelfReflection] Q2 PASS — "
                f"pattern consistent mean_gap={mean_gap:+.2f}"
            )

    # ════════════════════════════════════════════════════
    #  Q3 — Anchoring Bias Detection
    # ════════════════════════════════════════════════════
    def _q3_anchoring_bias(self, result: dict,
                            student_answer: str,
                            report: ReflectionReport):
        """
        Detects two anchoring bias cases:

        Case A — Short answer, high score:
            Student wrote very little but got a high score.
            A short answer can only score high if it's perfectly concise.
            Flag it so the agent double-checks.

        Case B — Long answer, very low score:
            Student wrote a lot but got a very low score.
            A detailed answer rarely deserves < 3 unless completely wrong.
            Flag it so the agent double-checks.
        """
        score       = result.get("score", 5)
        answer_len  = len(student_answer.strip())

        # Case A — suspiciously high score for a short answer
        if (answer_len < SHORT_ANSWER_CHAR_LIMIT
                and isinstance(score, int)
                and score >= SHORT_ANSWER_HIGH_SCORE):
            note = (
                f"Anchoring bias (Case A): Student answer is very short "
                f"({answer_len} chars) but received score={score}/10. "
                f"Verify the answer is genuinely complete and concise, "
                f"not just brief."
            )
            report.anchoring_detected = True
            report.anchoring_note     = note
            report.flag(note)
            logging.warning(
                f"[SelfReflection] Q3 FAIL Case A — "
                f"len={answer_len} score={score}"
            )

        # Case B — suspiciously low score for a long answer
        elif (answer_len > LONG_ANSWER_CHAR_LIMIT
                and isinstance(score, int)
                and score <= LONG_ANSWER_LOW_SCORE):
            note = (
                f"Anchoring bias (Case B): Student answer is detailed "
                f"({answer_len} chars) but received score={score}/10. "
                f"Verify the answer is genuinely wrong/irrelevant, "
                f"not just penalised for length."
            )
            report.anchoring_detected = True
            report.anchoring_note     = note
            report.flag(note)
            logging.warning(
                f"[SelfReflection] Q3 FAIL Case B — "
                f"len={answer_len} score={score}"
            )

        else:
            report.anchoring_detected = False
            logging.info(
                f"[SelfReflection] Q3 PASS — "
                f"no anchoring bias (len={answer_len} score={score})"
            )

    # ════════════════════════════════════════════════════
    #  SELF-CORRECTION  —  targeted second LLM call
    # ════════════════════════════════════════════════════
    def _self_correct(self,
                      result        : dict,
                      report        : ReflectionReport,
                      llm,
                      question      : str,
                      correct_answer: str,
                      student_answer: str):
        """
        When self_confidence is "low", makes a small focused second LLM call.

        Does NOT repeat the full evaluation.
        Only asks: "Given these specific concerns, should your score change?"

        Updates result["score"] and result["grade"] in place if LLM revises.
        Sets report.self_correction_applied = True if a change was made.
        """
        original_score = result.get("score")
        report.original_score = original_score

        print(f"\n  🔄  [SelfReflection] Confidence LOW — triggering self-correction...")
        print(f"      Original score : {original_score}/10")
        print(f"      Issues found   : {len(report.reflection_notes)}")

        issues_text = "\n".join(
            f"  - {note}" for note in report.reflection_notes
        )

        correction_system = """You are reviewing your own evaluation output.
You previously scored a student answer. Now re-examine ONLY the score.
Respond with ONLY this JSON (nothing else):
{
  "revised_score": <integer 1-10>,
  "score_changed": <true or false>,
  "revision_reason": "<one sentence explaining if/why you changed the score>"
}"""

        correction_prompt = f"""
YOUR PREVIOUS EVALUATION:
  Score         : {original_score} / 10
  Grade         : {result.get('grade', 'N/A')}
  Summary       : {result.get('summary', '')}
  Detailed note : {str(result.get('detailed_feedback', ''))[:300]}

QUESTION:
{question[:300]}

CORRECT ANSWER (first 300 chars):
{correct_answer[:300]}

STUDENT ANSWER (first 300 chars):
{student_answer[:300]}

SELF-REFLECTION CONCERNS DETECTED:
{issues_text}

Should your score of {original_score}/10 change given these concerns?
If yes, provide a revised score. If no, return the same score with score_changed=false.
"""

        try:
            raw, model = llm.complete(
                system_prompt = correction_system,
                user_prompt   = correction_prompt,
                max_tokens    = SELF_CORRECTION_MAX_TOKENS,
            )

            # Parse the small JSON response
            match = re.search(r'\{.*?\}', raw, re.DOTALL)
            if not match:
                print("  ⚠️  [SelfReflection] Self-correction response not parseable — keeping original score")
                return

            correction = __import__('json').loads(match.group())
            revised    = correction.get("revised_score")
            changed    = correction.get("score_changed", False)
            reason     = correction.get("revision_reason", "")

            if (changed
                    and isinstance(revised, int)
                    and 1 <= revised <= 10
                    and revised != original_score):

                # Compute new grade using same logic as score_to_grade()
                grade_map = {10:"A+",9:"A",8:"B+",7:"B",6:"C",5:"D"}
                new_grade = grade_map.get(revised, "F")

                result["score"] = revised
                result["grade"] = new_grade
                result["self_correction_note"] = reason

                report.self_correction_applied = True

                print(f"  ✅  [SelfReflection] Score revised: "
                      f"{original_score} → {revised}/10  ({new_grade})")
                print(f"      Reason: {reason}")

            else:
                print(f"  ✅  [SelfReflection] Score confirmed: "
                      f"{original_score}/10 — no change needed")
                print(f"      Reason: {reason}")

        except Exception as e:
            logging.warning(
                f"[SelfReflection] Self-correction LLM call failed: {e} "
                f"— keeping original score"
            )
            print(f"  ⚠️  [SelfReflection] Self-correction failed ({e}) "
                  f"— keeping original score {original_score}/10")

    # ── Pretty print reflection summary ──────────────────
    def _print_reflection_summary(self, report: ReflectionReport, score: int):
        THIN = "─" * 65
        confidence_icons = {"high": "🟢", "medium": "🟡", "low": "🔴"}
        icon = confidence_icons.get(report.self_confidence, "⚪")

        print(f"\n{THIN}")
        print(f"  🪞  SELF-REFLECTION REPORT")
        print(THIN)
        print(f"  Score under review : {score}/10")
        print(f"  Self-confidence    : {icon} {report.self_confidence.upper()}")
        print()

        # Q1
        q1_icon = "✅" if report.rag_used_meaningfully else "⚠️ "
        print(f"  Q1 RAG Usage       : {q1_icon}  "
              f"overlap={report.rag_overlap_count} keyword(s)")

        # Q2
        q2_icons = {
            "consistent"         : "✅",
            "possible_underscore": "⚠️ ",
            "possible_overscore" : "⚠️ ",
        }
        q2_icon = q2_icons.get(report.pattern_alignment, "⚪")
        print(f"  Q2 Pattern         : {q2_icon}  "
              f"{report.pattern_alignment}  "
              f"(mean gap {report.pattern_mean_gap:+.2f} pts)")

        # Q3
        q3_icon = "⚠️ " if report.anchoring_detected else "✅"
        print(f"  Q3 Anchoring bias  : {q3_icon}  "
              f"{'detected' if report.anchoring_detected else 'none'}")

        if report.reflection_notes:
            print(f"\n  📋  Notes:")
            for note in report.reflection_notes:
                print(f"     • {note[:100]}")

        if report.self_confidence == "low":
            print(f"\n  → Self-correction will be attempted...")

        print(THIN)


# ─────────────────────────────────────────────────────────────
#  INTEGRATION PATCH — exact changes for evaluation_system.py
# ─────────────────────────────────────────────────────────────
"""
STEP 1 — Add import at the top of evaluation_system.py:

    from self_reflection import SelfReflectionEngine

─────────────────────────────────────────────────────────────
STEP 2 — In EvaluationAgent.__init__(), add one line:

    def __init__(self, embedder, feedback_memory):
        self.rag     = RAGEngine(embedder)
        self.llm     = GroqLLM(GROQ_API_KEY)
        self.memory  = feedback_memory
        self.reflector = SelfReflectionEngine()      ← ADD THIS

─────────────────────────────────────────────────────────────
STEP 3 — In EvaluationAgent.evaluate(), after _parse_response()
  and before the result["model_used"] line, add:

    result = self._parse_response(raw_response)

    # ── Self-reflection ───────────────────────────────────
    reflection_report = self.reflector.reflect(
        result              = result,
        rag_chunks          = rag_context,
        similar_corrections = similar,       # already retrieved above
        student_answer      = self.student_answer,
        llm                 = self.llm,
        question            = question,
        correct_answer      = self.correct_answer,
    )
    result["self_reflection"] = reflection_report.to_dict()
    # ─────────────────────────────────────────────────────

    result["model_used"] = model_used      ← this line already exists

─────────────────────────────────────────────────────────────
STEP 4 — In evaluate(), you need to expose `similar` outside
  _build_learning_context(). Change _build_learning_context()
  to also return the similar list:

    def _build_learning_context(self, question, student_answer):
        similar = self.memory.retrieve_similar(...)
        ...
        return "\n".join(lines), len(similar), similar   ← add `similar`

    Then in evaluate():
        learning_ctx, n_shots, similar = self._build_learning_context(...)
                                                         ← unpack 3 values

─────────────────────────────────────────────────────────────
STEP 5 — In qa_agent.py _check4_confidence(), add this block
  AFTER the existing confidence checks:

    # Read self-reflection confidence from EvaluationAgent
    sr = result.get("self_reflection", {})
    if sr.get("self_confidence") == "low":
        notes = sr.get("reflection_notes", [])
        qa.warn(
            f"EvaluationAgent self-reflection flagged LOW confidence. "
            f"Issues: {'; '.join(notes[:2])}"
        )
    elif sr.get("self_confidence") == "medium":
        qa.warn(
            "EvaluationAgent self-reflection flagged MEDIUM confidence — "
            "minor concerns detected internally."
        )

  This connects self_reflection → QAAgent confidence warning automatically.
"""