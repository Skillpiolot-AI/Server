// // routes/authRoutes.js - Enhanced with Student authentication support

// const express = require('express');
// const User = require('../models/User');
// const Student = require('../models/Student');
// const UserActivity = require('../models/UserActivity');
// const StudentActivity = require('../models/StudentActivity');
// const University = require('../models/University');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const { v4: uuidv4 } = require('uuid');
// const router = express.Router();

// const JWT_SECRET = process.env.JWT_SECRET || 'eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ';

// // Helper function to log activity based on user role
// const logUserActivity = async (user, activityType, details, req) => {
//   try {
//     const sessionId = req.sessionID || uuidv4();
//     const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
//     const userAgent = req.get('User-Agent') || 'Unknown';

//     if (user.role === 'Student') {
//       // Log to StudentActivity for students
//       const student = await Student.findOne({ userId: user._id });
//       if (student) {
//         await StudentActivity.create({
//           studentId: student._id,
//           userId: user._id,
//           universityId: user.universityId,
//           sessionId,
//           activityType,
//           details,
//           ipAddress,
//           userAgent
//         });
//       }
//     } else {
//       // Log to UserActivity for other roles
//       await UserActivity.create({
//         userId: user._id,
//         sessionId,
//         activityType,
//         details,
//         ipAddress,
//         userAgent
//       });
//     }
//   } catch (error) {
//     console.error('Error logging user activity:', error);
//   }
// };

// // Enhanced signup with student profile creation
// router.post('/signup', async (req, res) => {
//   const { username, name, email, password, confirmPassword, newsletter, subscription, role = 'User' } = req.body;
  
//   if (password !== confirmPassword) {
//     return res.status(400).json({ message: 'Passwords do not match' });
//   }

//   try {
//     const existingUser = await User.findOne({ 
//       $or: [{ email }, { username }]
//     });
    
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email or username already registered' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const isAdmin = email.endsWith('@head.com');
    
//     // Determine final role
//     let finalRole = 'User';
//     if (isAdmin) {
//       finalRole = 'Admin';
//     } else if (['User', 'Mentor'].includes(role)) {
//       finalRole = role;
//     }

//     const newUser = new User({
//       username,
//       name,
//       email,
//       password: hashedPassword,
//       role: finalRole,
//       newsletter,
//       subscription,
//     });

//     await newUser.save();

//     // Create student profile if role is Student (handled by university admin)
//     // Regular signup doesn't create Student role - only university admin can

//     const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });

//     // Log signup activity
//     await logUserActivity(newUser, 'signup', {
//       signupMethod: 'direct',
//       signupTime: new Date()
//     }, req);

//     res.status(201).json({ 
//       token, 
//       role: newUser.role,
//       user: {
//         id: newUser._id,
//         username: newUser.username,
//         name: newUser.name,
//         email: newUser.email,
//         role: newUser.role
//       }
//     });
//   } catch (error) {
//     console.error('Error during signup:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

// // Enhanced login with student support and comprehensive logging
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     // Find user by username, email, or registration number
//     const user = await User.findOne({
//       $or: [
//         { username },
//         { email: username },
//         { registrationNumber: username }
//       ]
//     }).populate('universityId', 'name url location isActive');

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Check if account is locked
//     if (user.isLocked) {
//       await logUserActivity(user, 'login_attempt', {
//         success: false,
//         reason: 'account_locked',
//         attemptTime: new Date()
//       }, req);
      
//       return res.status(423).json({ 
//         message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
//       });
//     }

//     // Check if account is suspended
//     if (user.isSuspensionActive) {
//       await logUserActivity(user, 'login_attempt', {
//         success: false,
//         reason: 'account_suspended',
//         suspensionDetails: user.suspensionDetails,
//         attemptTime: new Date()
//       }, req);

//       const message = user.suspensionDetails?.until ? 
//         `Account is suspended until ${new Date(user.suspensionDetails.until).toLocaleDateString()}. Reason: ${user.suspensionDetails.reason || 'No reason provided'}` :
//         `Account is suspended. Reason: ${user.suspensionDetails?.reason || 'No reason provided'}`;
      
//       return res.status(403).json({ message });
//     }

//     // Check if account is active
//     if (!user.isActive) {
//       await logUserActivity(user, 'login_attempt', {
//         success: false,
//         reason: 'account_inactive',
//         attemptTime: new Date()
//       }, req);

//       return res.status(403).json({ 
//         message: 'Account has been deactivated. Please contact administrator.' 
//       });
//     }

//     // For university users, verify university is still active
//     if (['UniAdmin', 'UniTeach', 'Student'].includes(user.role) && user.universityId) {
//       if (user.universityId && typeof user.universityId.isActive !== 'undefined') {
//         if (!user.universityId.isActive) {
//           await logUserActivity(user, 'login_attempt', {
//             success: false,
//             reason: 'university_inactive',
//             universityName: user.universityId.name,
//             attemptTime: new Date()
//           }, req);

//           return res.status(403).json({
//             message: 'Your university access has been deactivated. Please contact administrator.'
//           });
//         }
//       } else {
//         return res.status(403).json({
//           message: 'University association not found. Please contact administrator.'
//         });
//       }
//     }

//     // Verify password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       await user.incLoginAttempts();
      
//       await logUserActivity(user, 'login_attempt', {
//         success: false,
//         reason: 'invalid_password',
//         loginMethod: user.registrationNumber === username ? 'registration' : 
//                      user.email === username ? 'email' : 'username',
//         attemptTime: new Date()
//       }, req);

//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Reset login attempts on successful login
//     if (user.loginAttempts > 0) {
//       await user.resetLoginAttempts();
//     }

//     // Check if password change is required
//     if (user.mustChangePassword || user.temporaryPassword) {
//       const token = jwt.sign(
//         { 
//           id: user._id, 
//           role: user.role,
//           universityId: user.universityId?._id,
//           mustChangePassword: true
//         }, 
//         JWT_SECRET, 
//         { expiresIn: '1h' } // Shorter expiry for password change tokens
//       );

//       await logUserActivity(user, 'login', {
//         success: true,
//         requiresPasswordChange: true,
//         loginMethod: user.registrationNumber === username ? 'registration' : 
//                      user.email === username ? 'email' : 'username',
//         loginTime: new Date()
//       }, req);

//       return res.json({
//         token,
//         role: user.role,
//         mustChangePassword: true,
//         message: 'Password change required before accessing the system.'
//       });
//     }

//     // Create JWT token
//     const token = jwt.sign(
//       { 
//         id: user._id, 
//         role: user.role,
//         universityId: user.universityId?._id 
//       }, 
//       JWT_SECRET, 
//       { expiresIn: '24h' }
//     );

//     // Start user session
//     const sessionId = uuidv4();
//     await user.startSession(
//       sessionId,
//       req.ip || req.connection.remoteAddress || '127.0.0.1',
//       req.get('User-Agent') || 'Unknown'
//     );

//     // Log successful login
//     await logUserActivity(user, 'login', {
//       success: true,
//       loginMethod: user.registrationNumber === username ? 'registration' : 
//                    user.email === username ? 'email' : 'username',
//       sessionId: sessionId,
//       loginTime: new Date()
//     }, req);

//     // Get additional user data for students
//     let additionalData = {};
//     if (user.role === 'Student') {
//       const studentProfile = await Student.findOne({ userId: user._id });
//       if (studentProfile) {
//         additionalData.studentProfile = {
//           department: studentProfile.department,
//           year: studentProfile.year,
//           course: studentProfile.course,
//           academicStatus: studentProfile.academicStatus,
//           performance: studentProfile.performance
//         };
//       }
//     }

//     // Return success response with user data
//     res.json({ 
//       token, 
//       role: user.role,
//       user: {
//         id: user._id,
//         username: user.username,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         universityId: user.universityId?._id,
//         universityName: user.universityId?.name,
//         registrationNumber: user.registrationNumber,
//         lastLogin: user.lastLogin,
//         ...additionalData
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

// // Password change endpoint
// router.post('/change-password', async (req, res) => {
//   const { currentPassword, newPassword, token } = req.body;

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findById(decoded.id);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Verify current password
//     const isMatch = await bcrypt.compare(currentPassword, user.password);
//     if (!isMatch) {
//       await logUserActivity(user, 'password_change_attempt', {
//         success: false,
//         reason: 'invalid_current_password',
//         attemptTime: new Date()
//       }, req);

//       return res.status(400).json({ message: 'Current password is incorrect' });
//     }

//     // Check if new password is different from recent passwords
//     for (const oldPass of user.passwordHistory) {
//       const isSameAsOld = await bcrypt.compare(newPassword, oldPass.hashedPassword);
//       if (isSameAsOld) {
//         return res.status(400).json({ message: 'Cannot reuse recent passwords' });
//       }
//     }

//     // Hash and save new password
//     const hashedNewPassword = await bcrypt.hash(newPassword, 10);
//     await user.changePassword(hashedNewPassword);

//     // Log password change
//     await logUserActivity(user, 'password_change', {
//       success: true,
//       changeTime: new Date(),
//       wasTemporary: user.temporaryPassword
//     }, req);

//     // Generate new token without password change requirement
//     const newToken = jwt.sign(
//       { 
//         id: user._id, 
//         role: user.role,
//         universityId: user.universityId
//       }, 
//       JWT_SECRET, 
//       { expiresIn: '24h' }
//     );

//     res.json({ 
//       success: true, 
//       message: 'Password changed successfully',
//       token: newToken
//     });
//   } catch (error) {
//     console.error('Password change error:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

// // Logout endpoint
// router.post('/logout', async (req, res) => {
//   try {
//     const token = req.headers['authorization']?.split(' ')[1];
    
//     if (token) {
//       const decoded = jwt.verify(token, JWT_SECRET);
//       const user = await User.findById(decoded.id);
      
//       if (user) {
//         // End user session
//         await user.endSession();
        
//         // Log logout
//         await logUserActivity(user, 'logout', {
//           logoutTime: new Date(),
//           sessionId: user.currentSession?.sessionId
//         }, req);
//       }
//     }

//     res.json({ success: true, message: 'Logged out successfully' });
//   } catch (error) {
//     console.error('Logout error:', error);
//     // Still return success for logout even if logging fails
//     res.json({ success: true, message: 'Logged out successfully' });
//   }
// });

// // Enhanced token verification middleware
// const verifyToken = (req, res, next) => {
//   const token = req.headers['authorization']?.split(' ')[1];

//   if (!token) {
//     return res.status(403).json({ message: 'No token provided' });
//   }

//   jwt.verify(token, JWT_SECRET, async (err, decoded) => {
//     if (err) {
//       console.error('Token verification error:', err);
//       return res.status(401).json({ message: 'Failed to authenticate token' });
//     }
    
//     try {
//       // Fetch user with university data
//       const user = await User.findById(decoded.id)
//         .select('-password')
//         .populate('universityId', 'name url location isActive');
      
//       if (!user) {
//         return res.status(401).json({ message: 'User not found' });
//       }

//       // Check if account is locked or inactive
//       if (user.isLocked) {
//         return res.status(423).json({ 
//           message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
//         });
//       }

//       if (!user.isActive) {
//         return res.status(403).json({ 
//           message: 'Account has been deactivated. Please contact administrator.' 
//         });
//       }

//       // Check suspension status
//       if (user.isSuspensionActive) {
//         const message = user.suspensionDetails?.until ? 
//           `Account is suspended until ${new Date(user.suspensionDetails.until).toLocaleDateString()}` :
//           'Account is suspended';
        
//         return res.status(403).json({ message });
//       }

//       // For university users, check university status
//       if (['UniAdmin', 'UniTeach', 'Student'].includes(user.role) && user.universityId) {
//         if (!user.universityId.isActive) {
//           return res.status(403).json({
//             message: 'Your university access has been deactivated. Please contact administrator.'
//           });
//         }
//       }

//       // Update last activity
//       await user.updateActivity();

//       // Check if password change is required (but allow access to change-password endpoint)
//       if ((user.mustChangePassword || user.temporaryPassword) && !req.path.includes('change-password')) {
//         return res.status(200).json({
//           mustChangePassword: true,
//           message: 'Password change required before accessing the system.'
//         });
//       }

//       req.user = user;
//       req.userId = decoded.id;
//       next();
//     } catch (userError) {
//       console.error('User verification error:', userError);
//       return res.status(401).json({ message: 'Failed to authenticate user' });
//     }
//   });
// };

// // Enhanced /me endpoint with student data
// router.get('/me', verifyToken, async (req, res) => {
//   try {
//     const user = await User.findById(req.userId)
//       .select('-password')
//       .populate('universityId', 'name url location');
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     let responseData = {
//       id: user._id,
//       username: user.username,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       universityId: user.universityId?._id,
//       universityName: user.universityId?.name,
//       registrationNumber: user.registrationNumber,
//       lastLogin: user.lastLogin,
//       isActive: user.isActive,
//       isSuspended: user.isSuspended,
//       mustChangePassword: user.mustChangePassword,
//       temporaryPassword: user.temporaryPassword
//     };

//     // Add student-specific data
//     if (user.role === 'Student') {
//       const studentProfile = await Student.findOne({ userId: user._id });
//       if (studentProfile) {
//         responseData.studentProfile = {
//           studentId: studentProfile._id,
//           department: studentProfile.department,
//           year: studentProfile.year,
//           course: studentProfile.course,
//           rollNumber: studentProfile.rollNumber,
//           academicStatus: studentProfile.academicStatus,
//           performance: studentProfile.performance,
//           portalAccess: studentProfile.portalAccess
//         };
//       }
//     }

//     // Log profile access activity
//     await logUserActivity(user, 'profile_access', {
//       accessTime: new Date()
//     }, req);

//     res.json(responseData);
//   } catch (error) {
//     console.error('Error fetching user data:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

// // Student-specific route to check portal access
// router.get('/student/portal-access', verifyToken, async (req, res) => {
//   try {
//     if (req.user.role !== 'Student') {
//       return res.status(403).json({ message: 'Access denied. Students only.' });
//     }

//     const student = await Student.findOne({ userId: req.user._id });
//     if (!student) {
//       return res.status(404).json({ message: 'Student profile not found' });
//     }

//     res.json({ 
//       success: true, 
//       portalAccess: student.portalAccess,
//       isSuspended: student.isSuspended,
//       suspensionDetails: student.suspensionDetails
//     });
//   } catch (error) {
//     console.error('Error fetching portal access:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });
// module.exports = router;


// routes/authRoutes.js
const express = require('express');
const User = require('../models/User');
const OTP = require('../models/OTP');
const EmailVerification = require('../models/EmailVerification');
const LoginVerification = require('../models/LoginVerification');
const Student = require('../models/Student');
const UserActivity = require('../models/UserActivity');
const StudentActivity = require('../models/StudentActivity');
const { verifyGoogleToken } = require('../config/googleAuth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const router = express.Router();

// Import email utilities
const { sendEmailFast } = require('../config/mailHelper');
const { emailTemplates: otpEmailTemplates } = require('../config/email');
const adminEmailTemplates = require('../config/emailTemplates');

// Constants
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ==================== HELPER FUNCTIONS ====================

// Get location from IP
const getLocationFromIP = async (ipAddress) => {
  try {
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 5000
    });
    
    return {
      country: response.data.country_name || 'Unknown',
      region: response.data.region || 'Unknown',
      city: response.data.city || 'Unknown',
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      timezone: response.data.timezone
    };
  } catch (error) {
    console.error('Error fetching location:', error.message);
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown'
    };
  }
};

// Parse user agent
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  
  let device = 'Desktop';
  if (/mobile/i.test(ua)) device = 'Mobile';
  else if (/tablet/i.test(ua)) device = 'Tablet';
  
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  return { device, browser, os };
};

// Check if location is suspicious
const isLocationSuspicious = async (user, currentIP, currentLocation) => {
  const recentLogins = user.loginHistory.slice(-5);
  
  if (recentLogins.length === 0) {
    return false;
  }
  
  const ipMatch = recentLogins.some(login => login.ipAddress === currentIP);
  if (ipMatch) return false;
  
  const countryMatch = recentLogins.some(login => 
    login.location?.country === currentLocation.country
  );
  
  if (!countryMatch && currentLocation.country !== 'Unknown') {
    return true;
  }
  
  return false;
};

// Log user activity
const logUserActivity = async (user, activityType, details, req) => {
  try {
    const sessionId = req.sessionID || uuidv4();
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';

    if (user.role === 'Student') {
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

// ==================== AUTHENTICATION ROUTES ====================

// Signup
router.post('/signup', async (req, res) => {
  const { username, name, email, password, confirmPassword, newsletter, subscription, role = 'User' } = req.body;
  
  console.log('\n📝 Signup Request');
  console.log('Email:', email);
  console.log('Username:', username);
  
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }]
    });
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ 
          message: 'Email already registered. Please login or use forgot password.' 
        });
      }
      return res.status(400).json({ 
        message: 'Username already taken. Please choose another.' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = email.endsWith('@head.com');
    
    let finalRole = 'User';
    if (isAdmin) {
      finalRole = 'Admin';
    } else if (['User', 'Mentor'].includes(role)) {
      finalRole = role;
    }

    const newUser = new User({
      username,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: finalRole,
      newsletter,
      subscription,
      isVerified: false,
      isActive: false
    });

    await newUser.save();
    console.log('✅ User created:', newUser._id);

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    const verification = await EmailVerification.createVerificationToken(
      newUser._id,
      email.toLowerCase(),
      ipAddress,
      userAgent
    );

    console.log('✅ Verification token created:', verification.token);

    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

    try {
      const { verificationEmailTemplate } = require('../config/mailHelper');
      await sendEmailFast(
        email,
        verificationEmailTemplate(name, verificationLink, username)
      );
      
      console.log('✅ Verification email sent successfully');

      await logUserActivity(newUser, 'signup', {
        signupMethod: 'direct',
        signupTime: new Date(),
        emailSent: true
      }, req);

      res.status(201).json({ 
        success: true,
        message: 'Account created! Please check your email to verify your account.',
        user: {
          id: newUser._id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        requiresVerification: true
      });
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      
      await User.findByIdAndDelete(newUser._id);
      await EmailVerification.findByIdAndDelete(verification._id);
      
      res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.',
        error: emailError.message
      });
    }
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;

  console.log('\n✉️ Email Verification Request');
  console.log('Token:', token);

  try {
    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification token is required' 
      });
    }

    const verification = await EmailVerification.findOne({ token });

    if (!verification) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification token' 
      });
    }

    const result = await verification.verify();

    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: result.message,
        email: verification.email
      });
    }

    const user = await User.findById(verification.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    user.isVerified = true;
    user.isActive = true;
    await user.save();

    console.log('✅ Email verified successfully for:', user.email);

    try {
      const { verificationSuccessTemplate } = require('../config/mailHelper');
      await sendEmailFast(
        user.email,
        verificationSuccessTemplate(user.name)
      );
    } catch (emailError) {
      console.error('Failed to send success email:', emailError);
    }

    await logUserActivity(user, 'email_verified', {
      verificationTime: new Date()
    }, req);

    res.json({ 
      success: true,
      message: 'Email verified successfully! You can now login.',
      email: user.email
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during verification',
      error: error.message
    });
  }
});

// Resend Verification Email
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  console.log('\n🔄 Resend Verification Request');
  console.log('Email:', email);

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({ 
        success: true,
        message: 'If an account exists, a verification email will be sent.' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is already verified. Please login.' 
      });
    }

    await EmailVerification.deleteMany({ 
      userId: user._id, 
      isVerified: false 
    });

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    const verification = await EmailVerification.createVerificationToken(
      user._id,
      email.toLowerCase(),
      ipAddress,
      userAgent
    );

    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

    const { verificationEmailTemplate } = require('../config/mailHelper');
    await sendEmailFast(
      email,
      verificationEmailTemplate(user.name, verificationLink, user.username)
    );

    console.log('✅ Verification email resent');

    res.json({ 
      success: true,
      message: 'Verification email sent! Please check your inbox.' 
    });
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('\n🔐 Login Request');
  console.log('Username:', username);

  try {
    const user = await User.findOne({
      $or: [
        { username },
        { email: username.toLowerCase() },
        { registrationNumber: username }
      ]
    }).populate('universityId', 'name url location isActive');

    if (!user) {
      return res.status(404).json({ 
        message: 'No account found with these credentials. Please sign up first.',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    if (!user.isVerified) {
      console.log('⚠️ Email not verified');
      return res.status(403).json({
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        errorCode: 'EMAIL_NOT_VERIFIED',
        email: user.email
      });
    }

    if (user.isLocked) {
      await logUserActivity(user, 'login_attempt', {
        success: false,
        reason: 'account_locked',
        attemptTime: new Date()
      }, req);
      
      return res.status(423).json({ 
        message: 'Account is temporarily locked. Please try forgot password.',
        errorCode: 'ACCOUNT_LOCKED'
      });
    }

    if (user.isSuspensionActive) {
      const message = user.suspensionDetails?.until ? 
        `Account suspended until ${new Date(user.suspensionDetails.until).toLocaleDateString()}` :
        'Account is suspended';
      
      return res.status(403).json({ message, errorCode: 'ACCOUNT_SUSPENDED' });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Account is deactivated. Contact administrator.',
        errorCode: 'ACCOUNT_INACTIVE'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await user.incLoginAttempts();
      
      await logUserActivity(user, 'login_attempt', {
        success: false,
        reason: 'invalid_password',
        attemptTime: new Date()
      }, req);

      const remainingAttempts = 5 - (user.loginAttempts + 1);
      return res.status(400).json({ 
        message: remainingAttempts > 0 
          ? `Incorrect password. ${remainingAttempts} attempts remaining.`
          : 'Account will be locked after next failed attempt.',
        errorCode: 'INVALID_PASSWORD'
      });
    }

    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';
    const location = await getLocationFromIP(ipAddress);
    const deviceInfo = parseUserAgent(userAgent);

    console.log('📍 Location:', location);
    console.log('💻 Device:', deviceInfo);

    const isSuspicious = await isLocationSuspicious(user, ipAddress, location);

    if (isSuspicious) {
      console.log('⚠️ Suspicious location detected');

      const loginVerification = await LoginVerification.createLoginVerification(
        user._id,
        user.email,
        ipAddress,
        userAgent,
        location,
        deviceInfo
      );

      const verificationLink = `${FRONTEND_URL}/verify-login?token=${loginVerification.token}`;

      try {
        const { suspiciousLocationTemplate } = require('../config/mailHelper');
        await sendEmailFast(
          user.email,
          suspiciousLocationTemplate(user.name, location, verificationLink, deviceInfo)
        );

        console.log('✅ Suspicious login email sent');

        await logUserActivity(user, 'suspicious_login_detected', {
          location,
          deviceInfo,
          emailSent: true,
          verificationRequired: true
        }, req);

        return res.status(403).json({
          message: 'Unusual login detected. Please check your email to verify this login.',
          errorCode: 'LOCATION_VERIFICATION_REQUIRED',
          requiresVerification: true
        });
      } catch (emailError) {
        console.error('❌ Failed to send suspicious login email:', emailError);
      }
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        universityId: user.universityId?._id 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    const sessionId = uuidv4();
    await user.startSession(sessionId, ipAddress, userAgent);

    user.loginHistory.push({
      timestamp: new Date(),
      ipAddress,
      userAgent,
      success: true,
      location
    });

    if (user.loginHistory.length > 20) {
      user.loginHistory = user.loginHistory.slice(-20);
    }

    await user.save();

    await logUserActivity(user, 'login', {
      success: true,
      location,
      deviceInfo,
      sessionId
    }, req);

    console.log('✅ Login successful');

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
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user) {
        await user.endSession();
        
        await logUserActivity(user, 'logout', {
          logoutTime: new Date(),
          sessionId: user.currentSession?.sessionId
        }, req);
      }
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ success: true, message: 'Logged out successfully' });
  }
});

// ==================== PASSWORD MANAGEMENT ====================

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  console.log('\n🔐 Forgot Password Request');
  console.log('Email:', email);

  try {
    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({ 
        message: 'Email is required',
        success: false
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('⚠️ User not found, but sending success response');
      return res.status(200).json({ 
        message: 'If an account exists with this email, you will receive a password reset code.',
        success: true
      });
    }

    if (!user.isActive) {
      console.log('❌ User account is not active');
      return res.status(403).json({ 
        message: 'Account is deactivated. Please contact administrator.',
        success: false
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';

    console.log('Creating OTP...');
    
    const otpDoc = await OTP.createOTP(email.toLowerCase(), 'password_reset', ipAddress, userAgent);
    
    console.log('✅ OTP created:', otpDoc.otp);

    try {
      const emailResult = await sendEmailFast(
        email,
        otpEmailTemplates.otpEmail(user.name, otpDoc.otp, 10)
      );

      console.log('✅ Email sent successfully!');

      await logUserActivity(user, 'password_reset_requested', {
        requestTime: new Date(),
        ipAddress,
        otpSent: true
      }, req);

      res.json({ 
        message: 'Password reset code sent to your email. Please check your inbox.',
        success: true
      });
    } catch (emailError) {
      console.error('❌ Error sending OTP email:', emailError);
      
      res.status(500).json({ 
        message: 'Failed to send reset code. Please try again later.',
        success: false,
        error: emailError.message
      });
    }
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    
    res.status(500).json({ 
      message: 'Server error. Please try again later.',
      success: false,
      error: error.message
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  console.log('\n🔍 Verifying OTP');
  console.log('Email:', email);
  console.log('OTP:', otp);

  try {
    if (!email || !otp) {
      return res.status(400).json({ 
        message: 'Email and OTP are required',
        success: false
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ 
        message: 'User not found',
        success: false
      });
    }

    const otpDoc = await OTP.findValidOTP(email.toLowerCase(), 'password_reset');

    if (!otpDoc) {
      console.log('❌ No valid OTP found');
      return res.status(400).json({ 
        message: 'No valid OTP found. Please request a new one.',
        success: false
      });
    }

    const verificationResult = await otpDoc.verifyOTP(otp);

    if (!verificationResult.success) {
      await logUserActivity(user, 'otp_verification_failed', {
        attemptTime: new Date(),
        attemptsRemaining: otpDoc.maxAttempts - otpDoc.attempts,
        reason: verificationResult.message
      }, req);

      return res.status(400).json(verificationResult);
    }

    const resetToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        purpose: 'password_reset'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log('✅ Reset token generated');

    await logUserActivity(user, 'otp_verified', {
      verificationTime: new Date()
    }, req);

    res.json({ 
      message: 'OTP verified successfully',
      success: true,
      resetToken
    });
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    
    res.status(500).json({ 
      message: 'Server error. Please try again.',
      success: false,
      error: error.message
    });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  try {
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        message: 'Passwords do not match',
        success: false
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long',
        success: false
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ 
        message: 'Invalid or expired reset token. Please request a new one.',
        success: false
      });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ 
        message: 'Invalid reset token',
        success: false
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        success: false
      });
    }

    for (const oldPass of user.passwordHistory) {
      const isSameAsOld = await bcrypt.compare(newPassword, oldPass.hashedPassword);
      if (isSameAsOld) {
        return res.status(400).json({ 
          message: 'Cannot reuse recent passwords. Please choose a different password.',
          success: false
        });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.changePassword(hashedPassword);

    try {
      await sendEmailFast(
        user.email,
        otpEmailTemplates.passwordResetSuccess(user.name)
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    await logUserActivity(user, 'password_reset_completed', {
      resetTime: new Date()
    }, req);

    res.json({ 
      message: 'Password reset successfully. You can now login with your new password.',
      success: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: 'Server error. Please try again.',
      success: false
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  console.log('\n🔄 Resending OTP');
  console.log('Email:', email);

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({ 
        message: 'If an account exists with this email, a new code will be sent.',
        success: true
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';

    const otpDoc = await OTP.createOTP(email.toLowerCase(), 'password_reset', ipAddress, userAgent);

    console.log('✅ New OTP created:', otpDoc.otp);

    try {
      await sendEmailFast(
        email,
        otpEmailTemplates.otpEmail(user.name, otpDoc.otp, 10)
      );

      console.log('✅ Email sent successfully');

      await logUserActivity(user, 'otp_resent', {
        resendTime: new Date()
      }, req);

      res.json({ 
        message: 'New code sent to your email',
        success: true
      });
    } catch (emailError) {
      console.error('❌ Error resending OTP:', emailError);
      res.status(500).json({ 
        message: 'Failed to send code. Please try again.',
        success: false,
        error: emailError.message
      });
    }
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({ 
      message: 'Server error. Please try again.',
      success: false,
      error: error.message
    });
  }
});

// Change Password
router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword, token } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      await logUserActivity(user, 'password_change_attempt', {
        success: false,
        reason: 'invalid_current_password',
        attemptTime: new Date()
      }, req);

      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    for (const oldPass of user.passwordHistory) {
      const isSameAsOld = await bcrypt.compare(newPassword, oldPass.hashedPassword);
      if (isSameAsOld) {
        return res.status(400).json({ message: 'Cannot reuse recent passwords' });
      }
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.changePassword(hashedNewPassword);

    await logUserActivity(user, 'password_change', {
      success: true,
      changeTime: new Date()
    }, req);

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

// ==================== LOGIN VERIFICATION ====================

// Get Login Verification Details
router.get('/login-verification/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const verification = await LoginVerification.findOne({ token });

    if (!verification) {
      return res.status(404).json({ 
        success: false,
        message: 'Verification not found' 
      });
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ 
        success: false,
        message: 'Verification link has expired' 
      });
    }

    res.json({ 
      success: true,
      verification: {
        location: verification.location,
        ipAddress: verification.ipAddress,
        deviceInfo: verification.deviceInfo,
        createdAt: verification.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching verification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Verify Login
router.post('/verify-login', async (req, res) => {
  const { token } = req.body;

  console.log('\n✅ Verify Login Request');

  try {
    const verification = await LoginVerification.findOne({ token });

    if (!verification) {
      return res.status(404).json({ 
        success: false,
        message: 'Verification not found' 
      });
    }

    const result = await verification.verifyLogin();

    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: result.message 
      });
    }

    const user = await User.findById(verification.userId);
    if (user) {
      await logUserActivity(user, 'login_verified', {
        verificationTime: new Date(),
        location: verification.location
      }, req);
    }

    console.log('✅ Login verified successfully');

    res.json({ 
      success: true,
      message: 'Login verified successfully. You can now log in.' 
    });
  } catch (error) {
    console.error('Error verifying login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Deny Login
router.post('/deny-login', async (req, res) => {
  const { token } = req.body;

  console.log('\n❌ Deny Login Request');

  try {
    const verification = await LoginVerification.findOne({ token });

    if (!verification) {
      return res.status(404).json({ 
        success: false,
        message: 'Verification not found' 
      });
    }

    const result = await verification.denyLogin();

    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: result.message 
      });
    }

    const user = await User.findById(verification.userId);
    if (user) {
      await logUserActivity(user, 'login_denied', {
        denialTime: new Date(),
        location: verification.location,
        reason: 'user_denied'
      }, req);
    }

    console.log('✅ Login denied successfully');

    res.json({ 
      success: true,
      message: 'Login attempt blocked. Please change your password.' 
    });
  } catch (error) {
    console.error('Error denying login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// ==================== TOKEN VERIFICATION MIDDLEWARE ====================

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
      const user = await User.findById(decoded.id)
        .select('-password')
        .populate('universityId', 'name url location isActive');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.isLocked) {
        return res.status(423).json({ 
          message: 'Account is temporarily locked. Please try again later.' 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          message: 'Account has been deactivated. Please contact administrator.' 
        });
      }

      if (user.isSuspensionActive) {
        const message = user.suspensionDetails?.until ? 
          `Account is suspended until ${new Date(user.suspensionDetails.until).toLocaleDateString()}` :
          'Account is suspended';
        
        return res.status(403).json({ message });
      }

      if (['UniAdmin', 'UniTeach', 'Student'].includes(user.role) && user.universityId) {
        if (!user.universityId.isActive) {
          return res.status(403).json({
            message: 'Your university access has been deactivated.'
          });
        }
      }

      await user.updateActivity();

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

// Get Current User
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
      mustChangePassword: user.mustChangePassword
    };

    if (user.role === 'Student') {
      const studentProfile = await Student.findOne({ userId: user._id });
      if (studentProfile) {
        responseData.studentProfile = {
          studentId: studentProfile._id,
          department: studentProfile.department,
          year: studentProfile.year,
          course: studentProfile.course,
          rollNumber: studentProfile.rollNumber,
          academicStatus: studentProfile.academicStatus
        };
      }
    }

    await logUserActivity(user, 'profile_access', {
      accessTime: new Date()
    }, req);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin: Create User with Email
router.post('/admin/create-user', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    const { name, username, email, password, role, isVerified } = req.body;

    console.log('\n👤 Admin Creating New User');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Role:', role);
    console.log('Pre-verified:', isVerified);

    if (!name || !username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const validRoles = ['User', 'Mentor', 'Admin', 'UniAdmin', 'UniTeach'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() }, 
        { username }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ 
          success: false,
          message: 'Email already registered' 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: 'Username already taken' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isVerified: isVerified || false,
      isActive: isVerified || false,
      newsletter: false,
      subscription: false
    });

    await newUser.save();
    console.log('✅ User created:', newUser._id);

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Admin Panel';

    let emailSent = false;
    let emailError = null;

    if (isVerified) {
      try {
        await sendEmailFast(
          email,
          adminEmailTemplates.adminCreatedWelcome(name, username, email, password, role)
        );
        emailSent = true;
        console.log('✅ Welcome email sent');
      } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
        emailError = error.message;
      }
    } else {
      try {
        const verification = await EmailVerification.createVerificationToken(
          newUser._id,
          email.toLowerCase(),
          ipAddress,
          userAgent
        );

        const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

        await sendEmailFast(
          email,
          adminEmailTemplates.adminCreatedVerification(name, username, email, password, role, verificationLink)
        );
        emailSent = true;
        console.log('✅ Verification email sent');
      } catch (error) {
        console.error('❌ Failed to send verification email:', error);
        emailError = error.message;
      }
    }

    await logUserActivity(req.user, 'user_created', {
      createdUserId: newUser._id,
      createdUserEmail: email,
      createdUserRole: role,
      isPreVerified: isVerified,
      emailSent,
      creationTime: new Date()
    }, req);

    res.status(201).json({ 
      success: true,
      message: `User created successfully! ${emailSent ? (isVerified ? 'Welcome email sent.' : 'Verification email sent.') : 'Email sending failed.'}`,
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified
      },
      emailSent,
      emailError
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating user',
      error: error.message
    });
  }
});

// Admin: Send Test Email
// Admin: Send Test Email
router.post('/admin/test-email', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    const { testEmail, sampleData } = req.body;

    console.log('\n📧 Sending Test Email');
    console.log('Test Email:', testEmail);

    const { name, username, email, role, password, isVerified } = sampleData;

    const testEmailTemplate = {
      subject: `🧪 TEST EMAIL - ${isVerified ? 'Welcome' : 'Verification'} Email Preview`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .banner { background: linear-gradient(135deg, #ff6b6b, #ee5a6f); color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; border-radius: 8px; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .info-box { background: #e3f2fd; border: 2px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 8px; }
            h2 { color: #667eea; }
            .credentials { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="banner">🧪 THIS IS A TEST EMAIL - FOR PREVIEW PURPOSES ONLY</div>
          <div class="container">
            <div class="info-box">
              <h3 style="margin-top: 0; color: #2196f3;">📋 Test Email Information</h3>
              <p><strong>Template Type:</strong> ${isVerified ? 'Welcome Email (Pre-Verified)' : 'Verification Email (Unverified)'}</p>
              <p><strong>Sent to:</strong> ${testEmail}</p>
              <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <h2>Sample User Details</h2>
            <div class="credentials">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Username:</strong> ${username}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Role:</strong> ${role}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><strong>Pre-Verified:</strong> ${isVerified ? 'Yes' : 'No'}</p>
            </div>
            
            <p style="margin-top: 20px; color: #666;">This is how the ${isVerified ? 'welcome' : 'verification'} email will look when sent to actual users.</p>
            
            <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
              <strong>⚠️ Note:</strong> The actual email will have proper styling and interactive buttons.
            </div>
          </div>
          <div class="banner" style="margin-top: 20px;">🧪 END OF TEST EMAIL</div>
        </body>
        </html>
      `,
      text: `TEST EMAIL\n\nTemplate: ${isVerified ? 'Welcome' : 'Verification'}\nSent to: ${testEmail}\nDate: ${new Date().toLocaleString()}\n\nSample Data:\nName: ${name}\nUsername: ${username}\nEmail: ${email}\nRole: ${role}\nPassword: ${password}\n\nThis is a test email preview.`
    };

    // ✅ FIXED: Use sendEmailFast instead of sendEmail
    await sendEmailFast(testEmail, testEmailTemplate);

    console.log('✅ Test email sent successfully');

    await logUserActivity(req.user, 'test_email_sent', {
      testEmail,
      templateType: isVerified ? 'welcome' : 'verification',
      sentTime: new Date()
    }, req);

    res.json({ 
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      templateType: isVerified ? 'welcome' : 'verification'
    });
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});
// Admin: Get All Users
router.get('/admin/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    const { page = 1, limit = 20, role, isVerified, search } = req.query;

    const query = {};
    
    if (role) query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Admin: Get Unverified Users
router.get('/admin/unverified-users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    const unverifiedUsers = await User.find({
      $or: [
        { isVerified: { $exists: false } },
        { isVerified: false }
      ]
    })
    .select('username name email role createdAt isActive')
    .sort({ createdAt: -1 })
    .limit(100);

    res.json({
      success: true,
      count: unverifiedUsers.length,
      users: unverifiedUsers
    });
  } catch (error) {
    console.error('Error fetching unverified users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Admin: Manually Verify User
router.post('/admin/verify-user/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    user.isVerified = true;
    user.isActive = true;
    await user.save();

    await logUserActivity(user, 'manually_verified', {
      verifiedBy: req.user._id,
      verifiedByName: req.user.name,
      verificationTime: new Date()
    }, req);

    console.log(`✅ Admin ${req.user.email} manually verified user: ${user.email}`);

    res.json({
      success: true,
      message: 'User verified successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error manually verifying user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Admin: Bulk Verify Users
router.post('/admin/bulk-verify-users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'userIds array is required' 
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { 
        $set: { 
          isVerified: true,
          isActive: true 
        } 
      }
    );

    console.log(`✅ Admin ${req.user.email} bulk verified ${result.modifiedCount} users`);

    res.json({
      success: true,
      message: `Successfully verified ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk verifying users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Admin: Resend Verification Email
router.post('/admin/resend-verification/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'User is already verified' 
      });
    }

    await EmailVerification.deleteMany({ 
      userId: user._id, 
      isVerified: false 
    });

    const verification = await EmailVerification.createVerificationToken(
      user._id,
      user.email,
      req.ip || '127.0.0.1',
      req.get('User-Agent') || 'Admin Panel'
    );

    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

    const { verificationEmailTemplate } = require('../config/mailHelper');
    await sendEmailFast(
      user.email,
      verificationEmailTemplate(user.name, verificationLink, user.username)
    );

    console.log(`✅ Admin ${req.user.email} resent verification email to: ${user.email}`);

    res.json({ 
      success: true,
      message: 'Verification email resent successfully' 
    });
  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
});

// Admin: Auto-Verify All Existing Users
router.post('/admin/auto-verify-all', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    const result = await User.updateMany(
      {
        $or: [
          { isVerified: { $exists: false } },
          { isVerified: false }
        ]
      },
      { 
        $set: { 
          isVerified: true,
          isActive: true 
        } 
      }
    );

    console.log(`✅ Admin ${req.user.email} auto-verified ALL unverified users (${result.modifiedCount})`);

    res.json({
      success: true,
      message: `Successfully auto-verified ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error auto-verifying users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Student Portal Access Check
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

// router.post('/google', async (req, res) => {


//   const { credential } = req.body;

//   console.log('\n🔐 Google OAuth Request');

//   try {
//     if (!credential) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Google credential is required' 
//       });
//     }

//     // Verify Google token
//     const verificationResult = await verifyGoogleToken(credential);

//     if (!verificationResult.success) {
//       console.error('❌ Google token verification failed:', verificationResult.error);
//       return res.status(401).json({ 
//         success: false,
//         message: 'Invalid Google token',
//         error: verificationResult.error
//       });
//     }

//     const googleData = verificationResult.data;
//     console.log('✅ Google token verified for:', googleData.email);

//     // Check if user exists by email or Google ID
//     let user = await User.findOne({
//       $or: [
//         { email: googleData.email.toLowerCase() },
//         { googleId: googleData.googleId }
//       ]
//     }).populate('universityId', 'name url location isActive');

//     const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
//     const userAgent = req.get('User-Agent') || 'Unknown';
//     const location = await getLocationFromIP(ipAddress);
//     const deviceInfo = parseUserAgent(userAgent);

//     // NEW USER - Sign up with Google
//     if (!user) {
//       console.log('📝 Creating new user with Google OAuth');

//       // Generate unique username from email
//       let username = googleData.email.split('@')[0];
      
//       // Ensure username is unique
//       let usernameExists = await User.findOne({ username });
//       let counter = 1;
//       while (usernameExists) {
//         username = `${googleData.email.split('@')[0]}${counter}`;
//         usernameExists = await User.findOne({ username });
//         counter++;
//       }

//       // Create new user
//       user = new User({
//         username,
//         name: googleData.name,
//         email: googleData.email.toLowerCase(),
//         googleId: googleData.googleId,
//         imageUrl: googleData.picture,
//         password: await bcrypt.hash(uuidv4(), 10), // Random password (won't be used)
//         role: 'User',
//         isVerified: googleData.emailVerified, // Google emails are verified
//         isActive: true,
//         newsletter: false,
//         subscription: false,
//         authProvider: 'google'
//       });

//       await user.save();
//       console.log('✅ New user created:', user._id);

//       // Log signup activity
//       await logUserActivity(user, 'signup', {
//         signupMethod: 'google_oauth',
//         signupTime: new Date(),
//         location,
//         deviceInfo,
//         googleVerified: googleData.emailVerified
//       }, req);

//       // Send welcome email
//       try {
//         const { googleWelcomeTemplate } = require('../config/mailHelper');
//         await sendEmailFast(
//           user.email,
//           googleWelcomeTemplate(user.name, username)
//         );
//         console.log('✅ Welcome email sent');
//       } catch (emailError) {
//         console.error('⚠️ Failed to send welcome email:', emailError);
//       }
//     } 
//     // EXISTING USER - Login with Google
//     else {
//       console.log('👤 Existing user login with Google');

//       // Update Google ID if not set
//       if (!user.googleId) {
//         user.googleId = googleData.googleId;
//         user.authProvider = 'google';
//         await user.save();
//       }

//       // Check account status
//       if (user.isLocked) {
//         await logUserActivity(user, 'login_attempt', {
//           success: false,
//           reason: 'account_locked',
//           method: 'google_oauth',
//           attemptTime: new Date()
//         }, req);
        
//         return res.status(423).json({ 
//           success: false,
//           message: 'Account is temporarily locked. Please contact support.',
//           errorCode: 'ACCOUNT_LOCKED'
//         });
//       }

//       if (user.isSuspensionActive) {
//         const message = user.suspensionDetails?.until ? 
//           `Account suspended until ${new Date(user.suspensionDetails.until).toLocaleDateString()}` :
//           'Account is suspended';
        
//         return res.status(403).json({ 
//           success: false,
//           message, 
//           errorCode: 'ACCOUNT_SUSPENDED' 
//         });
//       }

//       if (!user.isActive) {
//         return res.status(403).json({ 
//           success: false,
//           message: 'Account is deactivated. Contact administrator.',
//           errorCode: 'ACCOUNT_INACTIVE'
//         });
//       }

//       // Reset login attempts if any
//       if (user.loginAttempts > 0) {
//         await user.resetLoginAttempts();
//       }

//       // Check for suspicious location
//       const isSuspicious = await isLocationSuspicious(user, ipAddress, location);

//       if (isSuspicious) {
//         console.log('⚠️ Suspicious location detected');

//         const loginVerification = await LoginVerification.createLoginVerification(
//           user._id,
//           user.email,
//           ipAddress,
//           userAgent,
//           location,
//           deviceInfo
//         );

//         const verificationLink = `${FRONTEND_URL}/verify-login?token=${loginVerification.token}`;

//         try {
//           const { suspiciousLocationTemplate } = require('../config/mailHelper');
//           await sendEmailFast(
//             user.email,
//             suspiciousLocationTemplate(user.name, location, verificationLink, deviceInfo)
//           );

//           console.log('✅ Suspicious login email sent');

//           await logUserActivity(user, 'suspicious_login_detected', {
//             location,
//             deviceInfo,
//             method: 'google_oauth',
//             emailSent: true,
//             verificationRequired: true
//           }, req);

//           return res.status(403).json({
//             success: false,
//             message: 'Unusual login detected. Please check your email to verify this login.',
//             errorCode: 'LOCATION_VERIFICATION_REQUIRED',
//             requiresVerification: true
//           });
//         } catch (emailError) {
//           console.error('❌ Failed to send suspicious login email:', emailError);
//         }
//       }

//       // Log successful login
//       await logUserActivity(user, 'login', {
//         success: true,
//         method: 'google_oauth',
//         location,
//         deviceInfo,
//         loginTime: new Date()
//       }, req);
//     }

//     // Update profile picture if changed
//     if (googleData.picture && user.imageUrl !== googleData.picture) {
//       user.imageUrl = googleData.picture;
//       await user.save();
//     }

//     // Create JWT token
//     const token = jwt.sign(
//       { 
//         id: user._id, 
//         role: user.role,
//         universityId: user.universityId?._id 
//       }, 
//       JWT_SECRET, 
//       { expiresIn: '24h' }
//     );

//     // Start user session
//     const sessionId = uuidv4();
//     await user.startSession(sessionId, ipAddress, userAgent);

//     // Add to login history
//     user.loginHistory.push({
//       timestamp: new Date(),
//       ipAddress,
//       userAgent,
//       success: true,
//       location
//     });

//     if (user.loginHistory.length > 20) {
//       user.loginHistory = user.loginHistory.slice(-20);
//     }

//     await user.save();

//     console.log('✅ Google OAuth login successful');

//     // Return response
//     res.json({ 
//       success: true,
//       token, 
//       role: user.role,
//       user: {
//         id: user._id,
//         username: user.username,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         imageUrl: user.imageUrl,
//         universityId: user.universityId?._id,
//         universityName: user.universityId?.name,
//         lastLogin: user.lastLogin,
//         authProvider: 'google'
//       },
//       message: user.createdAt.getTime() === user.updatedAt.getTime() ? 
//         'Account created successfully!' : 
//         'Login successful!'
//     });

//   } catch (error) {
//     console.error('❌ Google OAuth error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server Error', 
//       error: error.message 
//     });
//   }
// });


router.post('/google', async (req, res) => {
  const { credential } = req.body;

  console.log('\n🔐 Google OAuth Request');

  try {
    if (!credential) {
      return res.status(400).json({ 
        success: false,
        message: 'Google credential is required' 
      });
    }

    // Verify Google token
    const verificationResult = await verifyGoogleToken(credential);

    if (!verificationResult.success) {
      console.error('❌ Google token verification failed:', verificationResult.error);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid Google token',
        error: verificationResult.error
      });
    }

    const googleData = verificationResult.data;
    console.log('✅ Google token verified for:', googleData.email);

    // Check if user exists by email or Google ID
    let user = await User.findOne({
      $or: [
        { email: googleData.email.toLowerCase() },
        { googleId: googleData.googleId }
      ]
    }).populate('universityId', 'name url location isActive');

    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';
    const location = await getLocationFromIP(ipAddress);
    const deviceInfo = parseUserAgent(userAgent);

    // NEW USER - Sign up with Google
    if (!user) {
      console.log('📝 Creating new user with Google OAuth');

      // Generate unique username from email
      let username = googleData.email.split('@')[0];
      
      // Ensure username is unique
      let usernameExists = await User.findOne({ username });
      let counter = 1;
      while (usernameExists) {
        username = `${googleData.email.split('@')[0]}${counter}`;
        usernameExists = await User.findOne({ username });
        counter++;
      }

      // Create new user
      user = new User({
        username,
        name: googleData.name,
        email: googleData.email.toLowerCase(),
        googleId: googleData.googleId,
        imageUrl: googleData.picture,
        password: await bcrypt.hash(uuidv4(), 10), // Random password (won't be used)
        role: 'User',
        isVerified: false, // ✅ REQUIRE EMAIL VERIFICATION FOR GOOGLE USERS TOO
        isActive: false,    // ✅ NOT ACTIVE UNTIL VERIFIED
        newsletter: false,
        subscription: false,
        authProvider: 'google'
      });

      await user.save();
      console.log('✅ New user created:', user._id);

      // Create email verification token
      const verification = await EmailVerification.createVerificationToken(
        user._id,
        user.email,
        ipAddress,
        userAgent
      );

      const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

      // Send verification email for Google signup
      try {
        const { verificationEmailTemplate } = require('../config/mailHelper');
        await sendEmailFast(
          user.email,
          verificationEmailTemplate(user.name, verificationLink, user.username)
        );
        
        console.log('✅ Verification email sent to Google user');
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        
        // Rollback user creation if email fails
        await User.findByIdAndDelete(user._id);
        await EmailVerification.findByIdAndDelete(verification._id);
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again.',
          error: emailError.message
        });
      }

      // Log signup activity
      await logUserActivity(user, 'signup', {
        signupMethod: 'google_oauth',
        signupTime: new Date(),
        location,
        deviceInfo,
        googleVerified: googleData.emailVerified,
        requiresEmailVerification: true
      }, req);

      // Return response indicating verification needed
      return res.status(201).json({
        success: true,
        message: 'Account created! Please check your email to verify your account.',
        requiresVerification: true,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          imageUrl: user.imageUrl,
          isVerified: false,
          authProvider: 'google'
        }
      });
    } 
    
    // EXISTING USER - Login with Google
    else {
      console.log('👤 Existing user login with Google');

      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleData.googleId;
        user.authProvider = 'google';
        
        // Update profile picture if available
        if (googleData.picture && !user.imageUrl) {
          user.imageUrl = googleData.picture;
        }
        
        await user.save();
      }

      // Check if email is verified
      if (!user.isVerified) {
        console.log('⚠️ User exists but email not verified');
        
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          errorCode: 'EMAIL_NOT_VERIFIED',
          email: user.email,
          requiresVerification: true
        });
      }

      // Check account status
      if (user.isLocked) {
        await logUserActivity(user, 'login_attempt', {
          success: false,
          reason: 'account_locked',
          method: 'google_oauth',
          attemptTime: new Date()
        }, req);
        
        return res.status(423).json({ 
          success: false,
          message: 'Account is temporarily locked. Please contact support.',
          errorCode: 'ACCOUNT_LOCKED'
        });
      }

      if (user.isSuspensionActive) {
        const message = user.suspensionDetails?.until ? 
          `Account suspended until ${new Date(user.suspensionDetails.until).toLocaleDateString()}` :
          'Account is suspended';
        
        return res.status(403).json({ 
          success: false,
          message, 
          errorCode: 'ACCOUNT_SUSPENDED' 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          success: false,
          message: 'Account is deactivated. Contact administrator.',
          errorCode: 'ACCOUNT_INACTIVE'
        });
      }

      // Reset login attempts if any
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Check for suspicious location
      const isSuspicious = await isLocationSuspicious(user, ipAddress, location);

      if (isSuspicious) {
        console.log('⚠️ Suspicious location detected');

        const loginVerification = await LoginVerification.createLoginVerification(
          user._id,
          user.email,
          ipAddress,
          userAgent,
          location,
          deviceInfo
        );

        const verificationLink = `${FRONTEND_URL}/verify-login?token=${loginVerification.token}`;

        try {
          const { suspiciousLocationTemplate } = require('../config/mailHelper');
          await sendEmailFast(
            user.email,
            suspiciousLocationTemplate(user.name, location, verificationLink, deviceInfo)
          );

          console.log('✅ Suspicious login email sent');

          await logUserActivity(user, 'suspicious_login_detected', {
            location,
            deviceInfo,
            method: 'google_oauth',
            emailSent: true,
            verificationRequired: true
          }, req);

          return res.status(403).json({
            success: false,
            message: 'Unusual login detected. Please check your email to verify this login.',
            errorCode: 'LOCATION_VERIFICATION_REQUIRED',
            requiresVerification: true
          });
        } catch (emailError) {
          console.error('❌ Failed to send suspicious login email:', emailError);
        }
      }

      // Update profile picture if changed
      if (googleData.picture && user.imageUrl !== googleData.picture) {
        user.imageUrl = googleData.picture;
        await user.save();
      }

      // Log successful login
      await logUserActivity(user, 'login', {
        success: true,
        method: 'google_oauth',
        location,
        deviceInfo,
        loginTime: new Date()
      }, req);
    }

    // Create JWT token for verified users
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
    await user.startSession(sessionId, ipAddress, userAgent);

    // Add to login history
    user.loginHistory.push({
      timestamp: new Date(),
      ipAddress,
      userAgent,
      success: true,
      location
    });

    if (user.loginHistory.length > 20) {
      user.loginHistory = user.loginHistory.slice(-20);
    }

    await user.save();

    console.log('✅ Google OAuth login successful');

    // Return response
    res.json({ 
      success: true,
      token, 
      role: user.role,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        imageUrl: user.imageUrl,
        universityId: user.universityId?._id,
        universityName: user.universityId?.name,
        lastLogin: user.lastLogin,
        authProvider: 'google'
      },
      message: 'Login successful!'
    });

  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
});


/**
 * Link Google account to existing user
 * POST /api/auth/link-google
 * Headers: Authorization: Bearer <token>
 * Body: { credential: string (Google ID token) }
 */
// router.post('/link-google', verifyToken, async (req, res) => {
//   const { credential } = req.body;

//   console.log('\n🔗 Link Google Account Request');

//   try {
//     if (!credential) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Google credential is required' 
//       });
//     }

//     // Verify Google token
//     const verificationResult = await verifyGoogleToken(credential);

//     if (!verificationResult.success) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Invalid Google token',
//         error: verificationResult.error
//       });
//     }

//     const googleData = verificationResult.data;

//     // Check if Google account is already linked to another user
//     const existingGoogleUser = await User.findOne({ 
//       googleId: googleData.googleId,
//       _id: { $ne: req.user._id }
//     });

//     if (existingGoogleUser) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'This Google account is already linked to another user' 
//       });
//     }

//     // Check if email matches
//     if (googleData.email.toLowerCase() !== req.user.email.toLowerCase()) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Google account email does not match your account email' 
//       });
//     }

//     // Link Google account
//     req.user.googleId = googleData.googleId;
//     req.user.authProvider = 'google';
    
//     if (googleData.picture && !req.user.imageUrl) {
//       req.user.imageUrl = googleData.picture;
//     }

//     if (googleData.emailVerified && !req.user.isVerified) {
//       req.user.isVerified = true;
//       req.user.isActive = true;
//     }

//     await req.user.save();

//     await logUserActivity(req.user, 'google_account_linked', {
//       linkedTime: new Date()
//     }, req);

//     console.log('✅ Google account linked successfully');

//     res.json({ 
//       success: true,
//       message: 'Google account linked successfully',
//       user: {
//         id: req.user._id,
//         email: req.user.email,
//         googleId: req.user.googleId,
//         imageUrl: req.user.imageUrl,
//         isVerified: req.user.isVerified
//       }
//     });

//   } catch (error) {
//     console.error('❌ Link Google account error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server Error', 
//       error: error.message 
//     });
//   }
// });


router.post('/link-google', verifyToken, async (req, res) => {
  const { credential } = req.body;

  console.log('\n🔗 Link Google Account Request');

  try {
    if (!credential) {
      return res.status(400).json({ 
        success: false,
        message: 'Google credential is required' 
      });
    }

    // Verify Google token
    const verificationResult = await verifyGoogleToken(credential);

    if (!verificationResult.success) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid Google token',
        error: verificationResult.error
      });
    }

    const googleData = verificationResult.data;

    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({ 
      googleId: googleData.googleId,
      _id: { $ne: req.user._id }
    });

    if (existingGoogleUser) {
      return res.status(400).json({ 
        success: false,
        message: 'This Google account is already linked to another user' 
      });
    }

    // Check if email matches
    if (googleData.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(400).json({ 
        success: false,
        message: 'Google account email does not match your account email' 
      });
    }

    // Link Google account
    req.user.googleId = googleData.googleId;
    req.user.authProvider = 'google';
    
    if (googleData.picture && !req.user.imageUrl) {
      req.user.imageUrl = googleData.picture;
    }

    // If Google email is verified and user email isn't, mark as verified
    if (googleData.emailVerified && !req.user.isVerified) {
      req.user.isVerified = true;
      req.user.isActive = true;
    }

    await req.user.save();

    await logUserActivity(req.user, 'google_account_linked', {
      linkedTime: new Date()
    }, req);

    console.log('✅ Google account linked successfully');

    res.json({ 
      success: true,
      message: 'Google account linked successfully',
      user: {
        id: req.user._id,
        email: req.user.email,
        googleId: req.user.googleId,
        imageUrl: req.user.imageUrl,
        isVerified: req.user.isVerified
      }
    });

  } catch (error) {
    console.error('❌ Link Google account error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
});


/**
 * Unlink Google account
 * POST /api/auth/unlink-google
 * Headers: Authorization: Bearer <token>
 */
// router.post('/unlink-google', verifyToken, async (req, res) => {
//   try {
//     if (!req.user.googleId) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Google account is not linked' 
//       });
//     }

//     // Ensure user has a password set (can't unlink if Google is only auth method)
//     if (req.user.authProvider === 'google' && !req.user.password) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Cannot unlink Google account. Please set a password first.' 
//       });
//     }

//     req.user.googleId = undefined;
//     await req.user.save();

//     await logUserActivity(req.user, 'google_account_unlinked', {
//       unlinkedTime: new Date()
//     }, req);

//     console.log('✅ Google account unlinked');

//     res.json({ 
//       success: true,
//       message: 'Google account unlinked successfully' 
//     });

//   } catch (error) {
//     console.error('❌ Unlink Google account error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server Error', 
//       error: error.message 
//     });
//   }
// });

router.post('/unlink-google', verifyToken, async (req, res) => {
  try {
    if (!req.user.googleId) {
      return res.status(400).json({ 
        success: false,
        message: 'Google account is not linked' 
      });
    }

    // Ensure user has a password set (can't unlink if Google is only auth method)
    if (req.user.authProvider === 'google' && !req.user.password) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot unlink Google account. Please set a password first.' 
      });
    }

    req.user.googleId = undefined;
    req.user.authProvider = 'local';
    await req.user.save();

    await logUserActivity(req.user, 'google_account_unlinked', {
      unlinkedTime: new Date()
    }, req);

    console.log('✅ Google account unlinked');

    res.json({ 
      success: true,
      message: 'Google account unlinked successfully' 
    });

  } catch (error) {
    console.error('❌ Unlink Google account error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
});

module.exports = router;