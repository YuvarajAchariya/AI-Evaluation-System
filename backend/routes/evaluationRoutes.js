const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');

// Get ALL evaluations
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching all evaluations...');
    const evaluations = await Evaluation.find({})
      .sort({ timestamp_utc: -1 })
      .limit(100);
    
    console.log(`Found ${evaluations.length} evaluations`);
    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// Get evaluations with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const evaluations = await Evaluation.find({})
      .sort({ timestamp_utc: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Evaluation.countDocuments();
    
    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      evaluations
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get evaluation by ID
router.get('/:id', async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;