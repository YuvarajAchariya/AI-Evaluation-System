const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  questionId: {
    type: String,  // Same 4-digit ID as in Question model
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v); // Must be exactly 4 digits
      },
      message: 'Question ID must be a 4-digit number'
    }
  },
  questionText: {
    type: String,
    required: true
  },
  referenceAnswer: {
    type: String,
    required: true
  },
  studentAnswer: {
    type: String,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true
  },
  marksAwarded: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  justification: {
    type: String,
    required: true
  },
  strengths: [String],
  weaknesses: [String],
  missingConcepts: [String],
  suggestions: {
    type: String,
    required: true
  },
  evaluatorId: {
    type: String,
    required: false
  },
  studentId: {
    type: String,
    required: false
  },
  subjectId: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  evaluationDate: {
    type: Date,
    default: Date.now
  },
  apiResponse: {
    type: Object,
    required: false
  }
}, {
  timestamps: true
});

// Create index for faster queries by questionId
evaluationSchema.index({ questionId: 1 });
evaluationSchema.index({ studentId: 1 });
evaluationSchema.index({ subjectId: 1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);