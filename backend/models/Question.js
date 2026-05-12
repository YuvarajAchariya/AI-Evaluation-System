const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: function(v) {
        // Allow either 4-digit OR 4-digit + dash + single digit (e.g., 1234-1)
        return /^\d{4}$/.test(v) || /^\d{4}-\d$/.test(v);
      },
      message: 'Question ID must be: 4-digit number (e.g., 1234) OR 4-digit-dash-single-digit (e.g., 1234-1)'
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
  baseQuestionId: {
    type: String,
    required: false
  },
  questionNumber: {
    type: Number,
    min: 1,
    max: 5,
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