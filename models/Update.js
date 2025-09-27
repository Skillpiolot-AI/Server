const mongoose = require('mongoose');

const UpdateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  allowedRoles: [{
    type: String,
    enum: ['Admin', 'User', 'Mentor'],
    required: true
  }],
  redirectUrl: {
    type: String,
    required: true,
    trim: true
  },
  issueDescription: {
    type: String,
    default: '',
    maxlength: 500
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  updateType: {
    type: String,
    enum: ['Feature', 'Bug Fix', 'Enhancement', 'Security', 'UI/UX'],
    required: true
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

// Update the updatedAt field on save
UpdateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
UpdateSchema.index({ createdAt: -1 });
UpdateSchema.index({ allowedRoles: 1 });
UpdateSchema.index({ isActive: 1 });

module.exports = mongoose.model('Update', UpdateSchema);