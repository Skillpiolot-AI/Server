const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  jobTitle: {
    type: String,
  },
  companiesJoined: [{
    type: String,
  }],
  experience: {
    type: Number,
    min: 1,
    max: 10,
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'User', 'Mentor', 'UniAdmin', 'UniTeach'], // Added new university roles
  },
  // University-specific fields
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: function() {
      return this.role === 'UniAdmin' || this.role === 'UniTeach';
    }
  },
  registrationNumber: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values but enforces uniqueness for non-null values
  },
  appointments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      required: true
    }
  }],
  newsletter: {
    type: Boolean,
    default: false,
  },
  subscription: {
    type: Boolean,
    default: false,
  },
  // University admin permissions
  universityPermissions: [{
    permission: {
      type: String,
      enum: ['manage_teachers', 'view_reports', 'manage_courses', 'manage_students']
    },
    granted: {
      type: Boolean,
      default: false
    }
  }],
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Login tracking
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  notes: [{
    content: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ universityId: 1 });
UserSchema.index({ registrationNumber: 1 });
UserSchema.index({ isActive: 1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to update the updatedAt field
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to check if user has specific university permission
UserSchema.methods.hasUniversityPermission = function(permission) {
  if (this.role !== 'UniAdmin') return false;
  
  const perm = this.universityPermissions.find(p => p.permission === permission);
  return perm ? perm.granted : false;
};

// Static method to find users by role
UserSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to find university users
UserSchema.statics.findUniversityUsers = function(universityId, role = null) {
  const query = { universityId, isActive: true };
  if (role) query.role = role;
  return this.find(query);
};

module.exports = mongoose.model('User', UserSchema);