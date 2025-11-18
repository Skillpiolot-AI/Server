const mongoose = require('mongoose');

const LoginVerificationSchema = new mongoose.Schema({
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
  location: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  deviceInfo: {
    device: String,
    browser: String,
    os: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  isDenied: {
    type: Boolean,
    default: false
  },
  deniedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'denied', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
LoginVerificationSchema.index({ userId: 1, createdAt: -1 });
LoginVerificationSchema.index({ token: 1 });
LoginVerificationSchema.index({ ipAddress: 1 });
LoginVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create login verification
LoginVerificationSchema.statics.createLoginVerification = async function(
  userId,
  email,
  ipAddress,
  userAgent,
  location,
  deviceInfo
) {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  return this.create({
    userId,
    email,
    token,
    ipAddress,
    userAgent,
    location,
    deviceInfo
  });
};

// Method to verify login
LoginVerificationSchema.methods.verifyLogin = async function() {
  if (this.isVerified) {
    return { success: false, message: 'Login already verified' };
  }

  if (this.isDenied) {
    return { success: false, message: 'Login was denied' };
  }

  if (this.expiresAt < new Date()) {
    this.status = 'expired';
    await this.save();
    return { success: false, message: 'Verification link has expired' };
  }

  this.isVerified = true;
  this.verifiedAt = new Date();
  this.status = 'verified';
  await this.save();

  return { success: true, message: 'Login verified successfully' };
};

// Method to deny login
LoginVerificationSchema.methods.denyLogin = async function() {
  if (this.isVerified) {
    return { success: false, message: 'Login was already verified' };
  }

  this.isDenied = true;
  this.deniedAt = new Date();
  this.status = 'denied';
  await this.save();

  return { success: true, message: 'Login denied successfully' };
};

module.exports = mongoose.model('LoginVerification', LoginVerificationSchema);
