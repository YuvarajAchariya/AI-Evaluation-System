const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// Get all questions for a subject
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const questions = await Question.find({ 
      subjectId: req.params.subjectId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get questions by evaluator
router.get('/evaluator/:evaluatorId', async (req, res) => {
  try {
    const questions = await Question.find({ 
      evaluatorId: req.params.evaluatorId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create new question with manual 4-digit ID or 4-digit-dash-single-digit format
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received question creation request');
    console.log('📦 Request body:', req.body);
    
    const {
      questionId,
      questionText,
      referenceAnswer,
      maxMarks,
      subjectId,
      subjectName,
      difficulty,
      questionType,
      keywords,
      evaluatorId,
      questionNumber,
      baseQuestionId
    } = req.body;

    console.log('🔍 Extracted fields:');
    console.log('  - questionId:', questionId);
    console.log('  - questionText:', questionText);
    console.log('  - referenceAnswer:', referenceAnswer);
    console.log('  - maxMarks:', maxMarks);
    console.log('  - subjectId:', subjectId);
    console.log('  - subjectName:', subjectName);

    // Validation
    if (!questionId || !questionText || !referenceAnswer || !maxMarks || !subjectId || !subjectName) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: questionId, questionText, referenceAnswer, maxMarks, subjectId, subjectName',
        receivedData: {
          questionId: questionId,
          questionText: questionText,
          referenceAnswer: referenceAnswer,
          maxMarks: maxMarks,
          subjectId: subjectId,
          subjectName: subjectName
        }
      });
    }

    // Validate ID format - Allow both 4-digit OR 4-digit-dash-single-digit
    const isValidFormat = /^\d{4}$/.test(questionId) || /^\d{4}-\d$/.test(questionId);
    if (!isValidFormat) {
      return res.status(400).json({
        success: false,
        error: 'Question ID must be: 4-digit number (e.g., 1234) OR 4-digit-dash-single-digit (e.g., 1234-1)'
      });
    }

    // Validate 4-digit base for dash format
    if (questionId.includes('-')) {
      const baseId = questionId.split('-')[0];
      if (!/^\d{4}$/.test(baseId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid format: Base ID must be 4 digits (e.g., 1234-1, 1234-2)'
        });
      }
      
      const suffix = parseInt(questionId.split('-')[1]);
      if (isNaN(suffix) || suffix < 1 || suffix > 5) {
        return res.status(400).json({
          success: false,
          error: 'Question suffix must be between 1 and 5 (e.g., 1234-1 to 1234-5)'
        });
      }
    }

    // Check if question ID already exists
    const existingQuestion = await Question.findOne({ questionId });
    if (existingQuestion) {
      return res.status(400).json({
        success: false,
        error: `Question ID ${questionId} already exists. Please use a different ID.`
      });
    }

    const questionData = {
      questionId,
      questionText,
      referenceAnswer,
      maxMarks: parseInt(maxMarks),
      subjectId,
      subjectName,
      difficulty: difficulty || 'medium',
      questionType: questionType || 'descriptive',
      keywords: keywords || [],
      evaluatorId: evaluatorId || null,
      // Add optional fields if provided
      ...(questionNumber && { questionNumber }),
      ...(baseQuestionId && { baseQuestionId })
    };

    // Auto-extract baseQuestionId from dash format
    if (questionId.includes('-') && !baseQuestionId) {
      questionData.baseQuestionId = questionId.split('-')[0];
    }
    
    // Auto-extract questionNumber from dash format
    if (questionId.includes('-') && !questionNumber) {
      questionData.questionNumber = parseInt(questionId.split('-')[1]);
    }

    console.log('💾 Creating question with data:', questionData);

    const question = new Question(questionData);
    await question.save();

    console.log('✅ Question saved successfully with ID:', question.questionId);

    res.status(201).json({
      success: true,
      data: question,
      message: `Question created successfully with ID: ${question.questionId}`
    });
  } catch (error) {
    console.error('❌ Error creating question:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: `Question ID ${req.body.questionId} already exists. Please use a different ID.`
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${errors.join(', ')}`,
        validationErrors: errors
      });
    }
    
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get question by ID (supports both formats)
router.get('/id/:questionId', async (req, res) => {
  try {
    const question = await Question.findOne({ 
      questionId: req.params.questionId,
      isActive: true 
    });

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: `Question with ID ${req.params.questionId} not found` 
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all questions by base ID (e.g., all questions with base 1234)
router.get('/base/:baseQuestionId', async (req, res) => {
  try {
    const questions = await Question.find({ 
      baseQuestionId: req.params.baseQuestionId,
      isActive: true 
    }).sort({ questionNumber: 1 });

    if (!questions || questions.length === 0) {
      // Fallback: Try to find by questionId pattern
      const patternQuestions = await Question.find({
        questionId: { $regex: `^${req.params.baseQuestionId}-` },
        isActive: true
      }).sort({ questionNumber: 1 });
      
      if (patternQuestions.length > 0) {
        return res.json({
          success: true,
          data: patternQuestions,
          count: patternQuestions.length
        });
      }
      
      return res.status(404).json({ 
        success: false, 
        error: `No questions found with base ID ${req.params.baseQuestionId}` 
      });
    }

    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update question
router.put('/:id', async (req, res) => {
  try {
    // Prevent updating questionId to maintain consistency
    if (req.body.questionId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update question ID. Please delete and create a new question instead.'
      });
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    res.json({
      success: true,
      data: question,
      message: 'Question updated successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete question (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Bulk delete questions by base ID
router.delete('/base/:baseQuestionId', async (req, res) => {
  try {
    const result = await Question.updateMany(
      { 
        $or: [
          { baseQuestionId: req.params.baseQuestionId },
          { questionId: { $regex: `^${req.params.baseQuestionId}-` } }
        ],
        isActive: true
      },
      { isActive: false }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `No active questions found with base ID ${req.params.baseQuestionId}` 
      });
    }

    res.json({
      success: true,
      message: `Deleted ${result.modifiedCount} questions with base ID ${req.params.baseQuestionId}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get question by MongoDB ID
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all questions (for admin)
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;