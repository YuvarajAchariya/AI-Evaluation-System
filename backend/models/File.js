const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v); // Must be exactly 4 digits
      },
      message: 'File ID must be a 4-digit number'
    }
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  fileType: {
    type: String,
    enum: ['answer_sheet', 'evaluation', 'other'],
    default: 'answer_sheet'
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'error'],
    default: 'uploaded'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false
  },
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluator',
    required: false
  },
  description: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Generate 4-digit ID before saving
fileSchema.pre('save', async function(next) {
  if (this.isNew && !this.fileId) {
    let unique = false;
    let attempts = 0;
    
    while (!unique && attempts < 10) {
      // Generate 4-digit number (1000-9999)
      const randomId = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Check if ID already exists
      const existingFile = await mongoose.model('File').findOne({ fileId: randomId });
      
      if (!existingFile) {
        this.fileId = randomId;
        unique = true;
      }
      attempts++;
    }
    
    if (!unique) {
      return next(new Error('Failed to generate unique file ID'));
    }
  }
  next();
});

module.exports = mongoose.model('File', fileSchema);