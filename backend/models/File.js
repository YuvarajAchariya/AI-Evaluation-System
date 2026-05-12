const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v);
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
  description: {
    type: String,
    required: false
  },
  // Answers with dynamic question IDs
  answers: [{
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
    extractedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalAnswers: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['uploaded', 'processed', 'error'],
    default: 'uploaded'
  },
  // Universal base ID for all questions
  universalQuestionId: {
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
      const randomId = Math.floor(1000 + Math.random() * 9000).toString();
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
  
  // Generate universal question ID based on file ID
  if (this.isNew && !this.universalQuestionId) {
    this.universalQuestionId = `UNIV-${this.fileId}`;
  }
  
  next();
});

module.exports = mongoose.model('File', fileSchema);