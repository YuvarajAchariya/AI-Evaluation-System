const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .populate('evaluations.evaluatorId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('evaluations.evaluatorId');
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// CREATE new student
router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();

    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        error: 'Email or Roll Number already exists' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
});

// UPDATE student
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    res.json({
      success: true,
      data: student,
      message: 'Student updated successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE student (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add evaluation to student
router.post('/:id/evaluations', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    student.evaluations.push(req.body);
    await student.save();

    res.json({
      success: true,
      data: student,
      message: 'Evaluation added successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;