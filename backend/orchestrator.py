"""
=============================================================
  ORCHESTRATOR AGENT  —  Agentic AI Assistive Evaluation System
  File: orchestrator.py  (place beside evaluation_system.py)
=============================================================

  PURPOSE:
    Replaces the raw main() loop in evaluation_system.py with a
    proper Orchestrator Agent that plans, monitors, adapts, and
    summarizes every evaluation session.

    Four responsibilities:
      1. PRE-SESSION PLANNING   — risk-order pairs, check calibration
      2. MID-SESSION MONITORING — watch for patterns, fire adaptation rules
      3. POST-SESSION SUMMARY   — full intelligence report
      4. SESSION PERSISTENCE    — save session doc to MongoDB (sessions collection)

  REPLACES:
    The while-loop body inside main() in evaluation_system.py.
    main() becomes a thin bootstrap that creates OrchestratorAgent
    and calls orchestrator.run_session(base_id).

  CONNECTS TO:
    evaluation_system.py  → MongoDataLayer, FeedbackMemory,
                             EvaluationAgent, check_and_review,
                             print_report
    qa_agent.py           → QAAgent, print_qa_status,
                             print_confidence_warning_inline,
                             print_confidence_warning_separate,
                             attach_qa_failure_flag, MAX_QA_RETRIES
    self_reflection.py    → SelfReflectionEngine (already inside EvaluationAgent)
    learning_agent.py     → LearningAgent (already inside FeedbackMemory)

=============================================================
"""

import sys
import logging
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────
#  CONSTANTS
# ─────────────────────────────────────────────────────────────

CONSECUTIVE_LOW_THRESHOLD  = 2    # warn after this many consecutive low scores
QA_REJECTION_WARN_THRESHOLD = 2   # warn after this many QA rejections in session
LOW_CONFIDENCE_WARN_THRESHOLD = 2 # warn after this many low-confidence results
REVIEW_THRESHOLD           = 5    # must match evaluation_system.py
SESSIONS_COLLECTION        = "sessions"


# ─────────────────────────────────────────────────────────────
#  SESSION PLAN  —  produced by Orchestrator.plan()
# ─────────────────────────────────────────────────────────────

class SessionPlan:
    """
    Holds the pre-session plan for one base_id evaluation.
    Produced by OrchestratorAgent.plan() before any evaluation starts.
    """

    def __init__(self, base_id: str, pairs: list):
        self.base_id              = base_id
        self.original_pairs       = pairs
        self.ordered_pairs        = []       # risk-ordered
        self.risk_notes           = {}       # questionId → risk note string
        self.past_session_found   = False
        self.past_avg_score       = None
        self.calibration_version  = 0
        self.calibration_ready    = False
        self.plan_notes           = []

    def add_plan_note(self, note: str):
        self.plan_notes.append(note)

    def print_plan(self):
        LINE = "═" * 65
        THIN = "─" * 65
        print(f"\n{LINE}")
        print(f"  📋  ORCHESTRATOR — SESSION PLAN  |  base_id: {self.base_id}")
        print(LINE)

        print(f"\n  Questions found    : {len(self.original_pairs)}")
        print(f"  Evaluation order   : risk-ordered (high risk first)\n")

        print(f"  {'#':<4} {'Question ID':<14} {'Risk Level':<12} Note")
        print("  " + "─" * 58)
        for i, pair in enumerate(self.ordered_pairs, 1):
            qid  = pair["questionId"]
            note = self.risk_notes.get(qid, "No past data")
            risk = self._risk_level(pair)
            print(f"  {i:<4} {qid:<14} {risk:<12} {note}")

        print()
        if self.past_session_found:
            print(f"  📂  Past session found — avg score was {self.past_avg_score:.1f}/10")
        else:
            print(f"  📂  No past session for this base_id — fresh evaluation")

        if self.calibration_ready:
            print(f"  🧠  Calibration note v{self.calibration_version} active")
        else:
            print(f"  ⚠️   No calibration note yet — AI evaluating without pattern data")

        if self.plan_notes:
            print(f"\n  📌  Plan notes:")
            for note in self.plan_notes:
                print(f"     • {note}")

        print(f"\n{LINE}\n")

    def _risk_level(self, pair: dict) -> str:
        qid = pair["questionId"]
        note = self.risk_notes.get(qid, "")
        if "HIGH" in note:
            return "🔴 HIGH"
        if "MEDIUM" in note:
            return "🟡 MEDIUM"
        return "🟢 LOW"


# ─────────────────────────────────────────────────────────────
#  SESSION STATE  —  maintained throughout the session
# ─────────────────────────────────────────────────────────────

class SessionState:
    """
    Live session state updated after every question.
    The Orchestrator reads this to fire adaptation rules.
    """

    def __init__(self, base_id: str, calibration_version: int):
        self.base_id                  = base_id
        self.session_start            = datetime.now(timezone.utc).isoformat()
        self.session_end              = None
        self.calibration_version      = calibration_version

        self.results                  = []    # all result dicts
        self.ai_scores                = []
        self.final_scores             = []
        self.question_ids             = []

        self.consecutive_low_scores   = 0
        self.qa_rejections            = 0
        self.low_confidence_count     = 0
        self.self_correction_count    = 0
        self.learning_agent_triggered = False

        self.adaptation_notes         = []
        self.warnings_fired           = set()  # avoid duplicate warnings

    def record_result(self, result: dict, qa_result):
        """Called after each question is fully processed."""
        qid         = result.get("questionId", "?")
        ai_score    = result.get("ai_score",    result.get("score", 0))
        final_score = result.get("final_score", result.get("score", 0))

        self.question_ids.append(qid)
        self.results.append(result)

        if isinstance(ai_score, int):
            self.ai_scores.append(ai_score)
        if isinstance(final_score, int):
            self.final_scores.append(final_score)

        # Consecutive low scores
        if isinstance(final_score, int) and final_score < REVIEW_THRESHOLD:
            self.consecutive_low_scores += 1
        else:
            self.consecutive_low_scores = 0

        # QA rejections
        if qa_result and not qa_result.approved:
            self.qa_rejections += 1

        # Low confidence
        sr = result.get("self_reflection", {})
        if sr.get("self_confidence") == "low":
            self.low_confidence_count += 1

        # Self-corrections
        if sr.get("self_correction_applied"):
            self.self_correction_count += 1

    def avg_ai_score(self) -> float:
        return round(sum(self.ai_scores) / len(self.ai_scores), 2) if self.ai_scores else 0.0

    def avg_final_score(self) -> float:
        return round(sum(self.final_scores) / len(self.final_scores), 2) if self.final_scores else 0.0

    def to_dict(self) -> dict:
        self.session_end = datetime.now(timezone.utc).isoformat()
        return {
            "base_id"                  : self.base_id,
            "session_start"            : self.session_start,
            "session_end"              : self.session_end,
            "questions_evaluated"      : len(self.results),
            "question_ids"             : self.question_ids,
            "average_ai_score"         : self.avg_ai_score(),
            "average_final_score"      : self.avg_final_score(),
            "ai_scores"                : self.ai_scores,
            "final_scores"             : self.final_scores,
            "qa_rejections"            : self.qa_rejections,
            "low_confidence_count"     : self.low_confidence_count,
            "self_correction_count"    : self.self_correction_count,
            "learning_agent_triggered" : self.learning_agent_triggered,
            "calibration_version"      : self.calibration_version,
            "adaptation_notes"         : self.adaptation_notes,
        }


# ─────────────────────────────────────────────────────────────
#  ORCHESTRATOR AGENT
# ─────────────────────────────────────────────────────────────

class OrchestratorAgent:
    """
    The managing agent that coordinates all other agents.

    Usage
    -----
    Replace the main() while-loop body with:

        orchestrator = OrchestratorAgent(
            data_layer = data_layer,
            memory     = memory,
            agent      = agent,
            qa_agent   = qa_agent,
        )
        orchestrator.run_session(base_id)
    """

    def __init__(self, data_layer, memory, agent, qa_agent):
        """
        Parameters
        ----------
        data_layer : MongoDataLayer
        memory     : FeedbackMemory  (contains LearningAgent)
        agent      : EvaluationAgent (contains SelfReflectionEngine)
        qa_agent   : QAAgent
        """
        self.db       = data_layer
        self.memory   = memory
        self.agent    = agent
        self.qa       = qa_agent
        logging.info("[Orchestrator] Agent initialised")

    # ══════════════════════════════════════════════════════
    #  PUBLIC: run one complete session for a base_id
    # ══════════════════════════════════════════════════════

    def run_session(self, base_id: str):
        """
        Full session lifecycle:
          plan → evaluate loop → summarize → save
        """
        # ── Fetch pairs ───────────────────────────────────
        pairs = self.db.get_matched_pairs(base_id)
        if not pairs:
            print(f"\n  ❌  No matched pairs for {base_id}")
            print("  Check questions + extractedanswers collections.\n")
            return

        # ── 1. PLAN ───────────────────────────────────────
        plan = self._plan(base_id, pairs)
        plan.print_plan()

        # ── Initialise session state ──────────────────────
        state = SessionState(
            base_id             = base_id,
            calibration_version = plan.calibration_version,
        )

        # ── 2. EVALUATE LOOP ──────────────────────────────
        for pair in plan.ordered_pairs:
            self._evaluate_one(pair, state, base_id)

        # ── 3. SUMMARIZE + SAVE ───────────────────────────
        self._summarize(state)
        self._save_session(state)

    # ══════════════════════════════════════════════════════
    #  STEP 1 — PLAN
    # ══════════════════════════════════════════════════════

    def _plan(self, base_id: str, pairs: list) -> SessionPlan:
        plan = SessionPlan(base_id=base_id, pairs=pairs)

        # ── Check past sessions for this base_id ──────────
        past = self.db.load_past_session(base_id)
        if past:
            plan.past_session_found = True
            plan.past_avg_score     = past.get("average_final_score", None)
            past_scores             = dict(zip(
                past.get("question_ids", []),
                past.get("final_scores", []),
            ))
            plan.add_plan_note(
                f"Past session found — previous avg score: "
                f"{plan.past_avg_score:.1f}/10"
            )
        else:
            past_scores = {}

        # ── Assign risk scores to each pair ───────────────
        risk_scored = []
        for pair in pairs:
            qid        = pair["questionId"]
            risk_score = 0   # higher = more risky = evaluate first
            note       = ""

            if qid in past_scores:
                prev = past_scores[qid]
                if isinstance(prev, int) and prev < REVIEW_THRESHOLD:
                    risk_score = 3
                    note       = f"HIGH — previously scored {prev}/10"
                elif isinstance(prev, int) and prev < 7:
                    risk_score = 2
                    note       = f"MEDIUM — previously scored {prev}/10"
                else:
                    risk_score = 1
                    note       = f"LOW — previously scored {prev}/10"
            else:
                risk_score = 0
                note       = "No past data"

            plan.risk_notes[qid] = note
            risk_scored.append((risk_score, pair))

        # ── Order by risk descending (high risk first) ────
        risk_scored.sort(key=lambda x: x[0], reverse=True)
        plan.ordered_pairs = [p for _, p in risk_scored]

        # ── Check calibration readiness ───────────────────
        lr = self.memory.learning_agent.get_latest_result()
        if lr and lr.calibration_note:
            plan.calibration_ready   = True
            plan.calibration_version = lr.version
        else:
            plan.add_plan_note(
                "No calibration note available yet — "
                "AI will evaluate without pattern guidance. "
                "Calibration activates after 5 corrections."
            )

        # ── Warn if many high-risk questions ──────────────
        high_risk = [
            qid for qid, note in plan.risk_notes.items()
            if "HIGH" in note
        ]
        if len(high_risk) >= 3:
            plan.add_plan_note(
                f"{len(high_risk)} questions are HIGH risk — "
                f"expect multiple human reviews this session."
            )

        return plan

    # ══════════════════════════════════════════════════════
    #  STEP 2 — EVALUATE ONE QUESTION
    # ══════════════════════════════════════════════════════

    def _evaluate_one(self, pair: dict, state: SessionState, base_id: str):
        # Import here to avoid circular imports at module level
        from evaluation_system import (
            print_report,
            check_and_review,
            score_to_grade,
        )
        from qa_agent import (
            print_qa_status,
            print_confidence_warning_inline,
            print_confidence_warning_separate,
            attach_qa_failure_flag,
            MAX_QA_RETRIES,
        )
        from learning_agent import build_learning_context_upgraded, ANALYSIS_TRIGGER_EVERY

        qid            = pair["questionId"]
        question       = pair["questionText"]
        correct_answer = pair["referenceAnswer"]
        student_answer = pair["studentAnswer"]
        student_label  = (pair.get("universalId") or
                          pair.get("fileName")    or qid)

        print(f"\n  🎯  {qid}  |  {student_label}")
        print(f"  Q: {question[:70]}...")

        # ── Ingest answers into EvaluationAgent ──────────
        self.agent.ingest_answers(correct_answer, student_answer)

        # ── QA retry loop ─────────────────────────────────
        qa_history  = []
        qa_result   = None
        qa_retry    = ""
        last_result = {}
        n_shots     = 0

        for attempt in range(1, MAX_QA_RETRIES + 2):
            last_result, n_shots = self.agent.evaluate(
                question             = question,
                question_id          = qid,
                base_id              = base_id,
                qa_retry_instruction = qa_retry,
            )

            qa_result = self.qa.validate(
                last_result, n_shots=n_shots, attempt=attempt)
            print_qa_status(qa_result, attempt=attempt)
            qa_history.append(qa_result)

            if qa_result.approved:
                break

            if attempt <= MAX_QA_RETRIES:
                qa_retry = qa_result.retry_instruction
                print(f"  🔄  QA rejected — retrying "
                      f"(attempt {attempt + 1} of {MAX_QA_RETRIES + 1})...")
            else:
                last_result = attach_qa_failure_flag(last_result, qa_history)
                break

        # ── Attach QA metadata to result ──────────────────
        last_result.update(qa_result.qa_metadata)
        last_result["qa_attempts"] = len(qa_history)

        # ── Print report + confidence warnings ────────────
        print_report(
            question       = question,
            correct_answer = correct_answer,
            student_answer = student_answer,
            result         = last_result,
            student_label  = student_label,
            n_shots        = n_shots,
        )
        print_confidence_warning_inline(qa_result)
        print_confidence_warning_separate(qa_result)

        # ── Mid-session adaptation: check BEFORE review ───
        self._adapt(state, last_result, qa_result)

        # ── Human review if needed ────────────────────────
        last_result = check_and_review(
            result         = last_result,
            student_label  = student_label,
            question       = question,
            student_answer = student_answer,
            memory         = self.memory,
            question_id    = qid,
            base_id        = base_id,
        )

        # ── Check if Learning Agent triggered ─────────────
        if (self.memory.count() % ANALYSIS_TRIGGER_EVERY == 0
                and self.memory.count() > 0):
            state.learning_agent_triggered = True

        # ── Save to MongoDB evaluations ───────────────────
        lr = self.memory.learning_agent.get_latest_result()
        self.db.save_evaluation({
            **last_result,
            "questionId"          : qid,
            "base_id"             : base_id,
            "student_label"       : student_label,
            "question"            : question,
            "correct_answer"      : correct_answer,
            "student_answer"      : student_answer,
            "learning_shots_used" : n_shots,
            "maxMarks"            : pair.get("maxMarks", 10),
            "fileId"              : pair.get("fileId",   ""),
            "universalId"         : pair.get("universalId", ""),
            "calibration_version" : lr.version if lr else 0,
            "qa_attempts"         : len(qa_history),
        })
        print(f"  💾  Saved to MongoDB  evaluations  collection")

        # ── Update session state ───────────────────────────
        state.record_result(last_result, qa_result)

    # ══════════════════════════════════════════════════════
    #  MID-SESSION ADAPTATION
    # ══════════════════════════════════════════════════════

    def _adapt(self, state: SessionState,
               result: dict, qa_result):
        """
        Checks 3 adaptation rules after every question.
        Fires a printed warning if a rule triggers.
        Each rule fires at most once per session (warnings_fired set).
        """
        THIN = "─" * 65

        # ── Rule A — Consecutive low scores ───────────────
        current_score = result.get("score", 10)
        if isinstance(current_score, int) and current_score < REVIEW_THRESHOLD:
            consecutive = state.consecutive_low_scores + 1
        else:
            consecutive = 0

        if (consecutive >= CONSECUTIVE_LOW_THRESHOLD
                and "consecutive_low" not in state.warnings_fired):
            state.warnings_fired.add("consecutive_low")
            note = (f"{consecutive} consecutive low scores detected — "
                    f"verify question difficulty or student preparation.")
            state.adaptation_notes.append(note)
            print(f"\n{THIN}")
            print(f"  ⚠️   ORCHESTRATOR ADAPTATION — Rule A")
            print(f"  {note}")
            print(f"  → Continuing evaluation. Flag raised for session report.")
            print(f"{THIN}")

        # ── Rule B — QA repeated rejections ───────────────
        qa_count = state.qa_rejections + (1 if not qa_result.approved else 0)
        if (qa_count >= QA_REJECTION_WARN_THRESHOLD
                and "qa_rejections" not in state.warnings_fired):
            state.warnings_fired.add("qa_rejections")
            note = (f"QA Agent has rejected results on {qa_count} question(s) "
                    f"this session — LLM may be struggling with this content.")
            state.adaptation_notes.append(note)
            print(f"\n{THIN}")
            print(f"  ⚠️   ORCHESTRATOR ADAPTATION — Rule B")
            print(f"  {note}")
            print(f"  → Continuing evaluation. Remaining results need close review.")
            print(f"{THIN}")

        # ── Rule C — Repeated low confidence ──────────────
        sr         = result.get("self_reflection", {})
        conf_count = state.low_confidence_count + (
            1 if sr.get("self_confidence") == "low" else 0)
        if (conf_count >= LOW_CONFIDENCE_WARN_THRESHOLD
                and "low_confidence" not in state.warnings_fired):
            state.warnings_fired.add("low_confidence")
            note = (f"Self-reflection flagged low confidence on {conf_count} "
                    f"question(s) — AI is uncertain about this content area.")
            state.adaptation_notes.append(note)
            print(f"\n{THIN}")
            print(f"  ⚠️   ORCHESTRATOR ADAPTATION — Rule C")
            print(f"  {note}")
            print(f"  → Continuing evaluation. All remaining scores need human verification.")
            print(f"{THIN}")

    # ══════════════════════════════════════════════════════
    #  STEP 3 — SESSION INTELLIGENCE REPORT
    # ══════════════════════════════════════════════════════

    def _summarize(self, state: SessionState):
        """
        Prints the full session intelligence report.
        Includes scores, QA stats, self-reflection stats,
        Learning Agent status, and a recommendation.
        """
        LINE = "═" * 65
        THIN = "─" * 65

        print(f"\n{LINE}")
        print(f"  📊  ORCHESTRATOR — SESSION INTELLIGENCE REPORT")
        print(f"  Base ID: {state.base_id}  |  "
              f"{len(state.results)} question(s) evaluated")
        print(LINE)

        # ── Score table ───────────────────────────────────
        print(f"\n  {'#':<4} {'QID':<14} {'AI':>4} {'Final':>6} "
              f"{'Grade':>6}  {'QA':>8}  Status")
        print("  " + "─" * 60)

        for i, r in enumerate(state.results, 1):
            ai_sc  = r.get("ai_score",    r.get("score",  "N/A"))
            fin_sc = r.get("final_score", r.get("score",  "N/A"))
            grade  = r.get("final_grade", r.get("grade",  "N/A"))
            qid    = r.get("questionId",  f"{state.base_id}-{i}")
            qa_att = r.get("qa_attempts", 1)
            status = r.get("review_status", "—")[:20]
            qa_str = f"{qa_att} attempt(s)"
            print(f"  {i:<4} {qid:<14} {str(ai_sc):>4} "
                  f"{str(fin_sc):>5}/10  {str(grade):>6}  "
                  f"{qa_str:>8}  {status}")

        print("  " + "─" * 60)
        print(f"\n  Average AI score    : {state.avg_ai_score():.1f} / 10")
        print(f"  Average final score : {state.avg_final_score():.1f} / 10")

        if state.ai_scores and state.final_scores:
            drift = state.avg_final_score() - state.avg_ai_score()
            direction = ("human scored higher" if drift > 0
                         else "human scored lower" if drift < 0
                         else "AI and human agreed")
            print(f"  AI vs human drift   : {drift:+.1f} pts  ({direction})")

        # ── QA stats ──────────────────────────────────────
        print(f"\n{THIN}")
        print("  🔍  QA AGENT STATISTICS")
        print(THIN)
        print(f"  Total QA rejections      : {state.qa_rejections}")
        print(f"  Self-corrections applied : {state.self_correction_count}")
        print(f"  Low-confidence flags     : {state.low_confidence_count}")

        if state.qa_rejections == 0:
            print(f"\n  ✅  All evaluations passed QA on first attempt.")
        elif state.qa_rejections == 1:
            print(f"\n  ⚠️   1 evaluation needed QA retry — minor LLM inconsistency.")
        else:
            print(f"\n  ⚠️   {state.qa_rejections} evaluations needed QA retries — "
                  f"review LLM output quality.")

        # ── Learning Agent status ─────────────────────────
        print(f"\n{THIN}")
        print("  🧠  LEARNING AGENT STATUS")
        print(THIN)
        lr = self.memory.learning_agent.get_latest_result()
        print(f"  Calibration version  : {lr.version if lr else 'None'}")
        print(f"  Based on corrections : "
              f"{lr.n_corrections if lr else 0}")
        print(f"  Triggered this session: "
              f"{'Yes' if state.learning_agent_triggered else 'No'}")
        if lr:
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
            print(f"  AI global bias       : "
                  f"{bias_icons.get(lr.global_bias, lr.global_bias)}")
            print(f"  Accuracy trend       : "
                  f"{trend_icons.get(lr.trend, lr.trend)}")

        # ── Adaptation notes ──────────────────────────────
        if state.adaptation_notes:
            print(f"\n{THIN}")
            print("  ⚠️   MID-SESSION ADAPTATIONS FIRED")
            print(THIN)
            for i, note in enumerate(state.adaptation_notes, 1):
                print(f"  {i}. {note}")

        # ── Recommendation ────────────────────────────────
        print(f"\n{THIN}")
        print("  🔮  SESSION RECOMMENDATION")
        print(THIN)
        recommendation = self._generate_recommendation(state, lr)
        print(f"\n  {recommendation}")

        print(f"\n{LINE}\n")

    def _generate_recommendation(self, state: SessionState,
                                  lr) -> str:
        """
        Produces a one-paragraph recommendation based on session data.
        Looks at avg score, QA rejections, confidence flags, and bias.
        """
        avg     = state.avg_final_score()
        n_low   = sum(1 for s in state.final_scores
                      if isinstance(s, int) and s < REVIEW_THRESHOLD)
        n_total = len(state.final_scores)

        parts = []

        # Overall performance
        if avg >= 8:
            parts.append(
                f"Student performed strongly this session "
                f"(avg {avg:.1f}/10)."
            )
        elif avg >= 6:
            parts.append(
                f"Student showed moderate understanding "
                f"(avg {avg:.1f}/10) with room to improve."
            )
        elif avg >= 4:
            parts.append(
                f"Student struggled this session "
                f"(avg {avg:.1f}/10) — targeted support recommended."
            )
        else:
            parts.append(
                f"Student performance was critically low "
                f"(avg {avg:.1f}/10) — immediate intervention recommended."
            )

        # Low score proportion
        if n_total > 0 and n_low >= (n_total // 2):
            parts.append(
                f"{n_low} of {n_total} questions scored below 50% — "
                f"consider re-assessing student readiness."
            )

        # Weak topics from Learning Agent
        if lr and lr.weak_topics:
            worst = lr.weak_topics[0]
            parts.append(
                f"AI accuracy is weakest on "
                f"{worst['topic']} topics — "
                f"human evaluator should pay extra attention to those questions."
            )

        # AI reliability this session
        if state.qa_rejections >= QA_REJECTION_WARN_THRESHOLD:
            parts.append(
                "AI evaluation quality was inconsistent this session — "
                "treat AI scores as indicative only."
            )
        elif state.low_confidence_count >= LOW_CONFIDENCE_WARN_THRESHOLD:
            parts.append(
                "AI flagged low confidence on multiple questions — "
                "verify borderline scores manually."
            )
        else:
            parts.append(
                "AI evaluation quality was consistent — "
                "scores can be trusted with normal review."
            )

        # Learning status
        if state.learning_agent_triggered:
            parts.append(
                "Learning Agent updated its calibration this session — "
                "future evaluations will reflect new patterns."
            )

        return " ".join(parts)

    # ══════════════════════════════════════════════════════
    #  STEP 4 — SAVE SESSION TO MONGODB
    # ══════════════════════════════════════════════════════

    def _save_session(self, state: SessionState):
        doc = state.to_dict()
        recommendation = self._generate_recommendation(
            state, self.memory.learning_agent.get_latest_result())
        doc["session_recommendation"] = recommendation

        self.db.db[SESSIONS_COLLECTION].insert_one(doc)
        doc.pop("_id", None)
        logging.info(
            f"[Orchestrator] Session saved to MongoDB "
            f"'{SESSIONS_COLLECTION}' for base_id={state.base_id}"
        )
        print(f"  💾  Session saved to MongoDB  '{SESSIONS_COLLECTION}'  collection\n")


# ─────────────────────────────────────────────────────────────
#  MONGO METHOD — add this to MongoDataLayer in evaluation_system.py
# ─────────────────────────────────────────────────────────────

def mongo_load_past_session(db_instance, base_id: str) -> dict:
    """
    Loads the most recent session document for a given base_id.
    Returns {} if none found.
    Add as a method to MongoDataLayer.
    """
    doc = (db_instance.db[SESSIONS_COLLECTION]
           .find_one(
               {"base_id": base_id},
               {"_id": 0},
               sort=[("session_start", -1)]   # most recent first
           ))
    return doc or {}


# ─────────────────────────────────────────────────────────────
#  INTEGRATION PATCH — exact changes for evaluation_system.py
# ─────────────────────────────────────────────────────────────
"""
STEP 1 — Add import at the top of evaluation_system.py:

    from orchestrator import OrchestratorAgent, mongo_load_past_session

─────────────────────────────────────────────────────────────
STEP 2 — Add 1 method to MongoDataLayer:

    def load_past_session(self, base_id: str) -> dict:
        return mongo_load_past_session(self, base_id)

─────────────────────────────────────────────────────────────
STEP 3 — In EvaluationAgent.evaluate(), add qa_retry_instruction
  parameter (needed by the QA retry loop inside Orchestrator):

    def evaluate(self, question: str,
                 question_id          : str = "",
                 base_id              : str = "",
                 qa_retry_instruction : str = "") -> tuple[dict, int]:

  Then at the end of the user_prompt f-string, add:
    {qa_retry_instruction}

─────────────────────────────────────────────────────────────
STEP 4 — Replace the entire main() function with this:

def main():
    print("\\n" + "═" * 65)
    print("  🚀  AGENTIC AI EVALUATION SYSTEM")
    print("       Orchestrator  +  QA Agent  +  Self-Reflection")
    print("       +  Learning Agent  |  MongoDB  +  RAG")
    print("═" * 65)

    if GROQ_API_KEY in ("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", "", None):
        print("\\n⚠️  Set GROQ_API_KEY:  export GROQ_API_KEY='gsk_...'")

    # ── Boot ─────────────────────────────────────────────
    print("\\n[BOOT] Loading embedding model...")
    embedder = SentenceTransformer(EMBEDDING_MODEL)

    print("[BOOT] Connecting to MongoDB...")
    data_layer = MongoDataLayer()

    print("[BOOT] Loading feedback memory + rebuilding FAISS...")
    memory = FeedbackMemory(embedder=embedder, data_layer=data_layer)
    print(f"[BOOT] {memory.count()} past correction(s) loaded")

    print("[BOOT] Initialising agents...")
    agent      = EvaluationAgent(embedder=embedder, feedback_memory=memory)
    qa_agent   = QAAgent()
    orchestrator = OrchestratorAgent(
        data_layer = data_layer,
        memory     = memory,
        agent      = agent,
        qa_agent   = qa_agent,
    )
    print("[BOOT] All agents ready.\\n")

    # ── Main loop ─────────────────────────────────────────
    while True:
        print(f"{'═' * 65}")
        print(f"  📝  NEW SESSION  |  Memory: {memory.count()} correction(s)")
        print(f"{'═' * 65}")
        print("\\n  Enter 4-digit base ID (e.g. 0000)  or  'exit'")
        base_id = input("  Base ID: ").strip()

        if base_id.lower() == "exit":
            print(f"\\n  ✅  Exiting. "
                  f"{memory.count()} correction(s) in MongoDB.")
            sys.exit(0)

        if not (len(base_id) == 4 and base_id.isdigit()):
            print("  ❌  Enter exactly 4 digits.")
            continue

        orchestrator.run_session(base_id)

        nxt = input("  Evaluate another ID? (yes/no): ").strip().lower()
        if nxt not in ("yes", "y"):
            print(f"\\n  ✅  Done. {memory.count()} correction(s) stored.")
            sys.exit(0)

if __name__ == "__main__":
    main()
"""