/**
 * =============================================================
 *  feedbackMemoryRoutes.js
 *  Location: backend/routes/feedbackMemoryRoutes.js
 *
 *  Express routes for the feedback_memory collection.
 *
 *  MOUNT IN server.js:
 *    const feedbackMemoryRoutes = require("./routes/feedbackMemoryRoutes");
 *    app.use("/api/feedback-memory", feedbackMemoryRoutes);
 *
 *  ENDPOINTS:
 *    GET    /api/feedback-memory                    → all corrections (paginated)
 *    GET    /api/feedback-memory/stats              → learning statistics
 *    GET    /api/feedback-memory/base/:baseId       → corrections for one base ID
 *    GET    /api/feedback-memory/question/:questionId → corrections for one question
 *    GET    /api/feedback-memory/overrides          → only overridden corrections
 *    GET    /api/feedback-memory/:recordId          → single correction by record_id
 *    DELETE /api/feedback-memory/:recordId          → delete one correction
 *    DELETE /api/feedback-memory/all                → delete ALL (use with caution)
 * =============================================================
 */

const express = require("express");
const router = express.Router();
const FeedbackMemory = require("../models/FeedbackMemory");

// ════════════════════════════════════════════════════════════
//  GET /api/feedback-memory
//  Returns all corrections, newest first, with pagination.
//  Query params: ?limit=50&skip=0
// ════════════════════════════════════════════════════════════
router.get("/", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;

        const [records, total] = await Promise.all([
            FeedbackMemory.find({}, { search_text: 0 })  // hide raw search_text
                .sort({ faiss_index: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            FeedbackMemory.countDocuments(),
        ]);

        return res.status(200).json({
            success: true,
            total,
            limit,
            skip,
            count: records.length,
            records,
        });
    } catch (err) {
        console.error("[feedbackMemoryRoutes] GET / error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/feedback-memory/stats
//  Returns learning accuracy statistics.
//  Used by dashboard to display MAE, trend, override rate.
// ════════════════════════════════════════════════════════════
router.get("/stats", async (req, res) => {
    try {
        const stats = await FeedbackMemory.getLearningStats();
        return res.status(200).json({ success: true, stats });
    } catch (err) {
        console.error("[feedbackMemoryRoutes] GET /stats error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/feedback-memory/overrides
//  Returns only corrections where the evaluator changed the score
//  (score_gap !== 0).  Useful for learning analysis.
// ════════════════════════════════════════════════════════════
router.get("/overrides", async (req, res) => {
    try {
        const records = await FeedbackMemory.find(
            { score_gap: { $ne: 0 } },
            { search_text: 0 }
        )
            .sort({ faiss_index: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: records.length,
            records,
        });
    } catch (err) {
        console.error("[feedbackMemoryRoutes] GET /overrides error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/feedback-memory/base/:baseId
//  Returns all corrections for a specific 4-digit base ID
//  e.g. GET /api/feedback-memory/base/0000
// ════════════════════════════════════════════════════════════
router.get("/base/:baseId", async (req, res) => {
    try {
        const { baseId } = req.params;

        const records = await FeedbackMemory.find(
            { base_id: baseId },
            { search_text: 0 }
        )
            .sort({ faiss_index: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            base_id: baseId,
            count: records.length,
            records,
        });
    } catch (err) {
        console.error("[feedbackMemoryRoutes] GET /base/:baseId error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/feedback-memory/question/:questionId
//  Returns all corrections for a specific question
//  e.g. GET /api/feedback-memory/question/0000-3
// ════════════════════════════════════════════════════════════
router.get("/question/:questionId", async (req, res) => {
    try {
        const { questionId } = req.params;

        const records = await FeedbackMemory.find(
            { question_id: questionId },
            { search_text: 0 }
        )
            .sort({ faiss_index: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            question_id: questionId,
            count: records.length,
            records,
        });
    } catch (err) {
        console.error("[feedbackMemoryRoutes] GET /question/:questionId error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ════════════════════════════════════════════════════════════
//  GET /api/feedback-memory/:recordId
//  Returns a single correction by its record_id (1-based integer)
//  e.g. GET /api/feedback-memory/1
// ════════════════════════════════════════════════════════════
router.get("/:recordId", async (req, res) => {
    try {
        const recordId = parseInt(req.params.recordId);
        if (isNaN(recordId)) {
            return res.status(400).json({
                success: false,
                message: "recordId must be an integer",
            });
        }

        const record = await FeedbackMemory.findOne(
            { record_id: recordId },
            { search_text: 0 }
        ).lean();

        if (!record) {
            return res.status(404).json({
                success: false,
                message: `No correction found with record_id=${recordId}`,
            });
        }

        return res.status(200).json({ success: true, record });
    } catch (err) {
        console.error("[feedbackMemoryRoutes] GET /:recordId error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ════════════════════════════════════════════════════════════
//  DELETE /api/feedback-memory/all
//  Deletes ALL corrections from the collection.
//
//  ⚠️  WARNING: After calling this, restart the Python
//  evaluation_system.py so FAISS is rebuilt from scratch.
//  The faiss_index values will reset to 0 on next insertion.
// ════════════════════════════════════════════════════════════
router.delete("/all", async (req, res) => {
    try {
        const result = await FeedbackMemory.deleteMany({});
        console.warn(
            `[feedbackMemoryRoutes] DELETE ALL — removed ${result.deletedCount} corrections`
        );
        return res.status(200).json({
            success: true,
            deletedCount: result.deletedCount,
            message: "All feedback memory records deleted. Restart evaluation_system.py to rebuild FAISS.",
        });
    } catch (err) {
        console.error("[feedbackMemoryRoutes] DELETE /all error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ════════════════════════════════════════════════════════════
//  DELETE /api/feedback-memory/:recordId
//  Deletes a single correction by record_id.
//
//  ⚠️  NOTE: Deleting a record does NOT shift faiss_index values.
//  The FAISS position for that slot becomes a "ghost" until
//  the Python app is restarted (which rebuilds from MongoDB).
//  For safety, restart evaluation_system.py after deletion.
// ════════════════════════════════════════════════════════════
router.delete("/:recordId", async (req, res) => {
    try {
        const recordId = parseInt(req.params.recordId);
        if (isNaN(recordId)) {
            return res.status(400).json({
                success: false,
                message: "recordId must be an integer",
            });
        }

        const result = await FeedbackMemory.deleteOne({ record_id: recordId });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: `No correction found with record_id=${recordId}`,
            });
        }

        return res.status(200).json({
            success: true,
            deletedCount: result.deletedCount,
            message: `Correction ${recordId} deleted. Restart evaluation_system.py to rebuild FAISS.`,
        });
    } catch (err) {
        console.error("[feedbackMemoryRoutes] DELETE /:recordId error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;