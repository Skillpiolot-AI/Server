// models/StudentActivity.js - Student Activity Tracking Model

const mongoose = require('mongoose');

const StudentActivitySchema = new mongoose.Schema({
  // Student identification
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },

  // Session information
  sessionId: {
    type: String,
    required: true
  },

  // Activity details
  activityType: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'profile_access',
      'course_access',
      'assignment_submit',
      'grade_view',
      'library_access',
      'lab_access',
      'portal_navigation',
      'file_download',
      'file_upload',
      'quiz_attempt',
      'exam_attempt',
      'forum_post',
      'message_sent',
      'schedule_view',
      'attendance_mark',
      'fee_payment',
      'complaint_submit',
      'resource_access',
      'video_watch',
      'suspension_notice_view',
      'password_change',
      'profile_update',
      'emergency_contact_update'
    ]
  },

  // Detailed activity information
  details: {
    // For login/logout
    loginMethod: {
      type: String,
      enum: ['username', 'email', 'registration']
    },
    loginSuccess: {
      type: Boolean
    },
    logoutReason: {
      type: String,
      enum: ['manual', 'timeout', 'forced', 'system']
    },

    // For academic activities
    courseId: {
      type: String
    },
    courseName: {
      type: String
    },
    assignmentId: {
      type: String
    },
    assignmentName: {
      type: String
    },
    gradeViewed: {
      type: String
    },

    // For portal navigation
    pageAccessed: {
      type: String
    },
    timeSpent: {
      type: Number // in seconds
    },

    // For file operations
    fileName: {
      type: String
    },
    fileSize: {
      type: Number
    },
    fileType: {
      type: String
    },

    // For quiz/exam attempts
    quizId: {
      type: String
    },
    quizName: {
      type: String
    },
    scoreObtained: {
      type: Number
    },
    maxScore: {
      type: Number
    },
    timeSpentOnQuiz: {
      type: Number // in minutes
    },

    // Additional context
    additionalData: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // Technical information
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  deviceInfo: {
    deviceType: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile', 'unknown']
    },
    browser: {
      type: String
    },
    operatingSystem: {
      type: String
    },
    screenResolution: {
      type: String
    }
  },

  // Location and network information
  location: {
    country: {
      type: String
    },
    region: {
      type: String
    },
    city: {
      type: String
    },
    timezone: {
      type: String
    }
  },

  // Activity status and flags
  status: {
    type: String,
    enum: ['success', 'failed', 'partial', 'blocked'],
    default: 'success'
  },

  // Security flags
  securityFlags: {
    suspiciousActivity: {
      type: Boolean,
      default: false
    },
    multipleLocationAccess: {
      type: Boolean,
      default: false
    },
    unusualTimeAccess: {
      type: Boolean,
      default: false
    },
    repeatedFailedAttempts: {
      type: Boolean,
      default: false
    }
  },

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  sessionStartTime: {
    type: Date
  },
  sessionEndTime: {
    type: Date
  },

  // Academic year/semester context
  academicYear: {
    type: String
  },
  semester: {
    type: String
  },

  // Notes and remarks
  notes: {
    type: String,
    trim: true
  },

  // For tracking consecutive activities
  previousActivityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentActivity'
  },
  nextActivityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentActivity'
  }
});

// Indexes for performance optimization
StudentActivitySchema.index({ studentId: 1, timestamp: -1 });
StudentActivitySchema.index({ userId: 1, timestamp: -1 });
StudentActivitySchema.index({ universityId: 1, timestamp: -1 });
StudentActivitySchema.index({ sessionId: 1 });
StudentActivitySchema.index({ activityType: 1, timestamp: -1 });
StudentActivitySchema.index({ ipAddress: 1 });
StudentActivitySchema.index({ timestamp: -1 });
StudentActivitySchema.index({ 'securityFlags.suspiciousActivity': 1 });
StudentActivitySchema.index({ academicYear: 1, semester: 1 });

// Virtual for activity duration (for session-based activities)
StudentActivitySchema.virtual('duration').get(function() {
  if (this.sessionStartTime && this.sessionEndTime) {
    return Math.floor((this.sessionEndTime - this.sessionStartTime) / 1000); // in seconds
  }
  return null;
});

// Pre-save middleware
StudentActivitySchema.pre('save', function(next) {
  // Auto-detect device type from user agent
  if (this.userAgent && !this.deviceInfo.deviceType) {
    const userAgent = this.userAgent.toLowerCase();
    if (userAgent.includes('mobile')) {
      this.deviceInfo.deviceType = 'mobile';
    } else if (userAgent.includes('tablet')) {
      this.deviceInfo.deviceType = 'tablet';
    } else {
      this.deviceInfo.deviceType = 'desktop';
    }
  }

  // Set academic context if not provided
  if (!this.academicYear) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-indexed

    // Academic year typically starts in July/August
    if (month >= 7) {
      this.academicYear = `${year}-${year + 1}`;
    } else {
      this.academicYear = `${year - 1}-${year}`;
    }
  }

  if (!this.semester && this.academicYear) {
    const month = new Date().getMonth() + 1;
    if (month >= 7 && month <= 12) {
      this.semester = 'Fall';
    } else if (month >= 1 && month <= 5) {
      this.semester = 'Spring';
    } else {
      this.semester = 'Summer';
    }
  }

  next();
});

// Static methods for analytics and reporting
StudentActivitySchema.statics.getStudentLoginHistory = function(studentId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    studentId: studentId,
    activityType: { $in: ['login', 'logout'] },
    timestamp: { $gte: startDate }
  }).sort({ timestamp: -1 });
};

StudentActivitySchema.statics.getUniversityActivityStats = function(universityId, startDate, endDate) {
  const matchConditions = {
    universityId: mongoose.Types.ObjectId(universityId)
  };

  if (startDate && endDate) {
    matchConditions.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          activityType: '$activityType'
        },
        count: { $sum: 1 },
        uniqueStudents: { $addToSet: '$studentId' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        activities: {
          $push: {
            type: '$_id.activityType',
            count: '$count',
            uniqueStudents: { $size: '$uniqueStudents' }
          }
        },
        totalActivities: { $sum: '$count' }
      }
    },
    { $sort: { '_id': -1 } }
  ]);
};

StudentActivitySchema.statics.detectSuspiciousActivity = function(studentId, hours = 24) {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hours);

  return this.aggregate([
    {
      $match: {
        studentId: mongoose.Types.ObjectId(studentId),
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: {
          studentId: '$studentId',
          ipAddress: '$ipAddress'
        },
        uniqueIPs: { $addToSet: '$ipAddress' },
        loginAttempts: {
          $sum: {
            $cond: [
              { $eq: ['$activityType', 'login'] },
              1,
              0
            ]
          }
        },
        failedLogins: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$activityType', 'login'] }, { $eq: ['$status', 'failed'] }] },
              1,
              0
            ]
          }
        },
        activities: { $push: '$$ROOT' }
      }
    },
    {
      $match: {
        $or: [
          { 'uniqueIPs.10': { $exists: true } }, // More than 10 unique IPs
          { loginAttempts: { $gte: 20 } }, // More than 20 login attempts
          { failedLogins: { $gte: 5 } } // More than 5 failed logins
        ]
      }
    }
  ]);
};

StudentActivitySchema.statics.getActiveStudentsCount = function(universityId, minutes = 30) {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

  return this.distinct('studentId', {
    universityId: mongoose.Types.ObjectId(universityId),
    timestamp: { $gte: cutoffTime }
  });
};

StudentActivitySchema.statics.getPopularActivities = function(universityId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        universityId: mongoose.Types.ObjectId(universityId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$activityType',
        count: { $sum: 1 },
        uniqueStudents: { $addToSet: '$studentId' }
      }
    },
    {
      $project: {
        activityType: '$_id',
        count: 1,
        uniqueStudents: { $size: '$uniqueStudents' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
};

// Instance methods
StudentActivitySchema.methods.markAsSuspicious = function(reason) {
  this.securityFlags.suspiciousActivity = true;
  this.notes = (this.notes || '') + `\nMarked as suspicious: ${reason}`;
  return this.save();
};

StudentActivitySchema.methods.linkToPreviousActivity = function(previousActivityId) {
  this.previousActivityId = previousActivityId;
  return this.save();
};

module.exports = mongoose.model('StudentActivity', StudentActivitySchema);
