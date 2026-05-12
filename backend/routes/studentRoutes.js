const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');

// Get evaluations for a specific student (by universalId)
router.get('/:studentId/evaluations', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Try to find evaluations by universalId
    const evaluations = await Evaluation.find({
      $or: [
        { universalId: studentId },
        { universalId: { $regex: studentId, $options: 'i' } },
        { studentId: studentId }
      ]
    })
    .sort({ timestamp_utc: -1 })
    .limit(50);
    
    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching student evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

module.exports = router;