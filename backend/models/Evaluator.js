const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const evaluatorSchema = new mongoose.Schema({
  // Basic Information
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
  
  // Login Credentials
  evaluatorId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Professional Information
  department: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  specialization: [String],
  
  // Contact Information
  contact: {
    phone: String,
    office: String
  },
  
  // Status and Assignments
  isActive: {
    type: Boolean,
    default: true
  },
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  maxStudents: {
    type: Number,
    default: 20
  },
  
  // Authentication
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
evaluatorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
evaluatorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
evaluatorSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Generate evaluator ID
evaluatorSchema.statics.generateEvaluatorId = function(department) {
  const prefix = department.substring(0, 3).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}EV${random}`;
};

module.exports = mongoose.model('Evaluator', evaluatorSchema);