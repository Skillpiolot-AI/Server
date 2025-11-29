const express = require('express');
const router = express.Router();
const userDataController = require('../controllers/userDataController');
const { auth } = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required. This action is restricted to administrators only.'
    });
  }
  next();
};

// Apply auth middleware to all routes
router.use(auth);
router.use(isAdmin);

// ==================== USER MANAGEMENT ROUTES ====================

// Get all users with filters and pagination
// GET /api/user-data/users?page=1&limit=10&role=User&search=john
router.get('/users', userDataController.getAllUsers);

// Get user statistics
// GET /api/user-data/statistics
router.get('/statistics', userDataController.getUserStatistics);

// Get single user by ID
// GET /api/user-data/users/:userId
router.get('/users/:userId', userDataController.getUserById);

// Update user
// PUT /api/user-data/users/:userId
router.put('/users/:userId', userDataController.updateUser);

// Delete single user
// DELETE /api/user-data/users/:userId
router.delete('/users/:userId', userDataController.deleteUser);

// Bulk delete users
// POST /api/user-data/users/bulk-delete
router.post('/users/bulk-delete', userDataController.bulkDeleteUsers);

// Toggle user active status
// PATCH /api/user-data/users/:userId/toggle-status
router.patch('/users/:userId/toggle-status', userDataController.toggleUserStatus);

// Reset user password
// POST /api/user-data/users/:userId/reset-password
router.post('/users/:userId/reset-password', userDataController.resetUserPassword);

module.exports = router;
