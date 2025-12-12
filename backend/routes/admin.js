const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Evaluator = require('../models/Evaluator');
const Admin = require('../models/Admin');

// Admin dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalStudents,
      totalEvaluators,
      studentsWithEvaluations,
      recentStudents,
      recentEvaluators
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Evaluator.countDocuments({ isActive: true }),
      Student.countDocuments({ 
        'evaluations.0': { $exists: true },
        isActive: true 
      }),
      Student.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5),
      Evaluator.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const studentsWithoutEvaluations = totalStudents - studentsWithEvaluations;

    res.json({
      success: true,
      data: {
        totals: {
          students: totalStudents,
          evaluators: totalEvaluators,
          evaluated: studentsWithEvaluations,
          pending: studentsWithoutEvaluations
        },
        recent: {
          students: recentStudents,
          evaluators: recentEvaluators
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching dashboard data' 
    });
  }
});

// Get all students with evaluations
router.get('/students', async (req, res) => {
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
      error: 'Error fetching students' 
    });
  }
});

// Get all evaluators
router.get('/evaluators', async (req, res) => {
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
      error: 'Error fetching evaluators' 
    });
  }
});

module.exports = router;