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

// Create new question with manual 4-digit ID - KEEP ONLY THIS VERSION
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received question creation request');
    console.log('📦 Request body:', req.body);
    console.log('📋 Headers:', req.headers['content-type']);
    
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
      evaluatorId
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

    // Validate 4-digit ID format
    if (!/^\d{4}$/.test(questionId)) {
      return res.status(400).json({
        success: false,
        error: 'Question ID must be a 4-digit number (1000-9999)'
      });
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
      evaluatorId: evaluatorId || null
    };

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
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    
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

// Get question by 4-digit ID
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