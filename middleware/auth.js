const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Use consistent JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcyNTI4MDAzMCwiaWF0IjoxNzI1MjgwMDMwfQ';

exports.auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization header provided.'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    console.log('Verifying token with secret:', JWT_SECRET ? 'Secret exists' : 'No secret');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('universityId', 'name url location');
    
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator.'
      });
    }

    console.log('User authenticated successfully:', user.username, user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: error.message
    });
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(403).json({ message: 'No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(403).json({ message: 'No token provided' });
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('universityId', 'name url location');

    if (!user) {
      console.log('User not found for decoded ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
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

    console.log('User verified successfully:', user.username, user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }

    return res.status(401).json({ message: 'Failed to authenticate token' });
  }
};

// Role-based access control middleware
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Admin only access
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  next();
};

// University-specific access control
exports.requireUniversityAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const allowedRoles = ['Admin', 'UniAdmin', 'UniTeach'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. University access required.'
    });
  }

  // Admin has access to all universities
  if (req.user.role === 'Admin') {
    return next();
  }

  // UniAdmin and UniTeach must have a universityId
  if (!req.user.universityId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. No university association found.'
    });
  }

  next();
};