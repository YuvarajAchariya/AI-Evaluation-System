const express = require('express');
const router = express.Router();
const ReEvaluationRequest = require('../models/ReEvaluationRequest');
const Evaluation = require('../models/Evaluation');


// ================= GET ALL PENDING REQUESTS =================
router.get('/reevaluations/pending', async (req, res) => {
  try {
    const requests = await ReEvaluationRequest
      .find({ status: 'pending' })
      .sort({ requestDate: -1 });

    res.json(requests);

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// ================= APPROVE / REJECT =================
router.post('/reevaluations/review/:id', async (req, res) => {
  try {
    const { newMarks, comments, decision } = req.body;

    const request = await ReEvaluationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Already reviewed' });
    }

    // If approved → update Evaluation document with new marks + evaluator feedback
    if (decision === 'approved') {
      const correctedPct = request.maxMarks > 0
        ? parseFloat(((newMarks / request.maxMarks) * 100).toFixed(1))
        : 0;

      await Evaluation.findByIdAndUpdate(
        request.evaluationId,
        {
          marksAwarded:           newMarks,
          percentage:             correctedPct,
          human_corrected_marks:  newMarks,
          corrected_percentage:   correctedPct,
          evaluatorFeedback:      comments || '',
          requires_human_correction: false,
          reEvaluated:            true,
        },
        { new: true }
      );

      request.updatedMarks = newMarks;
    }

    // Always save comments + decision back to the re-evaluation request
    request.status           = decision;
    request.evaluatorComments = comments || '';
    request.reviewedAt       = new Date();

    await request.save();

    res.json({ success: true, message: 'Re-evaluation review saved successfully' });

  } catch (err) {
    console.error('Error reviewing re-evaluation:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
