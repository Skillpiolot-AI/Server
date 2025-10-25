// models/Student.js - Enhanced Student model extending User

const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  // Basic user information (inherited from User model)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Academic information
  department: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    trim: true
  },
  rollNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  batch: {
    type: String,
    trim: true
  },
  
  // University association
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },
  
  // Academic status
  academicStatus: {
    type: String,
    enum: ['active', 'graduated', 'dropped', 'transferred', 'on_leave'],
    default: 'active'
  },
  
  // Suspension details
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
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // Portal access settings
  portalAccess: {
    canAccessLibrary: {
      type: Boolean,
      default: true
    },
    canAccessLabs: {
      type: Boolean,
      default: true
    },
    canAccessCourses: {
      type: Boolean,
      default: true
    },
    canSubmitAssignments: {
      type: Boolean,
      default: true
    },
    canViewGrades: {
      type: Boolean,
      default: true
    },
    restrictedAreas: [{
      area: String,
      reason: String,
      restrictedAt: Date,
      restrictedBy: String
    }]
  },
  
  // Academic performance tracking
  performance: {
    currentGPA: {
      type: Number,
      min: 0,
      max: 10
    },
    totalCredits: {
      type: Number,
      default: 0
    },
    completedCredits: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Contact and emergency information
  contactInfo: {
    alternateEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    parentName: {
      type: String,
      trim: true
    },
    parentPhone: {
      type: String,
      trim: true
    },
    parentEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  
  // Enrollment information
  enrollment: {
    admissionDate: {
      type: Date
    },
    expectedGraduation: {
      type: Date
    },
    enrollmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'distance_learning'],
      default: 'full_time'
    }
  },
  
  // Notes and remarks from administrators
  adminNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedByName: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['academic', 'disciplinary', 'financial', 'personal', 'general'],
      default: 'general'
    },
    isImportant: {
      type: Boolean,
      default: false
    }
  }],
  
  // Creation and modification tracking
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
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Indexes for better performance
StudentSchema.index({ userId: 1 });
StudentSchema.index({ universityId: 1 });
StudentSchema.index({ department: 1 });
StudentSchema.index({ year: 1 });
StudentSchema.index({ rollNumber: 1 });
StudentSchema.index({ academicStatus: 1 });
StudentSchema.index({ isSuspended: 1 });
StudentSchema.index({ 'suspensionDetails.until': 1 });

// Virtual for checking if suspension has expired
StudentSchema.virtual('isSuspensionExpired').get(function() {
  if (!this.isSuspended || !this.suspensionDetails?.until) {
    return false;
  }
  return new Date() > this.suspensionDetails.until;
});

// Virtual for full name from user data
StudentSchema.virtual('fullName', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update timestamps
StudentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-remove expired suspensions
  if (this.isSuspended && this.isSuspensionExpired) {
    this.isSuspended = false;
    this.suspensionDetails = {};
  }
  
  next();
});

// Instance methods
StudentSchema.methods.suspendStudent = function(days, reason, suspendedBy, suspendedByName) {
  const suspensionEndDate = new Date();
  suspensionEndDate.setDate(suspensionEndDate.getDate() + days);
  
  this.isSuspended = true;
  this.suspensionDetails = {
    reason: reason,
    suspendedAt: new Date(),
    suspendedBy: suspendedBy,
    suspendedByName: suspendedByName,
    until: suspensionEndDate,
    isActive: true
  };
  
  return this.save();
};

StudentSchema.methods.unsuspendStudent = function() {
  this.isSuspended = false;
  this.suspensionDetails = {};
  return this.save();
};

StudentSchema.methods.addAdminNote = function(note, addedBy, addedByName, category = 'general', isImportant = false) {
  this.adminNotes.push({
    note: note,
    addedBy: addedBy,
    addedByName: addedByName,
    category: category,
    isImportant: isImportant
  });
  return this.save();
};

StudentSchema.methods.updatePortalAccess = function(accessSettings) {
  this.portalAccess = { ...this.portalAccess, ...accessSettings };
  return this.save();
};

// Static methods
StudentSchema.statics.findByUniversity = function(universityId, filters = {}) {
  const query = { universityId, ...filters };
  return this.find(query).populate('userId', 'name email username registrationNumber lastLogin isActive');
};

StudentSchema.statics.findActiveStudents = function(universityId) {
  return this.find({
    universityId,
    academicStatus: 'active',
    isSuspended: false
  }).populate('userId', 'name email username registrationNumber lastLogin isActive');
};

StudentSchema.statics.findSuspendedStudents = function(universityId) {
  return this.find({
    universityId,
    isSuspended: true
  }).populate('userId', 'name email username registrationNumber lastLogin isActive');
};

StudentSchema.statics.getUniversityStats = function(universityId) {
  return this.aggregate([
    { $match: { universityId: mongoose.Types.ObjectId(universityId) } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        activeStudents: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$academicStatus', 'active'] }, { $eq: ['$isSuspended', false] }] },
              1,
              0
            ]
          }
        },
        suspendedStudents: {
          $sum: {
            $cond: [{ $eq: ['$isSuspended', true] }, 1, 0]
          }
        },
        graduatedStudents: {
          $sum: {
            $cond: [{ $eq: ['$academicStatus', 'graduated'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Student', StudentSchema);