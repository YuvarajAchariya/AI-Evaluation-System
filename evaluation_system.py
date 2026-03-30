"""
=============================================================
  AGENTIC AI ASSISTIVE EVALUATION SYSTEM  —  FULL BUILD
  RAG + Self-Reflection + QA Agent + Learning Agent + Orchestrator
  MongoDB Backend
=============================================================

  FILE LAYOUT (all in backend/ folder):
    evaluation_system.py   ← THIS FILE  (main system)
    qa_agent.py            ← QA Agent
    self_reflection.py     ← Self-Reflection Engine
    learning_agent.py      ← Learning Agent
    orchestrator.py        ← Orchestrator Agent

  READS FROM  MONGODB:
    - questions            → questionText, referenceAnswer, maxMarks
    - extractedanswers     → answerText (student answer)

  WRITES TO   MONGODB:
    - evaluations          → every evaluation result  (+ new agent fields)
    - feedback_memory      → every evaluator correction
    - feedback_memory_meta → calibration note (Learning Agent)  NEW
    - sessions             → session summary (Orchestrator)      NEW

=============================================================
"""

import os
import re
import json
import time
import sys
import logging
import numpy as np
from datetime import datetime, timezone

try:
    from groq import Groq
except ImportError:
    raise ImportError("pip install groq")

try:
    from sentence_transformers import SentenceTransformer
    import faiss
except ImportError:
    raise ImportError("pip install sentence-transformers faiss-cpu")

try:
    from pymongo import MongoClient, ASCENDING, DESCENDING
except ImportError:
    raise ImportError("pip install pymongo")

# ── Agent imports ─────────────────────────────────────────────
from qa_agent import (
    QAAgent,
    QAResult,
    MAX_QA_RETRIES,
    print_qa_status,
    print_confidence_warning_inline,
    print_confidence_warning_separate,
    attach_qa_failure_flag,
)
from self_reflection import SelfReflectionEngine
from learning_agent import (
    LearningAgent,
    ANALYSIS_TRIGGER_EVERY,
    mongo_save_calibration_note,
    mongo_load_calibration_note,
    build_learning_context_upgraded,
)
from orchestrator import OrchestratorAgent, mongo_load_past_session

logging.basicConfig(
    level  = logging.INFO,
    format = "%(asctime)s %(levelname)s: %(message)s"
)


# ════════════════════════════════════════════════════════════
#  CONFIGURATION
# ════════════════════════════════════════════════════════════

GROQ_API_KEY      = os.environ.get("GROQ_API_KEY", "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")
MONGODB_URI       = os.environ.get("MONGODB_URI",  "mongodb://localhost:27017/")
DATABASE_NAME     = "ai-evaluation-system"

EMBEDDING_MODEL   = "all-MiniLM-L6-v2"
CHUNK_SIZE        = 300
CHUNK_OVERLAP     = 50
REVIEW_THRESHOLD  = 5
MAX_CONTEXT_SHOTS = 3
QUESTIONS_PER_ID  = 5

MODEL_PRIORITY = [
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
]


# ════════════════════════════════════════════════════════════
#  MONGODB DATA LAYER
# ════════════════════════════════════════════════════════════

class MongoDataLayer:

    def __init__(self):
        self.client = MongoClient(MONGODB_URI)
        self.db     = self.client[DATABASE_NAME]
        logging.info(f"[MongoDataLayer] Connected → {DATABASE_NAME}")

    # ── READ: questions ───────────────────────────────────
    def get_questions_for_base_id(self, base_id: str) -> list:
        pattern   = f"^{base_id}-[1-{QUESTIONS_PER_ID}]$"
        questions = list(self.db.questions.find(
            {"questionId": {"$regex": pattern}, "isActive": True},
            {"_id": 0}
        ))
        questions.sort(key=lambda x: int(x["questionId"].split("-")[-1]))
        logging.info(f"[MongoDataLayer] {len(questions)} questions for base_id={base_id}")
        return questions

    # ── READ: extractedanswers ────────────────────────────
    def get_answers_for_base_id(self, base_id: str) -> list:
        pattern = f"^{base_id}-[1-{QUESTIONS_PER_ID}]$"
        answers = list(self.db.extractedanswers.find(
            {"questionId": {"$regex": pattern}},
            {"_id": 0}
        ))
        answers.sort(key=lambda x: int(x["questionId"].split("-")[-1]))
        logging.info(f"[MongoDataLayer] {len(answers)} answers for base_id={base_id}")
        return answers

    # ── MATCH: join questions with answers ────────────────
    def get_matched_pairs(self, base_id: str) -> list:
        questions = {q["questionId"]: q for q in self.get_questions_for_base_id(base_id)}
        answers   = {a["questionId"]: a for a in self.get_answers_for_base_id(base_id)}
        pairs = []
        for i in range(1, QUESTIONS_PER_ID + 1):
            qid = f"{base_id}-{i}"
            if qid in questions and qid in answers:
                q = questions[qid]
                a = answers[qid]
                pairs.append({
                    "questionId"      : qid,
                    "questionText"    : q.get("questionText",    ""),
                    "referenceAnswer" : q.get("referenceAnswer", ""),
                    "maxMarks"        : q.get("maxMarks",        10),
                    "studentAnswer"   : a.get("answerText",      ""),
                    "fileName"        : a.get("filename",        ""),
                    "fileId"          : a.get("fileId",          ""),
                    "universalId"     : a.get("universalId",     ""),
                    "questionName"    : a.get("questionName",    ""),
                })
            else:
                if qid not in questions:
                    logging.warning(f"[MongoDataLayer] Missing question: {qid}")
                if qid not in answers:
                    logging.warning(f"[MongoDataLayer] Missing answer:   {qid}")
        return pairs

    # ── WRITE: evaluations ────────────────────────────────
    def save_evaluation(self, result: dict) -> str:
        doc = dict(result)
        doc["savedAt"] = datetime.now(timezone.utc).isoformat()
        doc.pop("_id", None)
        inserted = self.db.evaluations.insert_one(doc)
        logging.info(f"[MongoDataLayer] Evaluation saved → {result.get('questionId','?')}")
        return str(inserted.inserted_id)

    # ── WRITE: feedback_memory ────────────────────────────
    def save_feedback_correction(self, record: dict) -> str:
        doc = dict(record)
        doc.pop("_id", None)
        inserted = self.db.feedback_memory.insert_one(doc)
        logging.info(f"[MongoDataLayer] Correction saved → faiss_index={record.get('faiss_index')}")
        return str(inserted.inserted_id)

    # ── READ: feedback_memory ─────────────────────────────
    def load_all_corrections(self) -> list:
        docs = list(
            self.db.feedback_memory
                   .find({}, {"_id": 0})
                   .sort("faiss_index", ASCENDING)
        )
        logging.info(f"[MongoDataLayer] Loaded {len(docs)} corrections from feedback_memory")
        return docs

    def count_corrections(self) -> int:
        return self.db.feedback_memory.count_documents({})

    def count_questions_for_base_id(self, base_id: str) -> int:
        pattern = f"^{base_id}-[1-{QUESTIONS_PER_ID}]$"
        return self.db.questions.count_documents(
            {"questionId": {"$regex": pattern}, "isActive": True}
        )

    # ── NEW: calibration note (Learning Agent) ────────────
    def save_calibration_note(self, note_dict: dict):
        mongo_save_calibration_note(self, note_dict)

    def load_calibration_note(self) -> dict:
        return mongo_load_calibration_note(self)

    # ── NEW: sessions (Orchestrator) ──────────────────────
    def load_past_session(self, base_id: str) -> dict:
        return mongo_load_past_session(self, base_id)


# ════════════════════════════════════════════════════════════
#  RAG ENGINE
# ════════════════════════════════════════════════════════════

class RAGEngine:
    def __init__(self, embedder: SentenceTransformer):
        self.embedder = embedder
        self.index    = None
        self.chunks   = []
        self.dim      = None

    def _chunk(self, text: str) -> list:
        chunks, start = [], 0
        while start < len(text):
            chunks.append(text[start:start + CHUNK_SIZE].strip())
            start += CHUNK_SIZE - CHUNK_OVERLAP
        return [c for c in chunks if c]

    def index_document(self, text: str, label: str = "doc"):
        new_chunks = self._chunk(text)
        labeled    = [f"[{label}] {c}" for c in new_chunks]
        embeddings = self.embedder.encode(labeled, convert_to_numpy=True)
        if self.index is None:
            self.dim   = embeddings.shape[1]
            self.index = faiss.IndexFlatL2(self.dim)
        self.index.add(embeddings.astype(np.float32))
        self.chunks.extend(labeled)

    def reset(self):
        self.index  = None
        self.chunks = []
        self.dim    = None

    def retrieve(self, query: str, top_k: int = 5) -> list:
        if self.index is None or self.index.ntotal == 0:
            return []
        q_emb = self.embedder.encode([query], convert_to_numpy=True).astype(np.float32)
        _, idxs = self.index.search(q_emb, min(top_k, self.index.ntotal))
        return [self.chunks[i] for i in idxs[0] if i < len(self.chunks)]


# ════════════════════════════════════════════════════════════
#  FEEDBACK MEMORY  (now contains LearningAgent)
# ════════════════════════════════════════════════════════════

class FeedbackMemory:

    def __init__(self, embedder: SentenceTransformer, data_layer: MongoDataLayer):
        self.embedder       = embedder
        self.db             = data_layer
        self.records        = []
        self.index          = None
        self.dim            = None
        # ── Learning Agent lives inside FeedbackMemory ────
        self.learning_agent = LearningAgent(data_layer=data_layer)
        self._load_and_rebuild()

    def _load_and_rebuild(self):
        self.records = self.db.load_all_corrections()
        if not self.records:
            logging.info("[FeedbackMemory] No past corrections in MongoDB yet")
            return
        texts = [r["search_text"] for r in self.records]
        embs  = self.embedder.encode(texts, convert_to_numpy=True).astype(np.float32)
        self.dim   = embs.shape[1]
        self.index = faiss.IndexFlatL2(self.dim)
        self.index.add(embs)
        logging.info(f"[FeedbackMemory] FAISS rebuilt from {len(self.records)} MongoDB docs")

    def store_correction(self,
                         question          : str,
                         student_answer    : str,
                         ai_score          : int,
                         evaluator_score   : int,
                         evaluator_feedback: str,
                         override_reason   : str,
                         student_label     : str = "",
                         question_id       : str = "",
                         base_id           : str = ""):
        faiss_index = len(self.records)
        record_id   = faiss_index + 1
        search_text = (
            f"Question: {question[:300]} "
            f"Student answer: {student_answer[:300]}"
        )
        record = {
            "faiss_index"        : faiss_index,
            "record_id"          : record_id,
            "timestamp"          : datetime.now(timezone.utc).isoformat(),
            "student_label"      : student_label,
            "question"           : question,
            "student_answer"     : student_answer[:500],
            "ai_score"           : ai_score,
            "evaluator_score"    : evaluator_score,
            "score_gap"          : evaluator_score - ai_score,
            "evaluator_feedback" : evaluator_feedback,
            "override_reason"    : override_reason,
            "search_text"        : search_text,
            "question_id"        : question_id,
            "base_id"            : base_id,
        }
        self.db.save_feedback_correction(record)
        self.records.append(record)

        emb = self.embedder.encode([search_text], convert_to_numpy=True).astype(np.float32)
        if self.index is None:
            self.dim   = emb.shape[1]
            self.index = faiss.IndexFlatL2(self.dim)
        self.index.add(emb)

        print(f"[MEMORY] Correction saved to MongoDB  "
              f"(total: {len(self.records)}  faiss_index={faiss_index})")

        # ── Learning Agent: trigger analysis every 5 corrections ──
        if len(self.records) % ANALYSIS_TRIGGER_EVERY == 0:
            self.learning_agent.run_cycle(self.records)

    def retrieve_similar(self, question: str, student_answer: str,
                         top_k: int = MAX_CONTEXT_SHOTS) -> list:
        if self.index is None or len(self.records) == 0:
            return []
        search_text = (
            f"Question: {question[:300]} "
            f"Student answer: {student_answer[:300]}"
        )
        q_emb = self.embedder.encode([search_text], convert_to_numpy=True).astype(np.float32)
        k       = min(top_k, len(self.records))
        _, idxs = self.index.search(q_emb, k)
        return [self.records[i] for i in idxs[0] if i < len(self.records)]

    def get_learning_stats(self) -> dict:
        if not self.records:
            return {
                "total_records"  : 0,
                "total_overrides": 0,
                "mean_abs_error" : None,
                "mean_gap"       : None,
                "trend"          : "No data yet",
                "recent_gaps"    : [],
            }
        overrides = [r for r in self.records if r["score_gap"] != 0]
        gaps      = [abs(r["score_gap"]) for r in overrides]
        raw_gaps  = [r["score_gap"]      for r in overrides]
        n         = len(gaps)
        trend     = "Not enough data (need ≥ 4 overrides)"
        if n >= 4:
            first_half  = float(np.mean(gaps[:n // 2]))
            second_half = float(np.mean(gaps[n // 2:]))
            delta       = second_half - first_half
            if delta < -0.3:
                trend = f"IMPROVING ↑  gap reduced by {abs(delta):.2f} pts"
            elif delta > 0.3:
                trend = f"WORSENING ↓  gap increased by {abs(delta):.2f} pts"
            else:
                trend = f"STABLE →  gap change {delta:+.2f} pts"
        return {
            "total_records"  : len(self.records),
            "total_overrides": n,
            "mean_abs_error" : round(float(np.mean(gaps)), 2) if gaps else None,
            "mean_gap"       : round(float(np.mean(raw_gaps)), 2) if raw_gaps else None,
            "trend"          : trend,
            "recent_gaps"    : raw_gaps[-5:],
        }

    def count(self) -> int:
        return len(self.records)


# ════════════════════════════════════════════════════════════
#  GROQ LLM WRAPPER
# ════════════════════════════════════════════════════════════

class GroqLLM:
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)

    def complete(self, system_prompt: str, user_prompt: str,
                 max_tokens: int = 2048) -> tuple:
        for model in MODEL_PRIORITY:
            try:
                print(f"[LLM] Trying {model}...")
                resp = self.client.chat.completions.create(
                    model    = model,
                    messages = [
                        {"role": "system", "content": system_prompt},
                        {"role": "user",   "content": user_prompt},
                    ],
                    max_tokens  = max_tokens,
                    temperature = 0.2,
                )
                text = resp.choices[0].message.content.strip()
                print(f"[LLM] ✓ Success with {model}")
                return text, model
            except Exception as e:
                print(f"[LLM] ✗ {model} failed: {e}")
                time.sleep(1)
        raise RuntimeError("All LLM models failed.")


# ════════════════════════════════════════════════════════════
#  SPELLING CHECKER
# ════════════════════════════════════════════════════════════

def detect_spelling_issues(text: str) -> list:
    common_errors = {
        "recieve": "receive", "occured": "occurred", "seperate": "separate",
        "definately": "definitely", "enviroment": "environment",
        "existance": "existence", "relevent": "relevant",
        "begining": "beginning", "arguement": "argument",
        "beleive": "believe", "grammer": "grammar",
        "independance": "independence", "knowlege": "knowledge",
        "neccessary": "necessary", "privelege": "privilege",
        "reccomend": "recommend", "succesful": "successful",
        "truely": "truly", "untill": "until", "writting": "writing",
    }
    issues = []
    for w in re.findall(r'\b[a-zA-Z]+\b', text.lower()):
        if w in common_errors:
            issues.append(f"'{w}' → should be '{common_errors[w]}'")
    return list(set(issues))


def score_to_grade(score: int) -> str:
    if score >= 10: return "A+"
    if score >= 9:  return "A"
    if score >= 8:  return "B+"
    if score >= 7:  return "B"
    if score >= 6:  return "C"
    if score >= 5:  return "D"
    return "F"


# ════════════════════════════════════════════════════════════
#  EVALUATION AGENT  (now contains SelfReflectionEngine)
# ════════════════════════════════════════════════════════════

class EvaluationAgent:

    SYSTEM_PROMPT = """You are an expert academic evaluator AI.

Evaluate the student answer against the correct model answer.
Score on a scale of 1 to 10 and provide detailed feedback.

SCORING GUIDE:
  10 = Perfect   8-9 = Very good   6-7 = Good
  4-5 = Average  2-3 = Below average  1 = Poor/wrong

IMPORTANT — IN-CONTEXT LEARNING:
If PAST CORRECTION EXAMPLES appear below, study them carefully.
They show where your previous scoring was corrected by a human.
Adjust your scoring judgment to match the human evaluator's pattern.

Output ONLY this exact JSON:
{
  "score": <integer 1-10>,
  "grade": "<A+/A/B+/B/C/D/F>",
  "summary": "<one sentence verdict>",
  "conceptual_accuracy": "<assessment>",
  "completeness": "<covered and missing>",
  "spelling_grammar": "<errors or No issues detected>",
  "strengths": "<what student did well>",
  "improvements": "<actionable suggestions>",
  "detailed_feedback": "<comprehensive paragraph>"
}"""

    def __init__(self, embedder: SentenceTransformer,
                 feedback_memory: FeedbackMemory):
        self.rag        = RAGEngine(embedder)
        self.llm        = GroqLLM(GROQ_API_KEY)
        self.memory     = feedback_memory
        # ── Self-Reflection Engine lives inside EvaluationAgent ──
        self.reflector  = SelfReflectionEngine()

    def ingest_answers(self, correct_answer: str, student_answer: str):
        self.rag.reset()
        self.rag.index_document(correct_answer, label="CORRECT_ANSWER")
        self.rag.index_document(student_answer,  label="STUDENT_ANSWER")
        self.correct_answer = correct_answer
        self.student_answer  = student_answer

    def evaluate(self, question      : str,
                 question_id         : str = "",
                 base_id             : str = "",
                 qa_retry_instruction: str = "") -> tuple:

        rag_context = self.rag.retrieve(
            f"Question: {question}. Evaluate student vs correct.", top_k=6)

        # ── Use upgraded context builder (Learning Agent + raw corrections) ──
        print("[MEMORY] Searching for similar past corrections...")
        learning_ctx, n_shots, similar = build_learning_context_upgraded(
            memory         = self.memory,
            learning_agent = self.memory.learning_agent,
            question       = question,
            student_answer = self.student_answer,
            max_shots      = MAX_CONTEXT_SHOTS,
        )

        calib = self.memory.learning_agent.get_calibration_note()
        if calib:
            print("[MEMORY] ✓ Calibration note injected into prompt")
        if n_shots > 0:
            print(f"[MEMORY] ✓ Injecting {n_shots} raw correction(s) into prompt")
        else:
            print("[MEMORY] No past corrections yet — evaluating from scratch")

        spelling_issues = detect_spelling_issues(self.student_answer)
        spell_note = (
            "Spelling issues: " + "; ".join(spelling_issues)
            if spelling_issues else "No common spelling issues detected."
        )

        user_prompt = f"""
QUESTION:
{question}

CORRECT MODEL ANSWER:
{self.correct_answer}

STUDENT ANSWER:
{self.student_answer}

RAG-RETRIEVED CONTEXT:
{chr(10).join(rag_context)}

AUTOMATED SPELLING CHECK:
{spell_note}
{learning_ctx}
{qa_retry_instruction}
Evaluate the student answer and return the JSON assessment.
"""
        raw_response, model_used = self.llm.complete(
            system_prompt = self.SYSTEM_PROMPT,
            user_prompt   = user_prompt,
            max_tokens    = 1500,
        )
        result = self._parse_response(raw_response)

        # ── Self-Reflection (runs inside evaluate before returning) ──
        if not result.get("parse_error"):
            reflection_report = self.reflector.reflect(
                result              = result,
                rag_chunks          = rag_context,
                similar_corrections = similar,
                student_answer      = self.student_answer,
                llm                 = self.llm,
                question            = question,
                correct_answer      = self.correct_answer,
            )
            result["self_reflection"] = reflection_report.to_dict()

        result["model_used"]          = model_used
        result["spelling_issues"]     = spelling_issues
        result["learning_shots_used"] = n_shots
        result["questionId"]          = question_id
        result["base_id"]             = base_id
        return result, n_shots

    def _parse_response(self, raw: str) -> dict:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return {"raw_response": raw, "score": "N/A", "parse_error": True}


# ════════════════════════════════════════════════════════════
#  PRETTY REPORT PRINTER
# ════════════════════════════════════════════════════════════

def print_report(question: str, correct_answer: str,
                 student_answer: str, result: dict,
                 student_label: str, n_shots: int = 0):
    LINE = "═" * 65
    THIN = "─" * 65
    print(f"\n{LINE}")
    print(f"  📋  EVALUATION REPORT  —  {student_label}")
    print(f"  🧠  In-context shots used: {n_shots}")

    # ── Show self-reflection confidence inline ────────────
    sr = result.get("self_reflection", {})
    if sr:
        conf = sr.get("self_confidence", "unknown")
        icons = {"high": "🟢", "medium": "🟡", "low": "🔴"}
        print(f"  🪞  Self-reflection: {icons.get(conf,'⚪')} {conf.upper()}"
              + (" — self-corrected" if sr.get("self_correction_applied") else ""))

    print(LINE)
    print(f"\n📌 QUESTION:\n   {question}\n")
    print(THIN)
    print(f"\n✅ CORRECT ANSWER:\n{correct_answer}\n")
    print(THIN)
    print(f"\n📝 STUDENT ANSWER:\n{student_answer}\n")
    print(THIN)

    if result.get("parse_error"):
        print("\n⚠️  Could not parse LLM output:")
        print(result.get("raw_response", ""))
        return

    print(f"\n🏆  AI SCORE : {result.get('score','?')} / 10  |  "
          f"GRADE : {result.get('grade','?')}")
    print(f"📣  VERDICT  : {result.get('summary','')}\n")
    print(THIN)

    for title, key in [
        ("🧠 Conceptual Accuracy",  "conceptual_accuracy"),
        ("📦 Completeness",          "completeness"),
        ("🔤 Spelling & Grammar",    "spelling_grammar"),
        ("💪 Strengths",             "strengths"),
        ("🔧 Areas for Improvement", "improvements"),
        ("📖 Detailed Feedback",     "detailed_feedback"),
    ]:
        print(f"\n{title}:\n   {result.get(key,'N/A')}")

    if result.get("spelling_issues"):
        print(f"\n⚠️  Misspellings detected:")
        for i in result["spelling_issues"]:
            print(f"   • {i}")
    else:
        print(f"\n✅  No common misspellings found.")

    # ── Self-correction note ──────────────────────────────
    if result.get("self_correction_note"):
        print(f"\n🔄  Self-correction applied:")
        print(f"   Original score: {sr.get('original_score','?')}/10")
        print(f"   Reason: {result['self_correction_note']}")

    print(f"\n🤖  Model: {result.get('model_used','unknown')}")
    print(f"\n{LINE}\n")


# ════════════════════════════════════════════════════════════
#  LEARNING REPORT
# ════════════════════════════════════════════════════════════

def print_learning_report(memory: FeedbackMemory, just_stored: dict = None):
    LINE  = "═" * 65
    THIN  = "─" * 65
    stats = memory.get_learning_stats()

    print(f"\n{LINE}")
    print("  🧠  IN-CONTEXT LEARNING REPORT  (MongoDB backed)")
    print(LINE)

    if just_stored:
        gap = (just_stored.get("evaluator_score", 0) -
               just_stored.get("ai_score", 0))
        direction = ("AI underscored" if gap > 0
                     else "AI overscored" if gap < 0 else "exact match")
        print(f"\n  📥  CORRECTION STORED TO MongoDB  →  feedback_memory")
        print(f"      Student       : {just_stored.get('student_label','—')}")
        print(f"      AI gave       : {just_stored.get('ai_score','?')} / 10")
        print(f"      Evaluator gave: {just_stored.get('evaluator_score','?')} / 10")
        print(f"      Score gap     : {gap:+d} pts  ({direction})")
        print(f"      Reason        : {just_stored.get('override_reason','—')}")

    print(f"\n{THIN}")
    print("  📊  CUMULATIVE STATISTICS")
    print(THIN)
    print(f"\n  Total records in MongoDB   : {stats['total_records']}")
    print(f"  Total overrides            : {stats['total_overrides']}")

    if stats["total_overrides"] > 0:
        print(f"  Mean Absolute Error (MAE)  : {stats['mean_abs_error']} pts")
        print(f"  Mean score gap             : "
              f"{stats['mean_gap']:+.2f} pts")
        print(f"\n  📈  Accuracy trend : {stats['trend']}")

        recent = stats.get("recent_gaps", [])
        if recent:
            bar = {-3:"▼▼▼",-2:"▼▼",-1:"▼",0:"━",1:"▲",2:"▲▲",3:"▲▲▲"}
            print(f"\n  Last {len(recent)} override gaps:")
            start = stats["total_overrides"] - len(recent) + 1
            for idx, g in enumerate(recent, start=start):
                b = bar.get(max(-3, min(3, g)), f"{g:+d}")
                print(f"    Override #{idx:>3} : {b:5}  ({g:+d} pts)")

    print(f"\n{THIN}")
    print(f"  🔮  Next evaluation will inject up to {MAX_CONTEXT_SHOTS} "
          f"corrections into the LLM prompt.")
    print(f"\n{LINE}\n")


# ════════════════════════════════════════════════════════════
#  HUMAN REVIEW & OVERRIDE
# ════════════════════════════════════════════════════════════

def human_review_and_override(result        : dict,
                               student_label : str,
                               question      : str,
                               student_answer: str,
                               memory        : FeedbackMemory,
                               question_id   : str = "",
                               base_id       : str = "") -> dict:
    LINE = "═" * 65
    THIN = "─" * 65

    ai_score = result.get("score", "N/A")
    ai_grade = (result.get("grade") or
                (score_to_grade(ai_score) if isinstance(ai_score, int) else "F"))
    result["ai_score"] = ai_score
    result["ai_grade"] = ai_grade

    print(f"\n{LINE}")
    print("  ⚠️   BELOW 50 %  —  HUMAN REVIEW REQUIRED")
    print(LINE)
    print(f"\n  Student   : {student_label}")
    print(f"  AI Score  : {ai_score} / 10")
    print(f"  Threshold : {REVIEW_THRESHOLD} / 10  (50 %)")
    print(THIN)

    print("\n  📝  STEP 1 — YOUR WRITTEN FEEDBACK")
    print("  Type DONE on a new line when finished.")
    print(THIN)
    lines = []
    while True:
        try:
            line = input("  > ")
        except EOFError:
            break
        if line.strip().upper() == "DONE":
            break
        lines.append(line)
    evaluator_feedback = "\n".join(lines).strip() or "(No comments)"
    result["evaluator_feedback"] = evaluator_feedback
    print(f"\n  ✅  Feedback recorded.")

    print(f"\n{THIN}")
    print(f"\n  📊  STEP 2 — SCORE DECISION")
    print(f"\n  AI gave  {ai_score} / 10  ({ai_grade})")
    print(f"\n  [1] Accept AI score     → keeps {ai_score} / 10")
    print(f"  [2] Override with yours → you enter 1-10")
    print(f"  [3] Flag as PENDING     → saves PENDING")
    print(THIN)

    while True:
        choice = input("\n  Enter 1, 2 or 3: ").strip()
        if choice in ("1", "2", "3"):
            break
        print("  Enter 1, 2 or 3.")

    result["review_triggered"] = True

    if choice == "1":
        result.update({
            "override_applied" : False,
            "evaluator_score"  : ai_score,
            "evaluator_grade"  : ai_grade,
            "final_score"      : ai_score,
            "final_grade"      : ai_grade,
            "override_reason"  : "Evaluator agreed with AI",
            "review_status"    : "REVIEWED — evaluator accepted AI score",
            "score"            : ai_score,
            "grade"            : ai_grade,
        })
        print(f"\n  ✅  AI score accepted : {ai_score} / 10")
        memory.store_correction(
            question=question, student_answer=student_answer,
            ai_score=ai_score, evaluator_score=ai_score,
            evaluator_feedback=evaluator_feedback,
            override_reason="Evaluator agreed with AI",
            student_label=student_label,
            question_id=question_id, base_id=base_id,
        )

    elif choice == "2":
        while True:
            raw = input("\n  Enter your score (1-10): ").strip()
            if raw.isdigit() and 1 <= int(raw) <= 10:
                ev_score = int(raw)
                break
            print("  Enter a whole number 1-10.")
        ev_grade        = score_to_grade(ev_score)
        override_reason = input("\n  One-line reason: ").strip() or "(No reason)"

        result.update({
            "override_applied" : True,
            "override_reason"  : override_reason,
            "evaluator_score"  : ev_score,
            "evaluator_grade"  : ev_grade,
            "final_score"      : ev_score,
            "final_grade"      : ev_grade,
            "review_status"    : f"REVIEWED — overridden AI:{ai_score}→Evaluator:{ev_score}",
            "score"            : ev_score,
            "grade"            : ev_grade,
        })
        print(f"\n  ✅  Override saved.")
        memory.store_correction(
            question=question, student_answer=student_answer,
            ai_score=ai_score, evaluator_score=ev_score,
            evaluator_feedback=evaluator_feedback,
            override_reason=override_reason,
            student_label=student_label,
            question_id=question_id, base_id=base_id,
        )
        print_learning_report(memory, just_stored={
            "student_label"     : student_label,
            "ai_score"          : ai_score,
            "evaluator_score"   : ev_score,
            "override_reason"   : override_reason,
            "evaluator_feedback": evaluator_feedback,
        })

    else:
        result.update({
            "override_applied" : False,
            "evaluator_score"  : "PENDING",
            "evaluator_grade"  : "PENDING",
            "final_score"      : "PENDING",
            "final_grade"      : "PENDING",
            "override_reason"  : "Flagged for re-evaluation",
            "review_status"    : "FLAGGED — pending re-evaluation",
        })
        print(f"\n  🚩  Flagged. AI score {ai_score}/10 saved for reference.")

    print(f"\n{LINE}\n")
    return result


# ════════════════════════════════════════════════════════════
#  BELOW-THRESHOLD GATE
# ════════════════════════════════════════════════════════════

def check_and_review(result        : dict,
                     student_label : str,
                     question      : str,
                     student_answer: str,
                     memory        : FeedbackMemory,
                     question_id   : str = "",
                     base_id       : str = "") -> dict:
    score = result.get("score", "N/A")
    if isinstance(score, int) and score < REVIEW_THRESHOLD:
        result = human_review_and_override(
            result, student_label, question, student_answer,
            memory, question_id, base_id)
    else:
        result.update({
            "review_triggered" : False,
            "ai_score"         : score,
            "ai_grade"         : result.get("grade", "N/A"),
            "evaluator_score"  : score,
            "evaluator_grade"  : result.get("grade", "N/A"),
            "final_score"      : score,
            "final_grade"      : result.get("grade", "N/A"),
            "review_status"    : "PASS — no review required",
        })
    return result


# ════════════════════════════════════════════════════════════
#  MAIN  —  now a thin bootstrap, Orchestrator does the work
# ════════════════════════════════════════════════════════════

def main():
    print("\n" + "═" * 65)
    print("  🚀  AGENTIC AI EVALUATION SYSTEM")
    print("       Orchestrator + QA Agent + Self-Reflection")
    print("       + Learning Agent | MongoDB + RAG")
    print("═" * 65)

    if GROQ_API_KEY in ("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", "", None):
        print("\n⚠️  Set GROQ_API_KEY:  export GROQ_API_KEY='gsk_...'")

    # ── Boot: load all components ─────────────────────────
    print("\n[BOOT] Loading embedding model...")
    embedder = SentenceTransformer(EMBEDDING_MODEL)

    print("[BOOT] Connecting to MongoDB...")
    data_layer = MongoDataLayer()

    print("[BOOT] Loading feedback memory + rebuilding FAISS...")
    memory = FeedbackMemory(embedder=embedder, data_layer=data_layer)
    print(f"[BOOT] {memory.count()} past correction(s) loaded")

    print("[BOOT] Initialising agents...")
    agent        = EvaluationAgent(embedder=embedder, feedback_memory=memory)
    qa_agent     = QAAgent()
    orchestrator = OrchestratorAgent(
        data_layer = data_layer,
        memory     = memory,
        agent      = agent,
        qa_agent   = qa_agent,
    )
    print("[BOOT] All 4 agents ready.\n")

    # ── Main loop ─────────────────────────────────────────
    while True:
        print(f"{'═' * 65}")
        print(f"  📝  NEW SESSION  |  Memory: {memory.count()} correction(s)")
        print(f"{'═' * 65}")
        print("\n  Enter 4-digit base ID (e.g. 0000)  or  'exit'")
        base_id = input("  Base ID: ").strip()

        if base_id.lower() == "exit":
            print(f"\n  ✅  Exiting. "
                  f"{memory.count()} correction(s) stored in MongoDB.")
            sys.exit(0)

        if not (len(base_id) == 4 and base_id.isdigit()):
            print("  ❌  Enter exactly 4 digits.")
            continue

        orchestrator.run_session(base_id)

        nxt = input("  Evaluate another ID? (yes/no): ").strip().lower()
        if nxt not in ("yes", "y"):
            print(f"\n  ✅  Done. {memory.count()} correction(s) stored.")
            sys.exit(0)


if __name__ == "__main__":
    main()