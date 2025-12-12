const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  contact: {
    phone: String,
    address: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  evaluations: [{
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evaluator'
    },
    marks: {
      type: Number,
      min: 0,
      max: 100
    },
    feedback: String,
    evaluationDate: {
      type: Date,
      default: Date.now
    },
    criteria: {
      technical: Number,
      communication: Number,
      problemSolving: Number,
      creativity: Number
    }
  }],
  overallScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Fixed pre-save middleware
studentSchema.pre('save', function(next) {
  if (this.evaluations && this.evaluations.length > 0) {
    const totalMarks = this.evaluations.reduce((sum, evaluation) => {
      return sum + (evaluation.marks || 0);
    }, 0);
    this.overallScore = totalMarks / this.evaluations.length;
  } else {
    this.overallScore = 0;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);