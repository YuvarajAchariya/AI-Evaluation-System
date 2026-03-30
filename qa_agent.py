"""
=============================================================
  QA AGENT  —  Agentic AI Assistive Evaluation System
  File: qa_agent.py  (place beside evaluation_system.py)
=============================================================

  PURPOSE:
    Sits between EvaluationAgent.evaluate() and print_report().
    Checks every LLM evaluation result for:
      Check 1 — Score vs Feedback Consistency
      Check 2 — Completeness (all 9 fields present + non-trivial)
      Check 3 — Grade-Score Alignment
      Check 4 — Confidence Warning (shown in report + saved to MongoDB)

  HOW TO USE:
    In evaluation_system.py, after agent.evaluate() returns result,
    pass it through QAAgent.validate() before print_report().
    See the "INTEGRATION PATCH" section at the bottom of this file
    for the exact lines to add/change in evaluation_system.py.

=============================================================
"""

import re
import logging
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────
#  CONSTANTS — tweak these without touching logic
# ─────────────────────────────────────────────────────────────

MAX_QA_RETRIES = 2          # how many times QA can reject before human flag

# Minimum length for detailed_feedback (characters)
MIN_FEEDBACK_LENGTH = 80

# All 9 fields the LLM must return
REQUIRED_FIELDS = [
    "score",
    "grade",
    "summary",
    "conceptual_accuracy",
    "completeness",
    "spelling_grammar",
    "strengths",
    "improvements",
    "detailed_feedback",
]

# Words that signal POSITIVE sentiment in feedback text
POSITIVE_WORDS = [
    "excellent", "outstanding", "perfect", "great", "well done",
    "strong", "accurate", "complete", "thorough", "correct",
    "good", "impressive", "comprehensive", "clear", "well-structured",
    "demonstrates", "understands", "explained well", "fully", "all",
]

# Words that signal NEGATIVE sentiment in feedback text
NEGATIVE_WORDS = [
    "wrong", "incorrect", "incomplete", "missing", "failed",
    "poor", "weak", "lack", "lacks", "absent", "not mentioned",
    "does not", "didn't", "no mention", "irrelevant", "off-topic",
    "misunderstood", "confused", "very little", "barely", "nothing",
]

# Uncertain language that lowers confidence
UNCERTAIN_WORDS = [
    "possibly", "might be", "unclear", "not sure", "perhaps",
    "could be", "seems like", "appears to", "may have", "difficult to tell",
]

# Grade mapping — must match score_to_grade() in evaluation_system.py
GRADE_MAP = {
    10: "A+",
    9:  "A",
    8:  "B+",
    7:  "B",
    6:  "C",
    5:  "D",
}


# ─────────────────────────────────────────────────────────────
#  HELPER — score zone
# ─────────────────────────────────────────────────────────────

def _score_zone(score: int) -> str:
    """
    Returns the sentiment zone of a numeric score.
      1-4  → negative
      5-7  → neutral
      8-10 → positive
    """
    if score <= 4:
        return "negative"
    if score <= 7:
        return "neutral"
    return "positive"


def _feedback_sentiment(text: str) -> str:
    """
    Scans text for positive / negative keywords.
    Returns 'positive', 'negative', or 'neutral'.
    If both found, returns 'mixed'.
    """
    lower = text.lower()
    pos_hits = sum(1 for w in POSITIVE_WORDS if w in lower)
    neg_hits = sum(1 for w in NEGATIVE_WORDS if w in lower)

    if pos_hits > 0 and neg_hits > 0:
        return "mixed"
    if pos_hits > neg_hits:
        return "positive"
    if neg_hits > pos_hits:
        return "negative"
    return "neutral"


def _expected_grade(score: int) -> str:
    """Return the grade that score_to_grade() would assign."""
    return GRADE_MAP.get(score, "F")


# ─────────────────────────────────────────────────────────────
#  QA RESULT  —  what QAAgent.validate() returns
# ─────────────────────────────────────────────────────────────

class QAResult:
    """
    Returned by QAAgent.validate().

    Attributes
    ----------
    approved          : bool   — True = pass, False = reject
    issues            : list   — list of issue-code strings
    issue_details     : dict   — human-readable detail per issue code
    confidence_warning: bool   — True = low confidence flag attached
    confidence_reasons: list   — why confidence is low
    retry_instruction : str    — injected into LLM prompt on retry
    qa_metadata       : dict   — saved to MongoDB evaluations document
    """

    def __init__(self):
        self.approved           = True
        self.issues             = []
        self.issue_details      = {}
        self.confidence_warning = False
        self.confidence_reasons = []
        self.retry_instruction  = ""
        self.qa_metadata        = {}

    def reject(self, code: str, detail: str):
        self.approved = False
        self.issues.append(code)
        self.issue_details[code] = detail

    def warn(self, reason: str):
        self.confidence_warning = True
        self.confidence_reasons.append(reason)

    def build_retry_instruction(self):
        """
        Compose a clear instruction string that will be appended
        to the LLM prompt when EvaluationAgent retries.
        """
        if not self.issues:
            self.retry_instruction = ""
            return

        parts = [
            "\n" + "═" * 55,
            "⚠️  QA AGENT CORRECTION — YOUR PREVIOUS EVALUATION WAS REJECTED",
            "═" * 55,
            "Fix ALL of the following issues in your new response:",
        ]
        for i, code in enumerate(self.issues, 1):
            parts.append(f"  {i}. [{code}] {self.issue_details[code]}")
        parts += [
            "",
            "Rules for your corrected response:",
            "  • Score 1-4 must come with clearly negative feedback language.",
            "  • Score 8-10 must come with clearly positive feedback language.",
            "  • All 9 JSON fields must be present, non-empty, and meaningful.",
            "  • Grade MUST match the score exactly (e.g. score=8 → grade=B+).",
            "  • detailed_feedback must be at least 3 full sentences.",
            "═" * 55,
        ]
        self.retry_instruction = "\n".join(parts)

    def to_dict(self) -> dict:
        """Serialisable version for MongoDB."""
        return {
            "qa_approved"           : self.approved,
            "qa_issues"             : self.issues,
            "qa_issue_details"      : self.issue_details,
            "qa_confidence_warning" : self.confidence_warning,
            "qa_confidence_reasons" : self.confidence_reasons,
            "qa_timestamp"          : datetime.now(timezone.utc).isoformat(),
        }


# ─────────────────────────────────────────────────────────────
#  QA AGENT
# ─────────────────────────────────────────────────────────────

class QAAgent:
    """
    Validates evaluation results produced by EvaluationAgent.

    Usage
    -----
        qa_agent = QAAgent()
        qa_result = qa_agent.validate(result, n_shots=n_shots)
        if not qa_result.approved:
            # retry EvaluationAgent with qa_result.retry_instruction
    """

    def __init__(self):
        logging.info("[QAAgent] Initialised — 4 checks active")

    # ── Public entry point ────────────────────────────────
    def validate(self, result: dict,
                 n_shots: int = 0,
                 attempt: int = 1) -> QAResult:
        """
        Run all 4 checks on a result dict from EvaluationAgent.

        Parameters
        ----------
        result  : dict   — the evaluation result to check
        n_shots : int    — how many past corrections were injected
        attempt : int    — which retry attempt this is (1 = first time)

        Returns
        -------
        QAResult — see class docstring
        """
        qa = QAResult()

        # Skip validation if LLM had a parse error — flag immediately
        if result.get("parse_error"):
            qa.reject(
                "parse_error",
                "LLM output could not be parsed into valid JSON. "
                "Re-evaluate and return ONLY the exact JSON format specified."
            )
            qa.build_retry_instruction()
            qa.qa_metadata = qa.to_dict()
            qa.qa_metadata["qa_attempt"] = attempt
            logging.warning("[QAAgent] parse_error detected — rejected immediately")
            return qa

        # ── Run the 4 checks ─────────────────────────────
        self._check1_score_feedback_consistency(result, qa)
        self._check2_completeness(result, qa)
        self._check3_grade_score_alignment(result, qa)
        self._check4_confidence(result, qa, n_shots)

        # ── Build retry instruction if rejected ───────────
        if not qa.approved:
            qa.build_retry_instruction()

        # ── Attach metadata ───────────────────────────────
        qa.qa_metadata = qa.to_dict()
        qa.qa_metadata["qa_attempt"] = attempt

        status = "✓ APPROVED" if qa.approved else f"✗ REJECTED ({len(qa.issues)} issue(s))"
        logging.info(f"[QAAgent] Attempt {attempt}: {status}")
        if qa.confidence_warning:
            logging.info(f"[QAAgent] Confidence warning: {qa.confidence_reasons}")

        return qa

    # ════════════════════════════════════════════════════
    #  CHECK 1 — Score vs Feedback Consistency
    # ════════════════════════════════════════════════════
    def _check1_score_feedback_consistency(self, result: dict, qa: QAResult):
        score = result.get("score")
        if not isinstance(score, int):
            return  # Check 2 will catch this

        # Combine all feedback fields into one text blob
        feedback_text = " ".join([
            str(result.get("summary",          "")),
            str(result.get("strengths",        "")),
            str(result.get("improvements",     "")),
            str(result.get("detailed_feedback","")),
        ])

        score_zone = _score_zone(score)
        sentiment  = _feedback_sentiment(feedback_text)

        # Contradiction cases:
        #   score is negative zone (1-4) BUT feedback is purely positive
        #   score is positive zone (8-10) BUT feedback is purely negative
        contradiction = False
        detail        = ""

        if score_zone == "negative" and sentiment == "positive":
            contradiction = True
            detail = (
                f"Score is {score}/10 (poor zone 1-4) but feedback language "
                f"is overwhelmingly positive. "
                f"Either raise the score or make the feedback reflect the low quality."
            )

        elif score_zone == "positive" and sentiment == "negative":
            contradiction = True
            detail = (
                f"Score is {score}/10 (good zone 8-10) but feedback language "
                f"is predominantly negative. "
                f"Either lower the score or rewrite feedback to match the high score."
            )

        if contradiction:
            qa.reject("score_feedback_mismatch", detail)
            logging.warning(
                f"[QAAgent] Check1 FAIL — score={score} zone={score_zone} "
                f"sentiment={sentiment}"
            )
        else:
            logging.info(
                f"[QAAgent] Check1 PASS — score={score} zone={score_zone} "
                f"sentiment={sentiment}"
            )

    # ════════════════════════════════════════════════════
    #  CHECK 2 — Completeness
    # ════════════════════════════════════════════════════
    def _check2_completeness(self, result: dict, qa: QAResult):
        missing_fields  = []
        trivial_fields  = []

        for field in REQUIRED_FIELDS:
            value = result.get(field)

            # Field missing entirely
            if value is None:
                missing_fields.append(field)
                continue

            # Field present but trivially empty or useless
            str_val = str(value).strip()
            if str_val in ("", "N/A", "n/a", "None", "null", "-"):
                trivial_fields.append(field)
                continue

            # score must be an integer
            if field == "score" and not isinstance(value, int):
                trivial_fields.append(f"{field} (must be integer, got '{value}')")
                continue

            # score must be in range 1-10
            if field == "score" and isinstance(value, int):
                if not (1 <= value <= 10):
                    trivial_fields.append(
                        f"{field} (out of range: {value}, must be 1-10)"
                    )
                    continue

            # detailed_feedback must be substantial
            if field == "detailed_feedback":
                if len(str_val) < MIN_FEEDBACK_LENGTH:
                    trivial_fields.append(
                        f"{field} (too short: {len(str_val)} chars, "
                        f"need ≥ {MIN_FEEDBACK_LENGTH})"
                    )

        issues_found = missing_fields or trivial_fields
        if issues_found:
            detail_parts = []
            if missing_fields:
                detail_parts.append(
                    f"Missing fields: {', '.join(missing_fields)}"
                )
            if trivial_fields:
                detail_parts.append(
                    f"Empty/trivial/invalid fields: {', '.join(trivial_fields)}"
                )
            qa.reject("incomplete_evaluation", " | ".join(detail_parts))
            logging.warning(
                f"[QAAgent] Check2 FAIL — {detail_parts}"
            )
        else:
            logging.info("[QAAgent] Check2 PASS — all 9 fields present and valid")

    # ════════════════════════════════════════════════════
    #  CHECK 3 — Grade-Score Alignment
    # ════════════════════════════════════════════════════
    def _check3_grade_score_alignment(self, result: dict, qa: QAResult):
        score = result.get("score")
        grade = result.get("grade", "")

        if not isinstance(score, int):
            return  # Already caught by Check 2

        expected = _expected_grade(score)
        actual   = str(grade).strip()

        if actual != expected:
            detail = (
                f"Grade mismatch: score={score} should give grade={expected} "
                f"but LLM returned grade='{actual}'. "
                f"Correct the grade to exactly '{expected}'."
            )
            qa.reject("grade_score_mismatch", detail)
            logging.warning(
                f"[QAAgent] Check3 FAIL — score={score} "
                f"expected={expected} got={actual}"
            )
        else:
            logging.info(
                f"[QAAgent] Check3 PASS — score={score} grade={actual} ✓"
            )

    # ════════════════════════════════════════════════════
    #  CHECK 4 — Confidence Warning
    #  (never causes rejection — attaches warning only)
    # ════════════════════════════════════════════════════
    def _check4_confidence(self, result: dict, qa: QAResult, n_shots: int):
        score = result.get("score")

        # Signal 1 — no past corrections were available
        if n_shots == 0:
            qa.warn(
                "No past corrections available — AI evaluated without "
                "any in-context learning examples."
            )

        # Signal 2 — score is exactly at the review threshold boundary
        # (REVIEW_THRESHOLD is 5 in evaluation_system.py)
        if isinstance(score, int) and score == 5:
            qa.warn(
                f"Score is exactly {score}/10 — right at the 50% review "
                f"boundary. Human should verify this is not borderline."
            )

        # Signal 3 — uncertain language in feedback
        feedback_text = " ".join([
            str(result.get("summary",          "")),
            str(result.get("detailed_feedback","")),
        ]).lower()

        uncertain_hits = [w for w in UNCERTAIN_WORDS if w in feedback_text]
        if uncertain_hits:
            qa.warn(
                f"Uncertain language detected in feedback: "
                f"{', '.join(uncertain_hits[:3])}. "
                f"AI may not be confident in this evaluation."
            )

        # Signal 4 — spelling_issues were found AND score is high
        # (AI may have ignored spelling penalty)
        spelling_issues = result.get("spelling_issues", [])
        if spelling_issues and isinstance(score, int) and score >= 8:
            qa.warn(
                f"{len(spelling_issues)} spelling issue(s) detected but "
                f"score is {score}/10. Verify spelling penalty was considered."
            )

        if qa.confidence_warning:
            logging.info(
                f"[QAAgent] Check4 — Confidence WARNING: "
                f"{qa.confidence_reasons}"
            )
        else:
            logging.info("[QAAgent] Check4 PASS — no confidence concerns")


# ─────────────────────────────────────────────────────────────
#  PRINT FUNCTIONS
#  Call these from your existing main() loop in evaluation_system.py
# ─────────────────────────────────────────────────────────────

def print_qa_status(qa_result: QAResult, attempt: int = 1):
    """
    Print the QA Agent's decision clearly.
    Call this right after QAAgent.validate() — before print_report().
    """
    LINE = "─" * 65
    print(f"\n{LINE}")
    print(f"  🔍  QA AGENT  —  Attempt {attempt} of {MAX_QA_RETRIES + 1}")
    print(LINE)

    if qa_result.approved:
        print("  ✅  APPROVED  —  Evaluation is consistent and complete.")
    else:
        print(f"  ❌  REJECTED  —  {len(qa_result.issues)} issue(s) found:")
        for code, detail in qa_result.issue_details.items():
            print(f"\n     [{code}]")
            print(f"     {detail}")

    print(LINE)


def print_confidence_warning_inline(qa_result: QAResult):
    """
    Print confidence warning INLINE — call inside or right after print_report().
    This covers the "Both places" preference.
    """
    if not qa_result.confidence_warning:
        return
    LINE = "─" * 65
    print(f"\n{LINE}")
    print("  ⚠️   QA AGENT — CONFIDENCE WARNING")
    print(LINE)
    for i, reason in enumerate(qa_result.confidence_reasons, 1):
        print(f"  {i}. {reason}")
    print(f"\n  → Review this evaluation carefully before accepting.")
    print(LINE)


def print_confidence_warning_separate(qa_result: QAResult):
    """
    Print confidence warning as a SEPARATE section after print_report().
    This covers the "Both places" preference — call this after print_report().
    """
    if not qa_result.confidence_warning:
        return
    LINE = "═" * 65
    print(f"\n{LINE}")
    print("  ⚠️   QA AGENT — SEPARATE CONFIDENCE REPORT")
    print(LINE)
    print(f"\n  This evaluation has {len(qa_result.confidence_reasons)} "
          f"confidence signal(s):\n")
    for i, reason in enumerate(qa_result.confidence_reasons, 1):
        print(f"  {i}. {reason}")
    print(f"\n  What to do:")
    print(f"     • Read the detailed_feedback carefully.")
    print(f"     • If you disagree with the score, use option [2] Override.")
    print(f"     • Your correction will train the AI for future evaluations.")
    print(f"\n{LINE}\n")


# ─────────────────────────────────────────────────────────────
#  MAX RETRIES EXCEEDED — flag for human
# ─────────────────────────────────────────────────────────────

def attach_qa_failure_flag(result: dict, qa_history: list[QAResult]) -> dict:
    """
    Called when QA Agent rejected the result after MAX_QA_RETRIES attempts.
    Attaches a human-visible flag to the result dict.

    Parameters
    ----------
    result      : dict             — last evaluation result
    qa_history  : list[QAResult]   — all QA results across retries

    Returns
    -------
    result dict with qa_flag fields added
    """
    all_issues = []
    for qa in qa_history:
        all_issues.extend(qa.issues)

    result["qa_flag"]              = True
    result["qa_flag_reason"]       = (
        f"QA Agent rejected this evaluation after {len(qa_history)} attempt(s). "
        f"Persistent issues: {', '.join(set(all_issues))}. "
        f"Human review strongly recommended."
    )
    result["qa_attempts"]          = len(qa_history)
    result["qa_all_issues"]        = list(set(all_issues))
    result["review_status"]        = (
        f"QA FLAGGED — rejected after {len(qa_history)} QA attempt(s)"
    )

    print("\n" + "═" * 65)
    print("  🚨  QA AGENT — MAX RETRIES EXCEEDED")
    print("═" * 65)
    print(f"\n  The AI failed QA validation after {len(qa_history)} attempt(s).")
    print(f"  Persistent issue(s): {', '.join(set(all_issues))}")
    print(f"\n  This result is flagged for mandatory human review.")
    print(f"  Please examine it carefully before accepting the score.")
    print("═" * 65 + "\n")

    return result


# ─────────────────────────────────────────────────────────────
#  INTEGRATION PATCH — copy these changes into evaluation_system.py
# ─────────────────────────────────────────────────────────────
"""
STEP 1 — At the top of evaluation_system.py, add this import:

    from qa_agent import (
        QAAgent,
        QAResult,
        MAX_QA_RETRIES,
        print_qa_status,
        print_confidence_warning_inline,
        print_confidence_warning_separate,
        attach_qa_failure_flag,
    )

─────────────────────────────────────────────────────────────
STEP 2 — In EvaluationAgent.evaluate(), add one parameter:

    def evaluate(self, question: str,
                 question_id: str = "",
                 base_id    : str = "",
                 qa_retry_instruction: str = "") -> tuple[dict, int]:

    Then in the user_prompt f-string, add at the end (before "Evaluate..."):

        {qa_retry_instruction}

─────────────────────────────────────────────────────────────
STEP 3 — In main(), replace the block:

    result, n_shots = agent.evaluate(...)
    print_report(...)
    result = check_and_review(...)

  With this block:

    # ── QA Agent loop ─────────────────────────────────────
    qa_agent   = QAAgent()          # create once outside the pair loop
    qa_history = []
    qa_retry   = ""

    for attempt in range(1, MAX_QA_RETRIES + 2):   # 1, 2, 3
        result, n_shots = agent.evaluate(
            question             = question,
            question_id          = qid,
            base_id              = base_id,
            qa_retry_instruction = qa_retry,
        )

        qa_result = qa_agent.validate(result, n_shots=n_shots, attempt=attempt)
        print_qa_status(qa_result, attempt=attempt)
        qa_history.append(qa_result)

        if qa_result.approved:
            break                      # passed — exit retry loop

        if attempt <= MAX_QA_RETRIES:
            qa_retry = qa_result.retry_instruction
            print(f"  🔄  QA rejected — retrying (attempt {attempt+1})...")
        else:
            result = attach_qa_failure_flag(result, qa_history)
            break                      # max retries hit — flag and continue

    # ── Print report with inline confidence warning ───────
    print_report(...)
    print_confidence_warning_inline(qa_result)     # inline in report area

    # ── Separate confidence section (both places) ─────────
    print_confidence_warning_separate(qa_result)   # separate section

    # ── Save QA metadata to MongoDB ───────────────────────
    result.update(qa_result.qa_metadata)

    result = check_and_review(...)

─────────────────────────────────────────────────────────────
STEP 4 — Move qa_agent = QAAgent() to before the pair loop
  (once per session, not once per question):

    qa_agent = QAAgent()
    for pair in pairs:
        ...
"""