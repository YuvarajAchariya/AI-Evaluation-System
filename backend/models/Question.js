const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    unique: true,
    // required: true, // TEMPORARILY COMMENTED OUT FOR DEBUGGING
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
  maxMarks: {
    type: Number,
    required: true,
    default: 10
  },
  subjectId: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  questionType: {
    type: String,
    enum: ['descriptive', 'programming', 'theory', 'practical'],
    default: 'descriptive'
  },
  keywords: [String],
  evaluatorId: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);