// Create this file as: models/TeacherAccess.js

const mongoose = require('mongoose');

const TeacherAccessSchema = new mongoose.Schema({
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },
  accessMethod: {
    type: String,
    enum: ['registration', 'gmail'],
    required: true
  },
  registrationNumbers: [{
    type: String,
    trim: true
  }],
  emails: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  passwordMethod: {
    type: String,
    enum: ['manual', 'auto'],
    required: true
  },
  defaultPassword: {
    type: String,
    trim: true
  },
  generatedCredentials: [{
    identifier: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
TeacherAccessSchema.index({ university: 1 });
TeacherAccessSchema.index({ registrationNumbers: 1 });
TeacherAccessSchema.index({ emails: 1 });
TeacherAccessSchema.index({ isActive: 1 });

// Pre-save middleware to update the updatedAt field
TeacherAccessSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TeacherAccess', TeacherAccessSchema);
