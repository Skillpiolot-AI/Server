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



// routes/authRoutes.js - Enhanced with OTP functionality


const express = require('express');
const User = require('../models/User');
const OTP = require('../models/OTP');
const EmailVerification = require('../models/EmailVerification');
const LoginVerification = require('../models/LoginVerification');
const Student = require('../models/Student');
const UserActivity = require('../models/UserActivity');
const StudentActivity = require('../models/StudentActivity');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const {
  sendEmailFast,
  verificationEmailTemplate,
  suspiciousLocationTemplate,
  verificationSuccessTemplate
} = require('../config/mailHelper');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET ;
const FRONTEND_URL = process.env.FRONTEND_URL ;

// Helper function to get location from IP
const getLocationFromIP = async (ipAddress) => {
  try {
    // Use ipapi.co for IP geolocation (free tier: 1000 requests/day)
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

// Helper function to parse user agent
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

// Helper function to check if location is suspicious
const isLocationSuspicious = async (user, currentIP, currentLocation) => {
  // Get user's login history
  const recentLogins = user.loginHistory.slice(-5); // Last 5 logins
  
  if (recentLogins.length === 0) {
    return false; // First login, not suspicious
  }
  
  // Check if IP matches recent logins
  const ipMatch = recentLogins.some(login => login.ipAddress === currentIP);
  if (ipMatch) return false;
  
  // Check if country matches recent logins
  const countryMatch = recentLogins.some(login => 
    login.location?.country === currentLocation.country
  );
  
  if (!countryMatch && currentLocation.country !== 'Unknown') {
    return true; // Different country, suspicious
  }
  
  return false;
};

// Helper function to log activity
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

// ==================== SIGNUP WITH EMAIL VERIFICATION ====================
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

    // Create user (not verified yet)
    const newUser = new User({
      username,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: finalRole,
      newsletter,
      subscription,
      isVerified: false, // Email not verified yet
      isActive: false // Account not active until verified
    });

    await newUser.save();
    console.log('✅ User created:', newUser._id);

    // Create verification token
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    const verification = await EmailVerification.createVerificationToken(
      newUser._id,
      email.toLowerCase(),
      ipAddress,
      userAgent
    );

    console.log('✅ Verification token created:', verification.token);

    // Create verification link
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

    // Send verification email
    try {
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
      
      // Delete user if email fails
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

// ==================== VERIFY EMAIL ====================
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

    // Find verification record
    const verification = await EmailVerification.findOne({ token });

    if (!verification) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification token' 
      });
    }

    // Verify the token
    const result = await verification.verify();

    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        message: result.message,
        email: verification.email
      });
    }

    // Update user account
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

    // Send success email
    try {
      await sendEmailFast(
        user.email,
        verificationSuccessTemplate(user.name)
      );
    } catch (emailError) {
      console.error('Failed to send success email:', emailError);
    }

    // Log activity
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

// ==================== RESEND VERIFICATION EMAIL ====================
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

    // Delete old verification tokens
    await EmailVerification.deleteMany({ 
      userId: user._id, 
      isVerified: false 
    });

    // Create new verification token
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    const verification = await EmailVerification.createVerificationToken(
      user._id,
      email.toLowerCase(),
      ipAddress,
      userAgent
    );

    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

    // Send email
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

// ==================== LOGIN WITH LOCATION VERIFICATION ====================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('\n🔐 Login Request');
  console.log('Username:', username);

  try {
    // Find user
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

    // Check if email is verified
    if (!user.isVerified) {
      console.log('⚠️ Email not verified');
      return res.status(403).json({
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        errorCode: 'EMAIL_NOT_VERIFIED',
        email: user.email
      });
    }

    // Check account status
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

    // Verify password
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

    // Reset login attempts
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Get location info
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';
    const location = await getLocationFromIP(ipAddress);
    const deviceInfo = parseUserAgent(userAgent);

    console.log('📍 Location:', location);
    console.log('💻 Device:', deviceInfo);

    // Check if location is suspicious
    const isSuspicious = await isLocationSuspicious(user, ipAddress, location);

    if (isSuspicious) {
      console.log('⚠️ Suspicious location detected');

      // Create login verification
      const loginVerification = await LoginVerification.createLoginVerification(
        user._id,
        user.email,
        ipAddress,
        userAgent,
        location,
        deviceInfo
      );

      // Create verification link
      const verificationLink = `${FRONTEND_URL}/verify-login?token=${loginVerification.token}`;

      // Send suspicious login email
      try {
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
        // Continue with login if email fails
      }
    }

    // Normal login flow
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        universityId: user.universityId?._id 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Start session
    const sessionId = uuidv4();
    await user.startSession(sessionId, ipAddress, userAgent);

    // Update login history with location
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

// ==================== GET LOGIN VERIFICATION DETAILS ====================
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

// ==================== VERIFY LOGIN ====================
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

    // Log activity
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

// ==================== DENY LOGIN ====================
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

    // Log security event
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


router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  console.log('\n🔐 Forgot Password Request');
  console.log('Email:', email);

  try {
    // Validate email input
    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({ 
        message: 'Email is required',
        success: false
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      // For security, send success even if user doesn't exist
      console.log('⚠️ User not found, but sending success response');
      return res.status(200).json({ 
        message: 'If an account exists with this email, you will receive a password reset code.',
        success: true
      });
    }

    console.log('User details:', {
      name: user.name,
      email: user.email,
      isActive: user.isActive
    });

    // Check if user account is active
    if (!user.isActive) {
      console.log('❌ User account is not active');
      return res.status(403).json({ 
        message: 'Account is deactivated. Please contact administrator.',
        success: false
      });
    }

    // Get IP and User Agent
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';

    console.log('Creating OTP...');
    
    // Create OTP
    const otpDoc = await OTP.createOTP(email.toLowerCase(), 'password_reset', ipAddress, userAgent);
    
    console.log('✅ OTP created:', otpDoc.otp);
    console.log('OTP expires at:', new Date(otpDoc.createdAt.getTime() + 10 * 60 * 1000));

    // Send OTP via email
    console.log('📧 Sending email...');
    
    try {
      const emailResult = await sendEmail(
        email,
        emailTemplates.otpEmail(user.name, otpDoc.otp, 10)
      );

      console.log('✅ Email sent successfully!');
      console.log('Message ID:', emailResult.messageId);
      console.log('Preview URL:', emailResult.previewUrl);

      // Log activity
      await logUserActivity(user, 'password_reset_requested', {
        requestTime: new Date(),
        ipAddress,
        otpSent: true
      }, req);

      res.json({ 
        message: 'Password reset code sent to your email. Please check your inbox.',
        success: true,
        // Include preview URL for development testing
        previewUrl: emailResult.previewUrl,
        // For debugging only - remove in production
        debug: {
          otp: otpDoc.otp,
          expiresIn: '10 minutes'
        }
      });
    } catch (emailError) {
      console.error('❌ Error sending OTP email:');
      console.error('Error name:', emailError.name);
      console.error('Error message:', emailError.message);
      console.error('Error code:', emailError.code);
      console.error('Error stack:', emailError.stack);
      
      res.status(500).json({ 
        message: 'Failed to send reset code. Please try again later.',
        success: false,
        error: emailError.message
      });
    }
  } catch (error) {
    console.error('❌ Forgot password error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      message: 'Server error. Please try again later.',
      success: false,
      error: error.message
    });
  }
});
// Verify OTP
// Replace your verify-otp route with this fixed version:

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

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ 
        message: 'User not found',
        success: false
      });
    }

    console.log('✅ User found');

    // Find valid OTP
    const otpDoc = await OTP.findValidOTP(email.toLowerCase(), 'password_reset');

    if (!otpDoc) {
      console.log('❌ No valid OTP found');
      return res.status(400).json({ 
        message: 'No valid OTP found. Please request a new one.',
        success: false
      });
    }

    console.log('✅ OTP document found');
    console.log('Stored OTP:', otpDoc.otp);
    console.log('Input OTP:', otp);
    console.log('Attempts:', otpDoc.attempts);
    console.log('Is Used:', otpDoc.isUsed);

    // ✅ FIXED: Use await for verifyOTP since it's now async
    const verificationResult = await otpDoc.verifyOTP(otp);

    console.log('Verification result:', verificationResult);

    if (!verificationResult.success) {
      // Log failed attempt
      await logUserActivity(user, 'otp_verification_failed', {
        attemptTime: new Date(),
        attemptsRemaining: otpDoc.maxAttempts - otpDoc.attempts,
        reason: verificationResult.message
      }, req);

      return res.status(400).json(verificationResult);
    }

    // Generate reset token (valid for 15 minutes)
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

    // Log successful OTP verification
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
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      message: 'Server error. Please try again.',
      success: false,
      error: error.message
    });
  }
});


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

    // Create new OTP
    const otpDoc = await OTP.createOTP(email.toLowerCase(), 'password_reset', ipAddress, userAgent);

    console.log('✅ New OTP created:', otpDoc.otp);

    // Send OTP via email
    try {
      const emailResult = await sendEmail(
        email,
        emailTemplates.otpEmail(user.name, otpDoc.otp, 10)
      );

      console.log('✅ Email sent successfully');

      await logUserActivity(user, 'otp_resent', {
        resendTime: new Date()
      }, req);

      res.json({ 
        message: 'New code sent to your email',
        success: true,
        previewUrl: emailResult.previewUrl,
        // For debugging - remove in production
        debug: {
          otp: otpDoc.otp
        }
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


// Reset Password with Token
router.post('/reset-password', async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  try {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        message: 'Passwords do not match',
        success: false
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long',
        success: false
      });
    }

    // Verify reset token
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

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        success: false
      });
    }

    // Check if new password is different from recent passwords
    for (const oldPass of user.passwordHistory) {
      const isSameAsOld = await bcrypt.compare(newPassword, oldPass.hashedPassword);
      if (isSameAsOld) {
        return res.status(400).json({ 
          message: 'Cannot reuse recent passwords. Please choose a different password.',
          success: false
        });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.changePassword(hashedPassword);

    // Send confirmation email
    try {
      await sendEmail(
        user.email,
        emailTemplates.passwordResetSuccess(user.name)
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Log password reset
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

    // Create new OTP
    const otpDoc = await OTP.createOTP(email.toLowerCase(), 'password_reset', ipAddress, userAgent);

    // Send OTP via email
    try {
      const emailResult = await sendEmail(
        email,
        emailTemplates.otpEmail(user.name, otpDoc.otp, 10)
      );

      await logUserActivity(user, 'otp_resent', {
        resendTime: new Date()
      }, req);

      res.json({ 
        message: 'New code sent to your email',
        success: true,
        previewUrl: emailResult.previewUrl
      });
    } catch (emailError) {
      console.error('Error resending OTP:', emailError);
      res.status(500).json({ 
        message: 'Failed to send code. Please try again.',
        success: false
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      message: 'Server error. Please try again.',
      success: false
    });
  }
});

// Password change endpoint (existing functionality preserved)
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
      changeTime: new Date(),
      wasTemporary: user.temporaryPassword
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

// Logout endpoint
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
      const user = await User.findById(decoded.id)
        .select('-password')
        .populate('universityId', 'name url location isActive');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

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

      if (user.isSuspensionActive) {
        const message = user.suspensionDetails?.until ? 
          `Account is suspended until ${new Date(user.suspensionDetails.until).toLocaleDateString()}` :
          'Account is suspended';
        
        return res.status(403).json({ message });
      }

      if (['UniAdmin', 'UniTeach', 'Student'].includes(user.role) && user.universityId) {
        if (!user.universityId.isActive) {
          return res.status(403).json({
            message: 'Your university access has been deactivated. Please contact administrator.'
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

// /me endpoint
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

    await logUserActivity(user, 'profile_access', {
      accessTime: new Date()
    }, req);

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Student portal access check
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




router.get('/admin/unverified-users', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
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

// ==================== ADMIN: MANUALLY VERIFY USER ====================
router.post('/admin/verify-user/:userId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
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

    // Verify user
    user.isVerified = true;
    user.isActive = true;
    await user.save();

    // Log activity
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

// ==================== ADMIN: BULK VERIFY USERS ====================
router.post('/admin/bulk-verify-users', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
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

// ==================== ADMIN: RESEND VERIFICATION EMAIL ====================
router.post('/admin/resend-verification/:userId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
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

    // Delete old verification tokens
    await EmailVerification.deleteMany({ 
      userId: user._id, 
      isVerified: false 
    });

    // Create new verification token
    const verification = await EmailVerification.createVerificationToken(
      user._id,
      user.email,
      req.ip || '127.0.0.1',
      req.get('User-Agent') || 'Admin Panel'
    );

    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

    // Send email
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

// ==================== ADMIN: AUTO-VERIFY ALL EXISTING USERS ====================
router.post('/admin/auto-verify-all', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
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


module.exports = router;