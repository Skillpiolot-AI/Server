// models/VerificationToken.js

const mongoose = require('mongoose');
const crypto = require('crypto');

const VerificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['email_verification', 'location_verification'],
    required: true
  },
  // For location verification
  loginDetails: {
    ipAddress: String,
    userAgent: String,
    location: String,
    timestamp: Date
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
VerificationTokenSchema.index({ token: 1 });
VerificationTokenSchema.index({ userId: 1 });
VerificationTokenSchema.index({ email: 1 });
VerificationTokenSchema.index({ expiresAt: 1 });
VerificationTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // Auto-delete after 24 hours

// Static method to generate verification token
VerificationTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to create email verification token
VerificationTokenSchema.statics.createEmailVerification = async function(userId, email) {
  // Delete any existing unused tokens for this user and email
  await this.deleteMany({ 
    userId, 
    email,
    type: 'email_verification',
    isUsed: false 
  });

  const token = this.generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return await this.create({
    userId,
    email,
    token,
    type: 'email_verification',
    expiresAt
  });
};

// Static method to create location verification token
VerificationTokenSchema.statics.createLocationVerification = async function(
  userId, 
  email, 
  loginDetails
) {
  // Delete any existing unused location tokens for this user
  await this.deleteMany({ 
    userId, 
    type: 'location_verification',
    isUsed: false 
  });

  const token = this.generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return await this.create({
    userId,
    email,
    token,
    type: 'location_verification',
    loginDetails: {
      ...loginDetails,
      timestamp: new Date()
    },
    expiresAt
  });
};

// Method to verify and use token
VerificationTokenSchema.methods.verifyAndUse = async function() {
  // Check if token is already used
  if (this.isUsed) {
    return { 
      success: false, 
      message: 'This verification link has already been used' 
    };
  }

  // Check if token has expired
  if (new Date() > this.expiresAt) {
    return { 
      success: false, 
      message: 'This verification link has expired. Please request a new one' 
    };
  }

  // Mark as used
  this.isUsed = true;
  this.usedAt = new Date();
  await this.save();

  return { 
    success: true, 
    message: 'Token verified successfully' 
  };
};

// Static method to find valid token
VerificationTokenSchema.statics.findValidToken = async function(token, type = null) {
  const query = {
    token,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  };

  if (type) {
    query.type = type;
  }

  return await this.findOne(query);
};

// Static method to clean up expired tokens
VerificationTokenSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  console.log(`Cleaned up ${result.deletedCount} expired verification tokens`);
  return result;
};

module.exports = mongoose.model('VerificationToken', VerificationTokenSchema);