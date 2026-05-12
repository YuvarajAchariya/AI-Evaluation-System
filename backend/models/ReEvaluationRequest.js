const mongoose = require('mongoose');

const ReEvaluationRequestSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  evaluationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation',
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  universalId: {
    type: String
  },
  questionText: {
    type: String
  },
  studentAnswer: {
    type: String
  },
  aiFeedback: {
    type: String
  },
  detailedFeedback: {
    type: String
  },
  originalMarks: {
    type: Number,
    required: true
  },
  expectedMarks: {
    type: Number,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  additionalExplanation: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ReEvaluationRequest', ReEvaluationRequestSchema);
