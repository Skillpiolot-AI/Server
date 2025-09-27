const express = require('express');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Make sure to use environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ';

router.post('/signup', async (req, res) => {
  const { username, name, email, password, confirmPassword, newsletter, subscription } = req.body;
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

    const newUser = new User({
      username,
      name,
      email,
      password: hashedPassword,
      role: isAdmin ? 'Admin' : 'User',
      newsletter,
      subscription,
    });

    await newUser.save();

    // Use consistent JWT secret and longer expiry
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });

    // Create signup activity
    try {
      await UserActivity.create({
        userId: newUser._id,
        sessionId: uuidv4(),
        activityType: 'signup',
        details: {
          userAgent: req.get('User-Agent'),
          signupTime: new Date()
        },
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown'
      });
      console.log('Signup activity created for user:', newUser._id);
    } catch (activityError) {
      console.error('Error creating signup activity:', activityError);
    }

    res.status(201).json({ token, role: newUser.role });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Fixed Login route
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const user = await User.findOne({ username });

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid username or password' });
//     }

//     // Check if account is locked
//     if (user.isLocked) {
//       return res.status(423).json({ 
//         message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
//       });
//     }

//     // Check if account is active
//     if (!user.isActive) {
//       return res.status(403).json({ 
//         message: 'Account has been deactivated. Please contact administrator.' 
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       // Increment login attempts
//       await user.incLoginAttempts();
//       return res.status(400).json({ message: 'Invalid username or password' });
//     }

//     // Reset login attempts on successful login
//     if (user.loginAttempts > 0) {
//       await user.resetLoginAttempts();
//     }

//     // Use consistent JWT secret and longer expiry
//     const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // Create login activity
//     try {
//       const loginActivity = await UserActivity.create({
//         userId: user._id,
//         sessionId: uuidv4(),
//         activityType: 'login',
//         details: {
//           userAgent: req.get('User-Agent'),
//           loginTime: new Date(),
//           ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
//         },
//         ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
//         userAgent: req.get('User-Agent') || 'Unknown'
//       });
//       console.log('Login activity created:', loginActivity._id, 'for user:', user._id);
//     } catch (activityError) {
//       console.error('Error creating login activity:', activityError);
//     }

//     res.json({ token, role: user.role });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

// routes/authRoutes.js - Updated login route

// routes/authRoutes.js - Fixed login route

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
    }).populate('universityId', 'name url location isActive'); // Make sure to populate isActive

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Account has been deactivated. Please contact administrator.' 
      });
    }

    // For university users, verify university is still active
    if ((user.role === 'UniAdmin' || user.role === 'UniTeach') && user.universityId) {
      // Check if universityId is populated and has isActive property
      if (user.universityId && typeof user.universityId.isActive !== 'undefined') {
        if (!user.universityId.isActive) {
          return res.status(403).json({
            message: 'Your university access has been deactivated. Please contact administrator.'
          });
        }
      } else {
        // If university data is not found, it's also an error
        return res.status(403).json({
          message: 'University association not found. Please contact administrator.'
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
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

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create login activity
    try {
      const loginActivity = await UserActivity.create({
        userId: user._id,
        sessionId: uuidv4(),
        activityType: 'login',
        details: {
          userAgent: req.get('User-Agent'),
          loginTime: new Date(),
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
          loginMethod: user.registrationNumber === username ? 'registration' : 
                       user.email === username ? 'email' : 'username'
        },
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown'
      });
      console.log('Login activity created:', loginActivity._id, 'for user:', user._id);
    } catch (activityError) {
      console.error('Error creating login activity:', activityError);
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
        universityName: user.universityId?.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

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
      // Fetch user with additional checks
      const user = await User.findById(decoded.id).select('-password');
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

      req.user = user;
      req.userId = decoded.id;
      next();
    } catch (userError) {
      console.error('User verification error:', userError);
      return res.status(401).json({ message: 'Failed to authenticate user' });
    }
  });
};

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log profile access activity
    try {
      await UserActivity.create({
        userId: req.userId,
        sessionId: uuidv4(),
        activityType: 'profile_access',
        details: {
          userAgent: req.get('User-Agent'),
          accessTime: new Date()
        },
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown'
      });
    } catch (activityError) {
      console.error('Error creating profile access activity:', activityError);
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;