// const express = require('express');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const router = express.Router();



// router.post('/signup', async (req, res) => {
//   const { username, name, email, password, confirmPassword, newsletter, subscription } = req.body;
//   if (password !== confirmPassword) {
//     return res.status(400).json({ message: 'Passwords do not match' });
//   }

//   try {
//     const existingUser = await User.findOne({ email, username });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email already registered' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const isAdmin = email.endsWith('@head.com');

//     const newUser = new User({
//       username,
//       name,
//       email,
//       password: hashedPassword,
//       role: isAdmin ? 'Admin' : 'User',
//       newsletter,
//       subscription,
//     });

//     await newUser.save();

//     const token = jwt.sign({ id: newUser._id, role: newUser.role }, 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ.r_zYWL9MJWXMkAcyVmaS2l0nxmR-sMIyyJQ-dsZXNJU', { expiresIn: '1h' });

//     res.status(201).json({ token, role: newUser.role });
//   } catch (error) {
//     console.error('Error during signup:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });


// // Login
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   const UserActivity = require("../models/UserActivity");



//   try {
//     const user = await User.findOne({ username });

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid username or password' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid username or password' });
//     }

//     const token = jwt.sign({ id: user._id, role: user.role }, 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ.r_zYWL9MJWXMkAcyVmaS2l0nxmR-sMIyyJQ-dsZXNJU', { expiresIn: '1h' });

//     res.json({ token, role: user.role });
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error' });
//   }
// });



// const verifyToken = (req, res, next) => {
//   const token = req.headers['authorization']?.split(' ')[1];

//   if (!token) {
//     return res.status(403).json({ message: 'No token provided' });
//   }

//   jwt.verify(token, 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ.r_zYWL9MJWXMkAcyVmaS2l0nxmR-sMIyyJQ-dsZXNJU', (err, decoded) => {
//     if (err) {
//       return res.status(401).json({ message: 'Failed to authenticate token' });
//     }
//     req.userId = decoded.id;
//     next();
//   });
// };

// router.get('/me', verifyToken, async (req, res) => {
//   try {
//     const user = await User.findById(req.userId).select('-password');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.json(user);
//   } catch (error) {
//     console.error('Error fetching user data:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });


// module.exports = router;


const express = require('express');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

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

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ.r_zYWL9MJWXMkAcyVmaS2l0nxmR-sMIyyJQ-dsZXNJU', { expiresIn: '1h' });

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

// Login - THIS IS THE KEY FIX
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ.r_zYWL9MJWXMkAcyVmaS2l0nxmR-sMIyyJQ-dsZXNJU', { expiresIn: '1h' });

    // *** CREATE LOGIN ACTIVITY - THIS WAS MISSING! ***
    try {
      const loginActivity = await UserActivity.create({
        userId: user._id,
        sessionId: uuidv4(),
        activityType: 'login',
        details: {
          userAgent: req.get('User-Agent'),
          loginTime: new Date(),
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
        },
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown'
      });
      console.log('Login activity created:', loginActivity._id, 'for user:', user._id);
    } catch (activityError) {
      console.error('Error creating login activity:', activityError);
    }

    // Update user's last login time
    await User.findByIdAndUpdate(user._id, { 
      updatedAt: new Date() 
    });

    res.json({ token, role: user.role });
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

  jwt.verify(token, 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ.r_zYWL9MJWXMkAcyVmaS2l0nxmR-sMIyyJQ-dsZXNJU', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.id;
    next();
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
