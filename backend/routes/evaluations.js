const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Question = require('../models/Question');

// Get all evaluations
router.get('/', async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .sort({ evaluationDate: -1 });

    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get evaluations by question ID (4-digit)
router.get('/question/:questionId', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ 
      questionId: req.params.questionId 
    }).sort({ evaluationDate: -1 });

    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get evaluations by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ 
      studentId: req.params.studentId 
    }).sort({ evaluationDate: -1 });

    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create evaluation with same 4-digit question ID
router.post('/', async (req, res) => {
  try {
    const {
      questionId,
      studentAnswer,
      studentId,
      evaluatorId,
      subjectId,
      subjectName
    } = req.body;

    // Validate required fields
    if (!questionId || !studentAnswer) {
      return res.status(400).json({
        success: false,
        error: 'questionId and studentAnswer are required'
      });
    }

    // Validate 4-digit question ID format
    if (!/^\d{4}$/.test(questionId)) {
      return res.status(400).json({
        success: false,
        error: 'Question ID must be a 4-digit number'
      });
    }

    // Verify question exists
    const question = await Question.findOne({ 
      questionId: questionId,
      isActive: true 
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: `Question with ID ${questionId} not found`
      });
    }

    // Create evaluation data using the same question ID
    const evaluationData = {
      questionId: question.questionId, // Same 4-digit ID
      questionText: question.questionText,
      referenceAnswer: question.referenceAnswer,
      maxMarks: question.maxMarks,
      studentAnswer: studentAnswer,
      studentId: studentId || null,
      evaluatorId: evaluatorId || null,
      subjectId: subjectId || question.subjectId,
      subjectName: subjectName || question.subjectName,
      // These will be populated by AI evaluation
      marksAwarded: 0, // Default, will be updated by AI
      percentage: 0,   // Default, will be updated by AI
      justification: 'Pending evaluation',
      strengths: [],
      weaknesses: [],
      missingConcepts: [],
      suggestions: 'Pending evaluation'
    };

    const evaluation = new Evaluation(evaluationData);
    await evaluation.save();

    res.status(201).json({
      success: true,
      data: evaluation,
      message: `Evaluation created for Question ID: ${question.questionId}`
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Other routes remain similar but now use questionId for queries...

module.exports = router;