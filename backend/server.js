// server.js - UPDATED VERSION
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your React app URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Models for direct use in routes
const Evaluation = require('./models/Evaluation');
const ReEvaluationRequest = require('./models/ReEvaluationRequest');

// Routes with error handling
const loadRoute = (routePath, routeName) => {
  try {
    return require(routePath);
  } catch (error) {
    console.warn(`⚠️  ${routeName} route not found: ${routePath}`);
    const router = express.Router();
    router.all('*', (req, res) => {
      res.status(501).json({
        success: false,
        error: `${routeName} routes not implemented yet`
      });
    });
    return router;
  }
};

const feedbackMemoryRoutes = require("./routes/feedbackMemoryRoutes");
app.use("/api/feedback-memory", feedbackMemoryRoutes);

// Routes
app.use('/api/upload-debug', require('./routes/upload-debug'));
app.use('/api/students', loadRoute('./routes/students', 'Students'));
app.use('/api/evaluators', loadRoute('./routes/evaluators', 'Evaluators'));
app.use('/api/admin', loadRoute('./routes/admin', 'Admin'));
app.use('/api/auth', loadRoute('./routes/auth', 'Auth'));
app.use('/api/auth/evaluator', loadRoute('./routes/evaluatorAuth', 'Evaluator Auth'));
app.use('/api/upload', loadRoute('./routes/upload', 'Upload'));
app.use('/api/questions', loadRoute('./routes/questions', 'Questions'));
app.use('/api/evaluations', loadRoute('./routes/evaluations', 'Evaluations'));
app.use('/api', require('./routes/revaluationRoutes'));

// ===== ADD THESE NEW ENDPOINTS FOR STUDENT HOME PAGE =====

// 1. Get ALL evaluations (for admin view)
app.get('/api/all-evaluations', async (req, res) => {
  try {
    console.log('📊 Fetching ALL evaluations...');
    const evaluations = await Evaluation.find({})
      .sort({ timestamp_utc: -1 })
      .limit(100);

    console.log(`✅ Found ${evaluations.length} evaluations`);
    res.json(evaluations);
  } catch (error) {
    console.error('❌ Error fetching evaluations:', error);
    // Return test data if database fails
    res.json([
      {
        _id: 'test-1',
        questionId: '2222-3',
        questionText: 'Question 3 text here',
        studentAnswer: 'Answer three, Aim',
        maxMarks: 10,
        ai_marks_awarded: 7.5,
        ai_percentage: 75,
        ai_feedback: 'Good answer but could be more detailed',
        ai_model_used: 'llama-3.1-70b-versatile',
        universalId: 'UNIV-2222',
        timestamp_utc: '2025-12-28T12:43:09.262Z'
      },
      {
        _id: 'test-2',
        questionId: '2222-4',
        questionText: 'Question 4 text here',
        studentAnswer: 'Answer four, Angular',
        maxMarks: 10,
        ai_marks_awarded: 8.0,
        ai_percentage: 80,
        ai_feedback: 'Excellent answer, covers all points',
        ai_model_used: 'llama-3.1-70b-versatile',
        universalId: 'UNIV-2222',
        timestamp_utc: '2025-12-28T12:43:09.264Z'
      }
    ]);
  }
});

// 2. Get ALL re-evaluation requests
app.get('/api/all-reevaluations', async (req, res) => {
  try {
    const requests = await ReEvaluationRequest.find({})
      .sort({ requestDate: -1 })
      .limit(50);

    res.json(requests);
  } catch (error) {
    console.error('Error fetching re-evaluation requests:', error);
    res.json([]); // Return empty array on error
  }
});

// 3. Submit new re-evaluation request
app.post('/api/submit-reevaluation', async (req, res) => {
  try {
    const requestData = req.body;

    console.log('📝 New re-evaluation request:', requestData);

    const newRequest = new ReEvaluationRequest({
      studentId: requestData.studentId || 'demo-student',
      studentName: requestData.studentName || 'Demo Student',
      questionId: requestData.questionId,
      evaluationId: requestData.evaluationId,
      originalMarks: requestData.originalMarks || 0,
      expectedMarks: requestData.expectedMarks || 0,
      maxMarks: requestData.maxMarks || 10,
      reason: requestData.reason || 'No reason provided',
      additionalExplanation: requestData.additionalExplanation || '',
      questionText: requestData.questionText || '',
      studentAnswer: requestData.studentAnswer || '',
      aiFeedback: requestData.aiFeedback || '',
      detailedFeedback: requestData.detailedFeedback || '',
      status: 'pending',
      requestDate: new Date(),
      universalId: requestData.universalId
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: 'Re-evaluation request submitted successfully',
      request: newRequest
    });
  } catch (error) {
    console.error('Error submitting re-evaluation request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit request',
      details: error.message
    });
  }
});

// 4. Get evaluations for specific student (by universalId)
app.get('/api/student-evaluations/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`🔍 Fetching evaluations for student: ${studentId}`);

    // Try different ways to find student evaluations
    let evaluations = await Evaluation.find({
      $or: [
        { universalId: studentId },
        { universalId: { $regex: studentId, $options: 'i' } },
        { studentId: studentId },
        { fileId: studentId }
      ]
    })
      .sort({ timestamp_utc: -1 })
      .limit(50);

    // If no evaluations found with exact match, try partial match
    if (evaluations.length === 0) {
      // Extract numeric part from studentId (e.g., "973140" -> "3140")
      const numericId = studentId.replace(/\D/g, '');
      if (numericId.length >= 4) {
        const baseId = numericId.slice(-4);
        evaluations = await Evaluation.find({
          universalId: { $regex: baseId, $options: 'i' }
        })
          .sort({ timestamp_utc: -1 })
          .limit(50);
      }
    }

    console.log(`✅ Found ${evaluations.length} evaluations for student ${studentId}`);

    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching student evaluations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student evaluations',
      details: error.message
    });
  }
});

// 5. Get re-evaluation requests for specific student
app.get('/api/student-reevaluations/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const requests = await ReEvaluationRequest.find({
      studentId: studentId
    })
      .sort({ requestDate: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching student re-evaluation requests:', error);
    res.json([]);
  }
});

// ===== END OF NEW ENDPOINTS =====

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      allEvaluations: '/api/all-evaluations',
      submitReEvaluation: '/api/submit-reevaluation',
      studentEvaluations: '/api/student-evaluations/:studentId'
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const evalCount = await Evaluation.countDocuments();
    const reevalCount = await ReEvaluationRequest.countDocuments();

    res.json({
      success: true,
      evaluations: evalCount,
      reEvaluationRequests: reevalCount,
      database: 'connected'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);

  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found: ' + req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📍 DB Status: http://localhost:${PORT}/api/db-status`);
  console.log(`📍 All Evaluations: http://localhost:${PORT}/api/all-evaluations`);
  console.log(`📍 Test Student: http://localhost:${PORT}/api/student-evaluations/973140`);
  console.log(`📍 Test Student: http://localhost:${PORT}/api/student-evaluations/UNIV-2222`);
});