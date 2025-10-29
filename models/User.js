

// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   imageUrl: {
//     type: String,
//     default: '',
//   },
//   name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   phoneNumber: {
//     type: String,
//   },
//   jobTitle: {
//     type: String,
//   },
//     googleId: {
//     type: String,
//     sparse: true, // Allows multiple null values but enforces uniqueness for non-null
//     unique: true
//   },
//   authProvider: {
//     type: String,
//     enum: ['local', 'google'],
//     default: 'local'
//   },
//   companiesJoined: [{
//     type: String,
//   }],
//   experience: {
//     type: Number,
//     min: 1,
//     max: 10,
//   },
//   role: {
//     type: String,
//     required: true,
//     enum: ['Admin', 'User', 'Mentor', 'UniAdmin', 'UniTeach', 'Student'], // Added Student role
//   },
  
//   // University-specific fields
//   universityId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'University',
//     required: function() {
//       return ['UniAdmin', 'UniTeach', 'Student'].includes(this.role);
//     }
//   },
//   registrationNumber: {
//     type: String,
//     trim: true,
//     sparse: true // Allows multiple null values but enforces uniqueness for non-null values
//   },
  
//   // Student-specific fields
//   studentProfile: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Student',
//     required: function() {
//       return this.role === 'Student';
//     }
//   },
  
//   appointments: [{
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     date: {
//       type: Date,
//       required: true
//     }
//   }],
//   newsletter: {
//     type: Boolean,
//     default: false,
//   },
//   subscription: {
//     type: Boolean,
//     default: false,
//   },
  
//   // University admin permissions
//   universityPermissions: [{
//     permission: {
//       type: String,
//       enum: ['manage_teachers', 'manage_students', 'view_reports', 'manage_courses', 'manage_library', 'manage_fees']
//     },
//     granted: {
//       type: Boolean,
//       default: false
//     }
//   }],
  
//   // Account status
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   isVerified: {
//     type: Boolean,
//     default: false
//   },
  
//   // Enhanced suspension system
//   isSuspended: {
//     type: Boolean,
//     default: false
//   },
//   suspensionDetails: {
//     reason: {
//       type: String,
//       trim: true
//     },
//     suspendedAt: {
//       type: Date
//     },
//     suspendedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     suspendedByName: {
//       type: String,
//       trim: true
//     },
//     until: {
//       type: Date
//     },
//     autoUnsuspend: {
//       type: Boolean,
//       default: true
//     },
//     severity: {
//       type: String,
//       enum: ['minor', 'moderate', 'severe'],
//       default: 'minor'
//     }
//   },
  
//   // Login tracking
//   lastLogin: {
//     type: Date
//   },
//   currentSession: {
//     sessionId: String,
//     startTime: Date,
//     lastActivity: Date,
//     ipAddress: String,
//     userAgent: String
//   },
//   loginAttempts: {
//     type: Number,
//     default: 0
//   },
//   lockUntil: {
//     type: Date
//   },
//   loginHistory: [{
//     timestamp: Date,
//     ipAddress: String,
//     userAgent: String,
//     success: Boolean,
//     location: {
//       country: String,
//       region: String,
//       city: String
//     }
//   }],
  
//   // Security settings
//   securitySettings: {
//     twoFactorEnabled: {
//       type: Boolean,
//       default: false
//     },
//     emailNotifications: {
//       type: Boolean,
//       default: true
//     },
//     loginAlerts: {
//       type: Boolean,
//       default: true
//     },
//     allowMultipleSessions: {
//       type: Boolean,
//       default: true
//     }
//   },
  
//   // Password management
//   passwordHistory: [{
//     hashedPassword: String,
//     changedAt: Date
//   }],
//   passwordLastChanged: {
//     type: Date,
//     default: Date.now
//   },
//   mustChangePassword: {
//     type: Boolean,
//     default: false
//   },
//   temporaryPassword: {
//     type: Boolean,
//     default: false
//   },
  
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
//   notes: [{
//     content: String,
//     createdAt: { type: Date, default: Date.now },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     category: {
//       type: String,
//       enum: ['admin', 'security', 'academic', 'disciplinary'],
//       default: 'admin'
//     }
//   }]
// });

// // Indexes for better performance
// UserSchema.index({ email: 1 });
// UserSchema.index({ username: 1 });
// UserSchema.index({ role: 1 });
// UserSchema.index({ universityId: 1 });
// UserSchema.index({ registrationNumber: 1 });
// UserSchema.index({ isActive: 1 });
// UserSchema.index({ isSuspended: 1 });
// UserSchema.index({ 'suspensionDetails.until': 1 });
// UserSchema.index({ lastLogin: -1 });
// UserSchema.index({ 'currentSession.sessionId': 1 });

// // Virtual for account lock status
// UserSchema.virtual('isLocked').get(function() {
//   return !!(this.lockUntil && this.lockUntil > Date.now());
// });

// // Virtual for suspension status
// UserSchema.virtual('isSuspensionActive').get(function() {
//   if (!this.isSuspended) return false;
//   if (this.suspensionDetails && this.suspensionDetails.until) {
//     return new Date() <= this.suspensionDetails.until;
//   }
//   return true; // Permanent suspension if no end date
// });

// // Virtual for checking if user can login
// UserSchema.virtual('canLogin').get(function() {
//   return this.isActive && !this.isLocked && !this.isSuspensionActive;
// });

// // Pre-save middleware to update the updatedAt field and handle suspensions
// UserSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
  
//   // Auto-unsuspend if suspension has expired and auto-unsuspend is enabled
//   if (this.isSuspended && 
//       this.suspensionDetails && 
//       this.suspensionDetails.until && 
//       this.suspensionDetails.autoUnsuspend && 
//       new Date() > this.suspensionDetails.until) {
//     this.isSuspended = false;
//     this.suspensionDetails = {};
//   }
  
//   next();
// });

// // Method to increment login attempts
// UserSchema.methods.incLoginAttempts = function() {
//   // If we have a previous lock that has expired, restart at 1
//   if (this.lockUntil && this.lockUntil < Date.now()) {
//     return this.updateOne({
//       $unset: { lockUntil: 1 },
//       $set: { loginAttempts: 1 }
//     });
//   }
  
//   const updates = { $inc: { loginAttempts: 1 } };
  
//   // Lock account after 5 attempts for 2 hours
//   if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
//     updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) }; // 2 hours
//   }
  
//   return this.updateOne(updates);
// };

// // Method to reset login attempts
// UserSchema.methods.resetLoginAttempts = function() {
//   return this.updateOne({
//     $unset: { loginAttempts: 1, lockUntil: 1 }
//   });
// };

// // Enhanced suspension methods
// UserSchema.methods.suspendUser = function(days, reason, suspendedBy, suspendedByName, severity = 'minor') {
//   const suspensionEndDate = new Date();
//   suspensionEndDate.setDate(suspensionEndDate.getDate() + days);
  
//   this.isSuspended = true;
//   this.suspensionDetails = {
//     reason: reason,
//     suspendedAt: new Date(),
//     suspendedBy: suspendedBy,
//     suspendedByName: suspendedByName,
//     until: suspensionEndDate,
//     autoUnsuspend: true,
//     severity: severity
//   };
  
//   return this.save();
// };

// UserSchema.methods.unsuspendUser = function() {
//   this.isSuspended = false;
//   this.suspensionDetails = {};
//   return this.save();
// };

// // Session management methods
// UserSchema.methods.startSession = function(sessionId, ipAddress, userAgent) {
//   this.currentSession = {
//     sessionId: sessionId,
//     startTime: new Date(),
//     lastActivity: new Date(),
//     ipAddress: ipAddress,
//     userAgent: userAgent
//   };
  
//   this.lastLogin = new Date();
  
//   // Add to login history
//   this.loginHistory.push({
//     timestamp: new Date(),
//     ipAddress: ipAddress,
//     userAgent: userAgent,
//     success: true
//   });
  
//   // Keep only last 20 login records
//   if (this.loginHistory.length > 20) {
//     this.loginHistory = this.loginHistory.slice(-20);
//   }
  
//   return this.save();
// };

// UserSchema.methods.endSession = function() {
//   this.currentSession = {};
//   return this.save();
// };

// UserSchema.methods.updateActivity = function() {
//   if (this.currentSession && this.currentSession.sessionId) {
//     this.currentSession.lastActivity = new Date();
//     return this.save();
//   }
// };

// // Password management methods
// UserSchema.methods.changePassword = function(newHashedPassword) {
//   // Store old password in history
//   if (this.password) {
//     this.passwordHistory.push({
//       hashedPassword: this.password,
//       changedAt: new Date()
//     });
    
//     // Keep only last 5 passwords
//     if (this.passwordHistory.length > 5) {
//       this.passwordHistory = this.passwordHistory.slice(-5);
//     }
//   }
  
//   this.password = newHashedPassword;
//   this.passwordLastChanged = new Date();
//   this.mustChangePassword = false;
//   this.temporaryPassword = false;
  
//   return this.save();
// };

// UserSchema.methods.setTemporaryPassword = function(tempHashedPassword) {
//   this.password = tempHashedPassword;
//   this.temporaryPassword = true;
//   this.mustChangePassword = true;
//   return this.save();
// };

// // Method to check if user has specific university permission
// UserSchema.methods.hasUniversityPermission = function(permission) {
//   if (!['UniAdmin', 'Admin'].includes(this.role)) return false;
//   if (this.role === 'Admin') return true; // Admin has all permissions
  
//   const perm = this.universityPermissions.find(p => p.permission === permission);
//   return perm ? perm.granted : false;
// };

// // Method to grant university permission
// UserSchema.methods.grantUniversityPermission = function(permission) {
//   const existingPerm = this.universityPermissions.find(p => p.permission === permission);
//   if (existingPerm) {
//     existingPerm.granted = true;
//   } else {
//     this.universityPermissions.push({ permission, granted: true });
//   }
//   return this.save();
// };

// // Method to revoke university permission
// UserSchema.methods.revokeUniversityPermission = function(permission) {
//   const existingPerm = this.universityPermissions.find(p => p.permission === permission);
//   if (existingPerm) {
//     existingPerm.granted = false;
//   }
//   return this.save();
// };

// // Add note to user
// UserSchema.methods.addNote = function(content, createdBy, category = 'admin') {
//   this.notes.push({
//     content: content,
//     createdBy: createdBy,
//     category: category,
//     createdAt: new Date()
//   });
//   return this.save();
// };

// // Static method to find users by role
// UserSchema.statics.findByRole = function(role) {
//   return this.find({ role, isActive: true });
// };

// // Static method to find university users
// UserSchema.statics.findUniversityUsers = function(universityId, role = null) {
//   const query = { universityId, isActive: true };
//   if (role) query.role = role;
//   return this.find(query);
// };

// // Static method to find students by university
// UserSchema.statics.findStudentsByUniversity = function(universityId) {
//   return this.find({ 
//     universityId, 
//     role: 'Student', 
//     isActive: true 
//   }).populate('studentProfile');
// };

// // Static method to get active sessions count
// UserSchema.statics.getActiveSessionsCount = function(universityId = null) {
//   const cutoffTime = new Date();
//   cutoffTime.setMinutes(cutoffTime.getMinutes() - 30); // Consider active if activity in last 30 minutes
  
//   const query = {
//     'currentSession.lastActivity': { $gte: cutoffTime },
//     'currentSession.sessionId': { $exists: true }
//   };
  
//   if (universityId) {
//     query.universityId = universityId;
//   }
  
//   return this.countDocuments(query);
// };

// // Static method to find suspended users
// UserSchema.statics.findSuspendedUsers = function(universityId = null) {
//   const query = { isSuspended: true };
//   if (universityId) {
//     query.universityId = universityId;
//   }
//   return this.find(query);
// };

// // Static method to clean expired suspensions
// UserSchema.statics.cleanExpiredSuspensions = function() {
//   return this.updateMany(
//     {
//       isSuspended: true,
//       'suspensionDetails.until': { $lt: new Date() },
//       'suspensionDetails.autoUnsuspend': true
//     },
//     {
//       $set: { isSuspended: false },
//       $unset: { suspensionDetails: 1 }
//     }
//   );
// };

// // Static method to get university user statistics
// UserSchema.statics.getUniversityUserStats = function(universityId) {
//   return this.aggregate([
//     { $match: { universityId: mongoose.Types.ObjectId(universityId) } },
//     {
//       $group: {
//         _id: '$role',
//         total: { $sum: 1 },
//         active: {
//           $sum: {
//             $cond: [
//               { $and: [{ $eq: ['$isActive', true] }, { $ne: ['$isSuspended', true] }] },
//               1,
//               0
//             ]
//           }
//         },
//         suspended: {
//           $sum: {
//             $cond: [{ $eq: ['$isSuspended', true] }, 1, 0]
//           }
//         },
//         inactive: {
//           $sum: {
//             $cond: [{ $eq: ['$isActive', false] }, 1, 0]
//           }
//         }
//       }
//     }
//   ]);
// };

// module.exports = mongoose.model('User', UserSchema);


// models/User.js - Enhanced with Google OAuth Support

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
    required: true, // Required but can be random for Google users
  },
  phoneNumber: {
    type: String,
  },
  jobTitle: {
    type: String,
  },
  // ============ GOOGLE OAUTH FIELDS ============
  googleId: {
    type: String,
    sparse: true, // Allows multiple null values but enforces uniqueness for non-null
    unique: true,
    index: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  // ============================================
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
    enum: ['Admin', 'User', 'Mentor', 'UniAdmin', 'UniTeach', 'Student'],
  },
  
  // University-specific fields
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: function() {
      return ['UniAdmin', 'UniTeach', 'Student'].includes(this.role);
    }
  },
  registrationNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  
  // Student-specific fields
  studentProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: function() {
      return this.role === 'Student';
    }
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
      enum: ['manage_teachers', 'manage_students', 'view_reports', 'manage_courses', 'manage_library', 'manage_fees']
    },
    granted: {
      type: Boolean,
      default: false
    }
  }],
  
  // Account status
  isActive: {
    type: Boolean,
    default: true // Will be set to false for unverified users
  },
  isVerified: {
    type: Boolean,
    default: false // Email verification required for all users
  },
  
  // Enhanced suspension system
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionDetails: {
    reason: {
      type: String,
      trim: true
    },
    suspendedAt: {
      type: Date
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    suspendedByName: {
      type: String,
      trim: true
    },
    until: {
      type: Date
    },
    autoUnsuspend: {
      type: Boolean,
      default: true
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe'],
      default: 'minor'
    }
  },
  
  // Login tracking
  lastLogin: {
    type: Date
  },
  currentSession: {
    sessionId: String,
    startTime: Date,
    lastActivity: Date,
    ipAddress: String,
    userAgent: String
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    userAgent: String,
    success: Boolean,
    location: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number
    }
  }],
  
  // Security settings
  securitySettings: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    loginAlerts: {
      type: Boolean,
      default: true
    },
    allowMultipleSessions: {
      type: Boolean,
      default: true
    }
  },
  
  // Password management
  passwordHistory: [{
    hashedPassword: String,
    changedAt: Date
  }],
  passwordLastChanged: {
    type: Date,
    default: Date.now
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  temporaryPassword: {
    type: Boolean,
    default: false
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
    createdAt: { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    category: {
      type: String,
      enum: ['admin', 'security', 'academic', 'disciplinary'],
      default: 'admin'
    }
  }]
});

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ googleId: 1 }); // ✅ Index for Google OAuth
UserSchema.index({ role: 1 });
UserSchema.index({ universityId: 1 });
UserSchema.index({ registrationNumber: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ isVerified: 1 }); // ✅ Index for verification status
UserSchema.index({ isSuspended: 1 });
UserSchema.index({ 'suspensionDetails.until': 1 });
UserSchema.index({ lastLogin: -1 });
UserSchema.index({ 'currentSession.sessionId': 1 });
UserSchema.index({ authProvider: 1 }); // ✅ Index for auth provider

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for suspension status
UserSchema.virtual('isSuspensionActive').get(function() {
  if (!this.isSuspended) return false;
  if (this.suspensionDetails && this.suspensionDetails.until) {
    return new Date() <= this.suspensionDetails.until;
  }
  return true;
});

// Virtual for checking if user can login
UserSchema.virtual('canLogin').get(function() {
  return this.isActive && 
         this.isVerified && 
         !this.isLocked && 
         !this.isSuspensionActive;
});

// ✅ Virtual to check if it's a Google account
UserSchema.virtual('isGoogleAccount').get(function() {
  return this.authProvider === 'google' && !!this.googleId;
});

// Pre-save middleware
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-unsuspend if suspension has expired
  if (this.isSuspended && 
      this.suspensionDetails && 
      this.suspensionDetails.until && 
      this.suspensionDetails.autoUnsuspend && 
      new Date() > this.suspensionDetails.until) {
    this.isSuspended = false;
    this.suspensionDetails = {};
  }
  
  next();
});

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Enhanced suspension methods
UserSchema.methods.suspendUser = function(days, reason, suspendedBy, suspendedByName, severity = 'minor') {
  const suspensionEndDate = new Date();
  suspensionEndDate.setDate(suspensionEndDate.getDate() + days);
  
  this.isSuspended = true;
  this.suspensionDetails = {
    reason: reason,
    suspendedAt: new Date(),
    suspendedBy: suspendedBy,
    suspendedByName: suspendedByName,
    until: suspensionEndDate,
    autoUnsuspend: true,
    severity: severity
  };
  
  return this.save();
};

UserSchema.methods.unsuspendUser = function() {
  this.isSuspended = false;
  this.suspensionDetails = {};
  return this.save();
};

// Session management methods
UserSchema.methods.startSession = function(sessionId, ipAddress, userAgent) {
  this.currentSession = {
    sessionId: sessionId,
    startTime: new Date(),
    lastActivity: new Date(),
    ipAddress: ipAddress,
    userAgent: userAgent
  };
  
  this.lastLogin = new Date();
  
  return this.save();
};

UserSchema.methods.endSession = function() {
  this.currentSession = {};
  return this.save();
};

UserSchema.methods.updateActivity = function() {
  if (this.currentSession && this.currentSession.sessionId) {
    this.currentSession.lastActivity = new Date();
    return this.save();
  }
};

// Password management methods
UserSchema.methods.changePassword = function(newHashedPassword) {
  // Store old password in history
  if (this.password) {
    this.passwordHistory.push({
      hashedPassword: this.password,
      changedAt: new Date()
    });
    
    // Keep only last 5 passwords
    if (this.passwordHistory.length > 5) {
      this.passwordHistory = this.passwordHistory.slice(-5);
    }
  }
  
  this.password = newHashedPassword;
  this.passwordLastChanged = new Date();
  this.mustChangePassword = false;
  this.temporaryPassword = false;
  
  return this.save();
};

UserSchema.methods.setTemporaryPassword = function(tempHashedPassword) {
  this.password = tempHashedPassword;
  this.temporaryPassword = true;
  this.mustChangePassword = true;
  return this.save();
};

// Method to check if user has specific university permission
UserSchema.methods.hasUniversityPermission = function(permission) {
  if (!['UniAdmin', 'Admin'].includes(this.role)) return false;
  if (this.role === 'Admin') return true;
  
  const perm = this.universityPermissions.find(p => p.permission === permission);
  return perm ? perm.granted : false;
};

// Method to grant university permission
UserSchema.methods.grantUniversityPermission = function(permission) {
  const existingPerm = this.universityPermissions.find(p => p.permission === permission);
  if (existingPerm) {
    existingPerm.granted = true;
  } else {
    this.universityPermissions.push({ permission, granted: true });
  }
  return this.save();
};

// Method to revoke university permission
UserSchema.methods.revokeUniversityPermission = function(permission) {
  const existingPerm = this.universityPermissions.find(p => p.permission === permission);
  if (existingPerm) {
    existingPerm.granted = false;
  }
  return this.save();
};

// Add note to user
UserSchema.methods.addNote = function(content, createdBy, category = 'admin') {
  this.notes.push({
    content: content,
    createdBy: createdBy,
    category: category,
    createdAt: new Date()
  });
  return this.save();
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

// Static method to find students by university
UserSchema.statics.findStudentsByUniversity = function(universityId) {
  return this.find({ 
    universityId, 
    role: 'Student', 
    isActive: true 
  }).populate('studentProfile');
};

// ✅ Static method to find users by auth provider
UserSchema.statics.findByAuthProvider = function(provider) {
  return this.find({ authProvider: provider });
};

// ✅ Static method to find Google users
UserSchema.statics.findGoogleUsers = function() {
  return this.find({ 
    authProvider: 'google',
    googleId: { $exists: true, $ne: null }
  });
};

// Static method to get active sessions count
UserSchema.statics.getActiveSessionsCount = function(universityId = null) {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - 30);
  
  const query = {
    'currentSession.lastActivity': { $gte: cutoffTime },
    'currentSession.sessionId': { $exists: true }
  };
  
  if (universityId) {
    query.universityId = universityId;
  }
  
  return this.countDocuments(query);
};

// Static method to find suspended users
UserSchema.statics.findSuspendedUsers = function(universityId = null) {
  const query = { isSuspended: true };
  if (universityId) {
    query.universityId = universityId;
  }
  return this.find(query);
};

// Static method to clean expired suspensions
UserSchema.statics.cleanExpiredSuspensions = function() {
  return this.updateMany(
    {
      isSuspended: true,
      'suspensionDetails.until': { $lt: new Date() },
      'suspensionDetails.autoUnsuspend': true
    },
    {
      $set: { isSuspended: false },
      $unset: { suspensionDetails: 1 }
    }
  );
};

// ✅ Static method to find unverified users
UserSchema.statics.findUnverifiedUsers = function(daysOld = null) {
  const query = { 
    isVerified: false,
    isActive: false
  };
  
  if (daysOld) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    query.createdAt = { $lte: cutoffDate };
  }
  
  return this.find(query);
};

// Static method to get university user statistics
UserSchema.statics.getUniversityUserStats = function(universityId) {
  return this.aggregate([
    { $match: { universityId: mongoose.Types.ObjectId(universityId) } },
    {
      $group: {
        _id: '$role',
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$isActive', true] }, { $ne: ['$isSuspended', true] }] },
              1,
              0
            ]
          }
        },
        suspended: {
          $sum: {
            $cond: [{ $eq: ['$isSuspended', true] }, 1, 0]
          }
        },
        inactive: {
          $sum: {
            $cond: [{ $eq: ['$isActive', false] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// ✅ Static method to get authentication statistics
UserSchema.statics.getAuthStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$authProvider',
        total: { $sum: 1 },
        verified: {
          $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
        },
        unverified: {
          $sum: { $cond: [{ $eq: ['$isVerified', false] }, 1, 0] }
        },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('User', UserSchema);