/**
 * =============================================================
 *  FeedbackMemory.js
 *  Location: backend/models/FeedbackMemory.js
 *
 *  MongoDB / Mongoose model for the feedback_memory collection.
 *
 *  PURPOSE:
 *    Stores every evaluator correction (human override) so the
 *    Python evaluation system can load them at startup, rebuild
 *    its FAISS vector index, and inject past corrections into
 *    the LLM prompt as in-context learning examples.
 *
 *  WRITTEN BY:  evaluation_system.py  (Python — via pymongo)
 *  READ BY:     evaluation_system.py  (Python — via pymongo)
 *               feedbackMemoryRoutes.js (Node — via Mongoose)
 *
 *  COLLECTION NAME: feedback_memory
 * =============================================================
 */

const mongoose = require("mongoose");

// ── Sub-schema: nothing complex, flat document ──────────────
const FeedbackMemorySchema = new mongoose.Schema(
    {
        // ── FAISS mapping ──────────────────────────────────────
        // faiss_index is the integer position this document occupies
        // in the in-RAM FAISS vector index rebuilt at Python startup.
        // It is assigned sequentially (0, 1, 2 …) and NEVER changes.
        // When FAISS returns position N → fetch doc where faiss_index=N
        faiss_index: {
            type: Number,
            required: true,
            unique: true,    // must be unique — 1-to-1 with FAISS slot
            index: true,
        },

        // ── Human-readable sequential ID ──────────────────────
        record_id: {
            type: Number,
            required: true,
        },

        // ── When this correction was stored ───────────────────
        timestamp: {
            type: String,   // ISO string set by Python
            default: () => new Date().toISOString(),
        },

        // ── Who was evaluated ─────────────────────────────────
        student_label: {
            type: String,
            default: "",
        },

        // ── Question + answer context ─────────────────────────
        question: {
            type: String,
            required: true,
        },

        // Stored as first 500 chars (same limit as Python side)
        student_answer: {
            type: String,
            required: true,
        },

        // ── Score data ────────────────────────────────────────
        ai_score: {
            type: Number,
            required: true,
        },

        evaluator_score: {
            type: Number,
            required: true,
        },

        // evaluator_score - ai_score  (positive = AI under-scored)
        score_gap: {
            type: Number,
            required: true,
        },

        // ── Evaluator's written comments ──────────────────────
        evaluator_feedback: {
            type: String,
            default: "",
        },

        // ── One-line reason for the override ──────────────────
        override_reason: {
            type: String,
            default: "",
        },

        // ── Text that was embedded into FAISS ─────────────────
        // Format: "Question: <question[:300]> Student answer: <answer[:300]>"
        // This is re-embedded at startup to rebuild the FAISS index.
        search_text: {
            type: String,
            required: true,
        },

        // ── Links back to exam identifiers ────────────────────
        question_id: {
            type: String,   // e.g. "0000-1"
            default: "",
            index: true,
        },

        base_id: {
            type: String,   // e.g. "0000"
            default: "",
            index: true,
        },
    },
    {
        collection: "feedback_memory",  // explicit collection name
        timestamps: false,              // we manage timestamp ourselves
        versionKey: false,
    }
);

// ── Compound indexes for common queries ──────────────────────
FeedbackMemorySchema.index({ base_id: 1, timestamp: -1 });
FeedbackMemorySchema.index({ question_id: 1, timestamp: -1 });
FeedbackMemorySchema.index({ score_gap: 1 });
FeedbackMemorySchema.index({ ai_score: 1 });

// ── Static helper: get learning stats ────────────────────────
// Returns MAE, mean gap, override count — mirrors Python's
// FeedbackMemoryModel.get_learning_stats()
FeedbackMemorySchema.statics.getLearningStats = async function () {
    const total = await this.countDocuments();

    // Only records where evaluator actually changed the score
    const overrides = await this.find(
        { score_gap: { $ne: 0 } },
        { score_gap: 1, ai_score: 1, evaluator_score: 1, _id: 0 }
    ).sort({ faiss_index: 1 });

    if (overrides.length === 0) {
        return {
            total_records: total,
            total_overrides: 0,
            override_rate_pct: 0,
            mean_abs_error: null,
            mean_gap: null,
            trend: "No override data yet",
            recent_gaps: [],
        };
    }

    const gaps = overrides.map((r) => Math.abs(r.score_gap));
    const rawGaps = overrides.map((r) => r.score_gap);
    const n = gaps.length;

    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    let trend = "Not enough data (need ≥ 4 overrides)";
    if (n >= 4) {
        const firstHalf = mean(gaps.slice(0, Math.floor(n / 2)));
        const secondHalf = mean(gaps.slice(Math.floor(n / 2)));
        const delta = secondHalf - firstHalf;
        if (delta < -0.3) trend = `IMPROVING ↑  gap reduced by ${Math.abs(delta).toFixed(2)} pts`;
        else if (delta > 0.3) trend = `WORSENING ↓  gap increased by ${Math.abs(delta).toFixed(2)} pts`;
        else trend = `STABLE →  gap change ${delta >= 0 ? "+" : ""}${delta.toFixed(2)} pts`;
    }

    return {
        total_records: total,
        total_overrides: n,
        override_rate_pct: parseFloat(((n / total) * 100).toFixed(1)),
        mean_abs_error: parseFloat(mean(gaps).toFixed(2)),
        mean_gap: parseFloat(mean(rawGaps).toFixed(2)),
        trend,
        recent_gaps: rawGaps.slice(-5),
    };
};

module.exports = mongoose.model("FeedbackMemory", FeedbackMemorySchema);