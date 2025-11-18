const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['password_reset', 'email_verification', 'two_factor'],
    default: 'password_reset'
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Document will be automatically deleted after 10 minutes (600 seconds)
  }
});

// Index for faster queries
OTPSchema.index({ email: 1, createdAt: -1 });
OTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

// ✅ FIXED: Method to verify OTP - prevents parallel save error
OTPSchema.methods.verifyOTP = async function(inputOTP) {
  // Check if OTP is already used
  if (this.isUsed) {
    return { success: false, message: 'OTP has already been used' };
  }

  // Check if OTP is blocked
  if (this.isBlocked) {
    return { success: false, message: 'OTP has been blocked due to too many attempts' };
  }

  // Check if max attempts exceeded
  if (this.attempts >= this.maxAttempts) {
    this.isBlocked = true;
    await this.save();
    return { success: false, message: 'Maximum attempts exceeded. Please request a new OTP' };
  }

  // ✅ Verify OTP FIRST, then save ONCE
  if (this.otp === inputOTP) {
    // Mark as used and save only once
    this.isUsed = true;
    this.attempts += 1;
    await this.save();
    return { success: true, message: 'OTP verified successfully' };
  } else {
    // Increment attempts for failed verification
    this.attempts += 1;
    await this.save();
    return {
      success: false,
      message: `Invalid OTP. ${this.maxAttempts - this.attempts} attempts remaining`
    };
  }
};

// Static method to generate OTP
OTPSchema.statics.generateOTP = function(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Static method to create new OTP
OTPSchema.statics.createOTP = async function(email, purpose = 'password_reset', ipAddress, userAgent) {
  // Delete any existing unused OTPs for this email and purpose
  await this.deleteMany({
    email,
    purpose,
    isUsed: false
  });

  // Generate new OTP
  const otp = this.generateOTP();

  // Create new OTP document
  const otpDoc = await this.create({
    email,
    otp,
    purpose,
    ipAddress,
    userAgent
  });

  return otpDoc;
};

// Static method to find valid OTP
OTPSchema.statics.findValidOTP = async function(email, purpose = 'password_reset') {
  return await this.findOne({
    email,
    purpose,
    isUsed: false,
    isBlocked: false
  }).sort({ createdAt: -1 });
};

// Static method to clean up expired OTPs (backup cleanup)
OTPSchema.statics.cleanupExpired = async function() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  return await this.deleteMany({
    createdAt: { $lt: tenMinutesAgo }
  });
};

module.exports = mongoose.model('OTP', OTPSchema);
