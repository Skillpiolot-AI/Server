// routes/authRoutes.js - Enhanced with Student authentication support

const express = require('express');
const User = require('../models/User');
const Student = require('../models/Student');
const UserActivity = require('../models/UserActivity');
const StudentActivity = require('../models/StudentActivity');
const University = require('../models/University');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ';

// Helper function to log activity based on user role
const logUserActivity = async (user, activityType, details, req) => {
  try {
    const sessionId = req.sessionID || uuidv4();
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';

    if (user.role === 'Student') {
      // Log to StudentActivity for students
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        await StudentActivity.create({
          studentId: student._id,
          userId: user._id,
          universityId: user.universityId,
          sessionId,
          activityType,
          details,
          ipAddress,
          userAgent
        });
      }
    } else {
      // Log to UserActivity for other roles
      await UserActivity.create({
        userId: user._id,
        sessionId,
        activityType,
        details,
        ipAddress,
        userAgent
      });
    }
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

// Enhanced signup with student profile creation
router.post('/signup', async (req, res) => {
  const { username, name, email, password, confirmPassword, newsletter, subscription, role = 'User' } = req.body;
  
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = email.endsWith('@head.com');
    
    // Determine final role
    let finalRole = 'User';
    if (isAdmin) {
      finalRole = 'Admin';
    } else if (['User', 'Mentor'].includes(role)) {
      finalRole = role;
    }

    const newUser = new User({
      username,
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      newsletter,
      subscription,
    });

    await newUser.save();

    // Create student profile if role is Student (handled by university admin)
    // Regular signup doesn't create Student role - only university admin can

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });

    // Log signup activity
    await logUserActivity(newUser, 'signup', {
      signupMethod: 'direct',
      signupTime: new Date()
    }, req);

    res.status(201).json({ 
      token, 
      role: newUser.role,
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Enhanced login with student support and comprehensive logging
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username, email, or registration number
    const user = await User.findOne({
      $or: [
        { username },
        { email: username },
        { registrationNumber: username }
      ]
    }).populate('universityId', 'name url location isActive');

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      await logUserActivity(user, 'login_attempt', {
        success: false,
        reason: 'account_locked',
        attemptTime: new Date()
      }, req);
      
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // Check if account is suspended
    if (user.isSuspensionActive) {
      await logUserActivity(user, 'login_attempt', {
        success: false,
        reason: 'account_suspended',
        suspensionDetails: user.suspensionDetails,
        attemptTime: new Date()
      }, req);

      const message = user.suspensionDetails?.until ? 
        `Account is suspended until ${new Date(user.suspensionDetails.until).toLocaleDateString()}. Reason: ${user.suspensionDetails.reason || 'No reason provided'}` :
        `Account is suspended. Reason: ${user.suspensionDetails?.reason || 'No reason provided'}`;
      
      return res.status(403).json({ message });
    }

    // Check if account is active
    if (!user.isActive) {
      await logUserActivity(user, 'login_attempt', {
        success: false,
        reason: 'account_inactive',
        attemptTime: new Date()
      }, req);

      return res.status(403).json({ 
        message: 'Account has been deactivated. Please contact administrator.' 
      });
    }

    // For university users, verify university is still active
    if (['UniAdmin', 'UniTeach', 'Student'].includes(user.role) && user.universityId) {
      if (user.universityId && typeof user.universityId.isActive !== 'undefined') {
        if (!user.universityId.isActive) {
          await logUserActivity(user, 'login_attempt', {
            success: false,
            reason: 'university_inactive',
            universityName: user.universityId.name,
            attemptTime: new Date()
          }, req);

          return res.status(403).json({
            message: 'Your university access has been deactivated. Please contact administrator.'
          });
        }
      } else {
        return res.status(403).json({
          message: 'University association not found. Please contact administrator.'
        });
      }
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await user.incLoginAttempts();
      
      await logUserActivity(user, 'login_attempt', {
        success: false,
        reason: 'invalid_password',
        loginMethod: user.registrationNumber === username ? 'registration' : 
                     user.email === username ? 'email' : 'username',
        attemptTime: new Date()
      }, req);

      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Check if password change is required
    if (user.mustChangePassword || user.temporaryPassword) {
      const token = jwt.sign(
        { 
          id: user._id, 
          role: user.role,
          universityId: user.universityId?._id,
          mustChangePassword: true
        }, 
        JWT_SECRET, 
        { expiresIn: '1h' } // Shorter expiry for password change tokens
      );

      await logUserActivity(user, 'login', {
        success: true,
        requiresPasswordChange: true,
        loginMethod: user.registrationNumber === username ? 'registration' : 
                     user.email === username ? 'email' : 'username',
        loginTime: new Date()
      }, req);

      return res.json({
        token,
        role: user.role,
        mustChangePassword: true,
        message: 'Password change required before accessing the system.'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        universityId: user.universityId?._id 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Start user session
    const sessionId = uuidv4();
    await user.startSession(
      sessionId,
      req.ip || req.connection.remoteAddress || '127.0.0.1',
      req.get('User-Agent') || 'Unknown'
    );

    // Log successful login
    await logUserActivity(user, 'login', {
      success: true,
      loginMethod: user.registrationNumber === username ? 'registration' : 
                   user.email === username ? 'email' : 'username',
      sessionId: sessionId,
      loginTime: new Date()
    }, req);

    // Get additional user data for students
    let additionalData = {};
    if (user.role === 'Student') {
      const studentProfile = await Student.findOne({ userId: user._id });
      if (studentProfile) {
        additionalData.studentProfile = {
          department: studentProfile.department,
          year: studentProfile.year,
          course: studentProfile.course,
          academicStatus: studentProfile.academicStatus,
          performance: studentProfile.performance
        };
      }
    }

    // Return success response with user data
    res.json({ 
      token, 
      role: user.role,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        universityId: user.universityId?._id,
        universityName: user.universityId?.name,
        registrationNumber: user.registrationNumber,
        lastLogin: user.lastLogin,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Password change endpoint
router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword, token } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      await logUserActivity(user, 'password_change_attempt', {
        success: false,
        reason: 'invalid_current_password',
        attemptTime: new Date()
      }, req);

      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is different from recent passwords
    for (const oldPass of user.passwordHistory) {
      const isSameAsOld = await bcrypt.compare(newPassword, oldPass.hashedPassword);
      if (isSameAsOld) {
        return res.status(400).json({ message: 'Cannot reuse recent passwords' });
      }
    }

    // Hash and save new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.changePassword(hashedNewPassword);

    // Log password change
    await logUserActivity(user, 'password_change', {
      success: true,
      changeTime: new Date(),
      wasTemporary: user.temporaryPassword
    }, req);

    // Generate new token without password change requirement
    const newToken = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        universityId: user.universityId
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      message: 'Password changed successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user) {
        // End user session
        await user.endSession();
        
        // Log logout
        await logUserActivity(user, 'logout', {
          logoutTime: new Date(),
          sessionId: user.currentSession?.sessionId
        }, req);
      }
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still return success for logout even if logging fails
    res.json({ success: true, message: 'Logged out successfully' });
  }
});

// Enhanced token verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }
    
    try {
      // Fetch user with university data
      const user = await User.findById(decoded.id)
        .select('-password')
        .populate('universityId', 'name url location isActive');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if account is locked or inactive
      if (user.isLocked) {
        return res.status(423).json({ 
          message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          message: 'Account has been deactivated. Please contact administrator.' 
        });
      }

      // Check suspension status
      if (user.isSuspensionActive) {
        const message = user.suspensionDetails?.until ? 
          `Account is suspended until ${new Date(user.suspensionDetails.until).toLocaleDateString()}` :
          'Account is suspended';
        
        return res.status(403).json({ message });
      }

      // For university users, check university status
      if (['UniAdmin', 'UniTeach', 'Student'].includes(user.role) && user.universityId) {
        if (!user.universityId.isActive) {
          return res.status(403).json({
            message: 'Your university access has been deactivated. Please contact administrator.'
          });
        }
      }

      // Update last activity
      await user.updateActivity();

      // Check if password change is required (but allow access to change-password endpoint)
      if ((user.mustChangePassword || user.temporaryPassword) && !req.path.includes('change-password')) {
        return res.status(200).json({
          mustChangePassword: true,
          message: 'Password change required before accessing the system.'
        });
      }

      req.user = user;
      req.userId = decoded.id;
      next();
    } catch (userError) {
      console.error('User verification error:', userError);
      return res.status(401).json({ message: 'Failed to authenticate user' });
    }
  });
};

// Enhanced /me endpoint with student data
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('universityId', 'name url location');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let responseData = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      universityId: user.universityId?._id,
      universityName: user.universityId?.name,
      registrationNumber: user.registrationNumber,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
      isSuspended: user.isSuspended,
      mustChangePassword: user.mustChangePassword,
      temporaryPassword: user.temporaryPassword
    };

    // Add student-specific data
    if (user.role === 'Student') {
      const studentProfile = await Student.findOne({ userId: user._id });
      if (studentProfile) {
        responseData.studentProfile = {
          studentId: studentProfile._id,
          department: studentProfile.department,
          year: studentProfile.year,
          course: studentProfile.course,
          rollNumber: studentProfile.rollNumber,
          academicStatus: studentProfile.academicStatus,
          performance: studentProfile.performance,
          portalAccess: studentProfile.portalAccess
        };
      }
    }

    // Log profile access activity
    await logUserActivity(user, 'profile_access', {
      accessTime: new Date()
    }, req);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Student-specific route to check portal access
router.get('/student/portal-access', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json({ 
      success: true, 
      portalAccess: student.portalAccess,
      isSuspended: student.isSuspended,
      suspensionDetails: student.suspensionDetails
    });
  } catch (error) {
    console.error('Error fetching portal access:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});
module.exports = router;
