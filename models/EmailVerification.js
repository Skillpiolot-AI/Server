const mongoose = require('mongoose');

const EmailVerificationSchema = new mongoose.Schema({
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
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
EmailVerificationSchema.index({ userId: 1 });
EmailVerificationSchema.index({ token: 1 });
EmailVerificationSchema.index({ email: 1 });
EmailVerificationSchema.index({ expiresAt: 1 });

// TTL index to automatically delete expired verifications
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create verification token
EmailVerificationSchema.statics.createVerificationToken = function(userId, email, ipAddress, userAgent) {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  return this.create({
    userId,
    email,
    token,
    ipAddress,
    userAgent
  });
};

// Method to verify token
EmailVerificationSchema.methods.verify = async function() {
  if (this.isVerified) {
    return { success: false, message: 'Email already verified' };
  }

  if (this.expiresAt < new Date()) {
    return { success: false, message: 'Verification link has expired' };
  }

  this.isVerified = true;
  this.verifiedAt = new Date();
  await this.save();

  return { success: true, message: 'Email verified successfully' };
};

module.exports = mongoose.model('EmailVerification', EmailVerificationSchema);
