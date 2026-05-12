const mongoose = require('mongoose');

const extractedAnswerSchema = new mongoose.Schema({
  // File information
  fileId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: false
  },
  
  // Question information
  questionId: {
    type: String,
    required: true
  },
  questionNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  answerText: {
    type: String,
    required: true
  },
  
  // Universal grouping
  universalId: {
    type: String,
    required: true
  },
  
  // Metadata
  uploadDate: {
    type: Date,
    default: Date.now
  },
  extractionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['extracted', 'processing', 'evaluated', 'archived'],
    default: 'extracted'
  },
  
  // Optional fields
  studentId: {
    type: String,
    required: false
  },
  subject: {
    type: String,
    required: false
  },
  evaluatorId: {
    type: String,
    required: false
  },
  
  // Evaluation results (to be filled later)
  evaluation: {
    marks: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      default: ''
    },
    similarityScore: {
      type: Number,
      default: 0
    },
    evaluatedAt: {
      type: Date,
      required: false
    }
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
extractedAnswerSchema.index({ fileId: 1, questionId: 1 }, { unique: true });

// Index for faster queries
extractedAnswerSchema.index({ universalId: 1 });
extractedAnswerSchema.index({ status: 1 });
extractedAnswerSchema.index({ uploadDate: -1 });

module.exports = mongoose.model('ExtractedAnswer', extractedAnswerSchema);