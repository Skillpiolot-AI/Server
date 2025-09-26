const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// // Signup
// router.post('/signup', async (req, res) => {
//   const { username, name, email, password, confirmPassword, newsletter, subscription } = req.body;

//   if (password !== confirmPassword) {
//     return res.status(400).json({ message: 'Passwords do not match' });
//   }

//   try {
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
//     if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
//       res.status(400).json({ message: 'Email already registered' });
//     } else {
//       res.status(500).json({ message: 'Server Error' });
//     }
//   }
// });
router.post('/signup', async (req, res) => {
  const { username, name, email, password, confirmPassword, newsletter, subscription } = req.body;

  
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ email ,username });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
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

    res.status(201).json({ token, role: newUser.role });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// Login
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

    res.json({ token, role: user.role });
  } catch (error) {
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
    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;