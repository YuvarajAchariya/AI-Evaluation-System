const mongoose = require('mongoose');

const ReEvaluationRequestSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },

  evaluationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation',
    required: true
  },

  questionId: String,
  universalId: String,
  questionText: String,
  studentAnswer: String,
  aiFeedback: String,
  detailedFeedback: String,

  originalMarks: { type: Number, required: true },
  expectedMarks: { type: Number, required: true },
  maxMarks: { type: Number, required: true },

  reason: { type: String, required: true },
  additionalExplanation: { type: String, required: true },

  // ✅ Evaluator fields
  evaluatorComments: { type: String },
  updatedMarks: { type: Number },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  requestDate: { type: Date, default: Date.now },
  reviewedAt: { type: Date }

});

module.exports = mongoose.model('ReEvaluationRequest', ReEvaluationRequestSchema);
