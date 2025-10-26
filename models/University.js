const mongoose = require('mongoose');

const UniversitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    state: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    }
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

// Index for better query performance
UniversitySchema.index({ name: 1 });
UniversitySchema.index({ 'location.state': 1, 'location.city': 1 });
UniversitySchema.index({ registrationNumbers: 1 });
UniversitySchema.index({ emails: 1 });

module.exports = mongoose.model('University', UniversitySchema);