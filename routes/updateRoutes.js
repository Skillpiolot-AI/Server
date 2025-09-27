const express = require('express');
const router = express.Router();
const Update = require('../models/Update');
const {verifyToken} = require('../middleware/auth'); // Your verifyToken middleware

// GET /api/updates - Get all updates (filtered by user role)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user role
    const query = {
      isActive: true,
      allowedRoles: { $in: [userRole] }
    };

    const updates = await Update.find(query)
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Update.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: updates,
      pagination: {
        currentPage: page,
        totalPages,
        totalUpdates: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching updates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching updates',
      error: error.message
    });
  }
});

// GET /api/updates/admin - Get all updates for admin management
router.get('/admin', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const priority = req.query.priority || '';
    const updateType = req.query.updateType || '';

    // Build search query
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (updateType) {
      query.updateType = updateType;
    }

    const updates = await Update.find(query)
      .populate('createdBy', 'name username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Update.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: updates,
      pagination: {
        currentPage: page,
        totalPages,
        totalUpdates: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching admin updates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching updates',
      error: error.message
    });
  }
});

// GET /api/updates/stats/dashboard - Get update statistics for admin dashboard
// MOVED THIS BEFORE /:id ROUTE
router.get('/stats/dashboard', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const stats = await Update.aggregate([
      {
        $group: {
          _id: null,
          totalUpdates: { $sum: 1 },
          activeUpdates: { $sum: { $cond: ['$isActive', 1, 0] } },
          priorityBreakdown: {
            $push: {
              priority: '$priority',
              count: 1
            }
          },
          typeBreakdown: {
            $push: {
              type: '$updateType',
              count: 1
            }
          }
        }
      }
    ]);

    // Get recent updates
    const recentUpdates = await Update.find()
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title updateType priority createdAt');

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalUpdates: 0,
          activeUpdates: 0,
          priorityBreakdown: [],
          typeBreakdown: []
        },
        recentUpdates
      }
    });
  } catch (error) {
    console.error('Error fetching update stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// GET /api/updates/:id - Get single update
// MOVED THIS AFTER /stats/dashboard ROUTE
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const update = await Update.findById(req.params.id)
      .populate('createdBy', 'name username email');

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    // Check if user has permission to view this update
    if (!update.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this update',
        locked: true
      });
    }

    res.json({
      success: true,
      data: update
    });
  } catch (error) {
    console.error('Error fetching update:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching update',
      error: error.message
    });
  }
});

// POST /api/updates - Create new update (Admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const {
      title,
      description,
      allowedRoles,
      redirectUrl,
      issueDescription,
      version,
      priority,
      updateType
    } = req.body;

    // Validation
    if (!title || !description || !allowedRoles || !redirectUrl || !updateType) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, allowed roles, redirect URL, and update type are required'
      });
    }

    // Validate allowedRoles
    const validRoles = ['Admin', 'User', 'Mentor'];
    if (!Array.isArray(allowedRoles) || !allowedRoles.every(role => validRoles.includes(role))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roles specified'
      });
    }

    const update = new Update({
      title,
      description,
      allowedRoles,
      redirectUrl,
      issueDescription: issueDescription || '',
      version: version || '1.0.0',
      priority: priority || 'Medium',
      updateType,
      createdBy: req.user.id
    });

    await update.save();

    // Populate createdBy field for response
    await update.populate('createdBy', 'name username email');

    res.status(201).json({
      success: true,
      message: 'Update created successfully',
      data: update
    });
  } catch (error) {
    console.error('Error creating update:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating update',
      error: error.message
    });
  }
});

// PUT /api/updates/:id - Update existing update (Admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const update = await Update.findById(req.params.id);

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    const {
      title,
      description,
      allowedRoles,
      redirectUrl,
      issueDescription,
      version,
      priority,
      updateType,
      isActive
    } = req.body;

    // Update fields
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (allowedRoles !== undefined) {
      const validRoles = ['Admin', 'User', 'Mentor'];
      if (!Array.isArray(allowedRoles) || !allowedRoles.every(role => validRoles.includes(role))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid roles specified'
        });
      }
      update.allowedRoles = allowedRoles;
    }
    if (redirectUrl !== undefined) update.redirectUrl = redirectUrl;
    if (issueDescription !== undefined) update.issueDescription = issueDescription;
    if (version !== undefined) update.version = version;
    if (priority !== undefined) update.priority = priority;
    if (updateType !== undefined) update.updateType = updateType;
    if (isActive !== undefined) update.isActive = isActive;

    await update.save();

    // Populate createdBy field for response
    await update.populate('createdBy', 'name username email');

    res.json({
      success: true,
      message: 'Update updated successfully',
      data: update
    });
  } catch (error) {
    console.error('Error updating update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating update',
      error: error.message
    });
  }
});

// DELETE /api/updates/:id - Delete update (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const update = await Update.findById(req.params.id);

    if (!update) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    await Update.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Update deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting update:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting update',
      error: error.message
    });
  }
});

module.exports = router;