// middleware/portalAccess.js - Portal Access Control and Session Management

const Student = require('../models/Student');
const StudentActivity = require('../models/StudentActivity');
const { v4: uuidv4 } = require('uuid');

// Helper function to log student portal activity
const logPortalActivity = async (student, userId, activityType, details, req) => {
  try {
    await StudentActivity.create({
      studentId: student._id,
      userId: userId,
      universityId: student.universityId,
      sessionId: req.sessionID || uuidv4(),
      activityType,
      details: {
        ...details,
        pageAccessed: req.path,
        method: req.method
      },
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    });
  } catch (error) {
    console.error('Error logging portal activity:', error);
  }
};

// Middleware to check if student has access to specific portal features
const checkPortalAccess = (requiredAccess) => {
  return async (req, res, next) => {
    try {
      // Only apply to students
      if (req.user.role !== 'Student') {
        return next();
      }

      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      // Check if student is suspended
      if (student.isSuspended) {
        await logPortalActivity(student, req.user._id, 'access_denied', {
          reason: 'student_suspended',
          requiredAccess: requiredAccess,
          suspensionDetails: student.suspensionDetails
        }, req);

        const suspensionMessage = student.suspensionDetails?.until ?
          `Access denied. You are suspended until ${new Date(student.suspensionDetails.until).toLocaleDateString()}. Reason: ${student.suspensionDetails.reason || 'No reason provided'}` :
          `Access denied. Your account is suspended. Reason: ${student.suspensionDetails?.reason || 'No reason provided'}`;

        return res.status(403).json({
          success: false,
          message: suspensionMessage,
          isSuspended: true,
          suspensionDetails: student.suspensionDetails
        });
      }

      // Check if student has required portal access
      if (requiredAccess && !student.portalAccess[requiredAccess]) {
        await logPortalActivity(student, req.user._id, 'access_denied', {
          reason: 'insufficient_permissions',
          requiredAccess: requiredAccess,
          currentAccess: student.portalAccess
        }, req);

        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to access ${requiredAccess.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          requiredAccess: requiredAccess
        });
      }

      // Check if accessing restricted areas
      const restrictedArea = student.portalAccess.restrictedAreas?.find(
        area => req.path.includes(area.area)
      );

      if (restrictedArea) {
        await logPortalActivity(student, req.user._id, 'access_denied', {
          reason: 'restricted_area',
          restrictedArea: restrictedArea.area,
          restrictionReason: restrictedArea.reason
        }, req);

        return res.status(403).json({
          success: false,
          message: `Access to this area is restricted. Reason: ${restrictedArea.reason}`,
          restrictedArea: restrictedArea
        });
      }

      // Log successful access
      await logPortalActivity(student, req.user._id, 'portal_navigation', {
        accessGranted: true,
        requiredAccess: requiredAccess
      }, req);

      // Attach student info to request for use in routes
      req.studentProfile = student;
      next();

    } catch (error) {
      console.error('Error checking portal access:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking portal access'
      });
    }
  };
};

// Middleware to track student page visits and time spent
const trackStudentActivity = async (req, res, next) => {
  if (req.user && req.user.role === 'Student') {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        // Record the page visit
        req.studentVisitStart = Date.now();

        // Log page access
        await logPortalActivity(student, req.user._id, 'portal_navigation', {
          pageAccessed: req.path,
          method: req.method,
          accessTime: new Date()
        }, req);

        // Attach middleware to track time spent when response finishes
        res.on('finish', async () => {
          try {
            const timeSpent = Math.round((Date.now() - req.studentVisitStart) / 1000); // in seconds

            await logPortalActivity(student, req.user._id, 'portal_navigation', {
              pageLeft: req.path,
              timeSpent: timeSpent,
              exitTime: new Date()
            }, req);
          } catch (error) {
            console.error('Error tracking visit duration:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error setting up activity tracking:', error);
    }
  }
  next();
};

// Middleware to check for unusual activity patterns
const detectSuspiciousActivity = async (req, res, next) => {
  if (req.user && req.user.role === 'Student') {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        // Check for suspicious activity in the last 24 hours
        const suspiciousActivity = await StudentActivity.detectSuspiciousActivity(student._id, 24);

        if (suspiciousActivity.length > 0) {
          // Log suspicious activity detection
          await logPortalActivity(student, req.user._id, 'suspicious_activity_detected', {
            suspiciousPatterns: suspiciousActivity,
            detectedAt: new Date()
          }, req);

          // For now, just log - could implement blocking or alerts here
          console.warn(`Suspicious activity detected for student ${student._id}:`, suspiciousActivity);
        }
      }
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
    }
  }
  next();
};

// Middleware to enforce academic year/semester context
const enforceAcademicContext = (req, res, next) => {
  // Add current academic context to all requests
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Academic year typically starts in July/August
  let academicYear, semester;
  if (month >= 7) {
    academicYear = `${year}-${year + 1}`;
  } else {
    academicYear = `${year - 1}-${year}`;
  }

  if (month >= 7 && month <= 12) {
    semester = 'Fall';
  } else if (month >= 1 && month <= 5) {
    semester = 'Spring';
  } else {
    semester = 'Summer';
  }

  req.academicContext = {
    academicYear,
    semester,
    currentDate: now
  };

  next();
};

// Middleware to check session validity and manage concurrent sessions
const manageStudentSessions = async (req, res, next) => {
  if (req.user && req.user.role === 'Student') {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        const currentTime = new Date();
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds

        // Check if current session is still valid
        if (req.user.currentSession && req.user.currentSession.lastActivity) {
          const timeSinceLastActivity = currentTime - new Date(req.user.currentSession.lastActivity);

          if (timeSinceLastActivity > sessionTimeout) {
            // Session expired - log automatic logout
            await logPortalActivity(student, req.user._id, 'session_expired', {
              sessionId: req.user.currentSession.sessionId,
              lastActivity: req.user.currentSession.lastActivity,
              expiredAt: currentTime
            }, req);

            return res.status(401).json({
              success: false,
              message: 'Session expired due to inactivity. Please log in again.',
              sessionExpired: true
            });
          }
        }

        // Update last activity
        await req.user.updateActivity();
      }
    } catch (error) {
      console.error('Error managing student session:', error);
    }
  }
  next();
};

// Specialized access control functions for different portal areas
const portalAccessControls = {
  // Library access control
  library: checkPortalAccess('canAccessLibrary'),

  // Laboratory access control
  labs: checkPortalAccess('canAccessLabs'),

  // Course materials access control
  courses: checkPortalAccess('canAccessCourses'),

  // Assignment submission control
  assignments: checkPortalAccess('canSubmitAssignments'),

  // Grade viewing control
  grades: checkPortalAccess('canViewGrades'),

  // General portal access (for students not suspended)
  general: checkPortalAccess(null)
};

// Middleware to log file downloads/uploads
const trackFileActivity = (activityType) => {
  return async (req, res, next) => {
    if (req.user && req.user.role === 'Student') {
      try {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
          // Extract file information from request
          const fileInfo = {
            fileName: req.body?.fileName || req.query?.fileName || 'unknown',
            fileSize: req.body?.fileSize || req.headers['content-length'] || 0,
            fileType: req.body?.fileType || req.headers['content-type'] || 'unknown'
          };

          await logPortalActivity(student, req.user._id, activityType, fileInfo, req);
        }
      } catch (error) {
        console.error('Error tracking file activity:', error);
      }
    }
    next();
  };
};

// Middleware to handle emergency access (if student needs to access portal during suspension for urgent matters)
const emergencyAccess = (allowedActions = []) => {
  return async (req, res, next) => {
    if (req.user && req.user.role === 'Student') {
      try {
        const student = await Student.findOne({ userId: req.user._id });

        if (student && student.isSuspended) {
          // Check if current action is allowed during suspension
          const currentAction = req.path.split('/').pop();

          if (!allowedActions.includes(currentAction)) {
            await logPortalActivity(student, req.user._id, 'emergency_access_denied', {
              attemptedAction: currentAction,
              allowedActions: allowedActions,
              suspensionDetails: student.suspensionDetails
            }, req);

            return res.status(403).json({
              success: false,
              message: 'This action is not available during suspension',
              allowedActions: allowedActions
            });
          }

          // Log emergency access usage
          await logPortalActivity(student, req.user._id, 'emergency_access_granted', {
            action: currentAction,
            suspensionDetails: student.suspensionDetails
          }, req);
        }
      } catch (error) {
        console.error('Error handling emergency access:', error);
      }
    }
    next();
  };
};

// Rate limiting middleware for student actions
const rateLimitStudentActions = (maxActions = 100, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return async (req, res, next) => {
    if (req.user && req.user.role === 'Student') {
      const key = `${req.user._id}:${req.ip}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      if (attempts.has(key)) {
        const userAttempts = attempts.get(key).filter(timestamp => timestamp > windowStart);
        attempts.set(key, userAttempts);
      }

      const currentAttempts = attempts.get(key) || [];

      if (currentAttempts.length >= maxActions) {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
          await logPortalActivity(student, req.user._id, 'rate_limit_exceeded', {
            maxActions,
            windowMs,
            currentAttempts: currentAttempts.length
          }, req);
        }

        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please slow down.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add current attempt
      currentAttempts.push(now);
      attempts.set(key, currentAttempts);
    }
    next();
  };
};

module.exports = {
  checkPortalAccess,
  trackStudentActivity,
  detectSuspiciousActivity,
  enforceAcademicContext,
  manageStudentSessions,
  portalAccessControls,
  trackFileActivity,
  emergencyAccess,
  rateLimitStudentActions,
  logPortalActivity
};
