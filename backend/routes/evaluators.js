const express = require('express');
const router = express.Router();
const Evaluator = require('../models/Evaluator');

// GET all evaluators
router.get('/', async (req, res) => {
  try {
    const evaluators = await Evaluator.find({ isActive: true })
      .populate('assignedStudents')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: evaluators,
      count: evaluators.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET evaluator by ID
router.get('/:id', async (req, res) => {
  try {
    const evaluator = await Evaluator.findById(req.params.id)
      .populate('assignedStudents');
    
    if (!evaluator) {
      return res.status(404).json({ 
        success: false, 
        error: 'Evaluator not found' 
      });
    }

    res.json({
      success: true,
      data: evaluator
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// CREATE new evaluator
router.post('/', async (req, res) => {
  try {
    const evaluator = new Evaluator(req.body);
    await evaluator.save();

    res.status(201).json({
      success: true,
      data: evaluator,
      message: 'Evaluator created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
});

// UPDATE evaluator
router.put('/:id', async (req, res) => {
  try {
    const evaluator = await Evaluator.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!evaluator) {
      return res.status(404).json({ 
        success: false, 
        error: 'Evaluator not found' 
      });
    }

    res.json({
      success: true,
      data: evaluator,
      message: 'Evaluator updated successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE evaluator (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const evaluator = await Evaluator.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!evaluator) {
      return res.status(404).json({ 
        success: false, 
        error: 'Evaluator not found' 
      });
    }

    res.json({
      success: true,
      message: 'Evaluator deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Assign student to evaluator
router.post('/:id/assign-student', async (req, res) => {
  try {
    const { studentId } = req.body;
    const evaluator = await Evaluator.findById(req.params.id);
    
    if (!evaluator) {
      return res.status(404).json({ 
        success: false, 
        error: 'Evaluator not found' 
      });
    }

    if (!evaluator.assignedStudents.includes(studentId)) {
      evaluator.assignedStudents.push(studentId);
      await evaluator.save();
    }

    res.json({
      success: true,
      data: evaluator,
      message: 'Student assigned successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;