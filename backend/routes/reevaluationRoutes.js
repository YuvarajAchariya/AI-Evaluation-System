const express = require('express');
const router = express.Router();
const ReEvaluationRequest = require('../models/ReEvaluationRequest');


// ✅ SUBMIT RE-EVALUATION REQUEST
router.post('/submit-reevaluation', async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      evaluationId,
      questionId,
      universalId,
      questionText,
      studentAnswer,
      aiFeedback,
      detailedFeedback,
      originalMarks,
      expectedMarks,
      maxMarks,
      reason,
      additionalExplanation
    } = req.body;

    if (!studentId || !evaluationId || !reason || !additionalExplanation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // ❗ Prevent duplicate request for same evaluation
    const existing = await ReEvaluationRequest.findOne({
      studentId,
      evaluationId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Re-evaluation already requested for this question'
      });
    }

    const newRequest = new ReEvaluationRequest({
      studentId,
      studentName,
      evaluationId,
      questionId,
      universalId,
      questionText,
      studentAnswer,
      aiFeedback,
      detailedFeedback,
      originalMarks,
      expectedMarks,
      maxMarks,
      reason,
      additionalExplanation
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      request: newRequest
    });

  } catch (error) {
    console.error('Error submitting re-evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// ✅ GET STUDENT RE-EVALUATION REQUESTS
router.get('/student-reevaluations/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const requests = await ReEvaluationRequest.find({ studentId })
      .sort({ requestDate: -1 });

    res.json(requests);

  } catch (error) {
    console.error('Error fetching re-evaluations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
