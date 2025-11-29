const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const { verifyToken } = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Analytics overview with time-based data
router.get('/overview', verifyToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const lastYear = new Date(now - 365 * 24 * 60 * 60 * 1000);

    const totalUsers = await User.countDocuments();

    // New users by time period
    const newUsers24h = await User.countDocuments({ createdAt: { $gte: last24h } });
    const newUsersWeek = await User.countDocuments({ createdAt: { $gte: lastWeek } });
    const newUsersMonth = await User.countDocuments({ createdAt: { $gte: lastMonth } });
    const newUsersYear = await User.countDocuments({ createdAt: { $gte: lastYear } });

    // Active users (logged in within time period)
    const activeUsers24h = await UserActivity.distinct('userId', {
      activityType: 'login',
      timestamp: { $gte: last24h }
    });

    const activeUsersWeek = await UserActivity.distinct('userId', {
      activityType: 'login',
      timestamp: { $gte: lastWeek }
    });

    const activeUsersMonth = await UserActivity.distinct('userId', {
      activityType: 'login',
      timestamp: { $gte: lastMonth }
    });

    const activeUsersYear = await UserActivity.distinct('userId', {
      activityType: 'login',
      timestamp: { $gte: lastYear }
    });

    res.json({
      overview: {
        totalUsers,
        newUsers: {
          last24h: newUsers24h,
          lastWeek: newUsersWeek,
          lastMonth: newUsersMonth,
          lastYear: newUsersYear
        },
        activeUsers: {
          last24h: activeUsers24h.length,
          lastWeek: activeUsersWeek.length,
          lastMonth: activeUsersMonth.length,
          lastYear: activeUsersYear.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get users with activity data
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, timeframe = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let timeFilter = {};
    const now = new Date();

    switch(timeframe) {
    case '24h':
      timeFilter = { createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
      break;
    case 'week':
      timeFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
      break;
    case 'month':
      timeFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
      break;
    case 'year':
      timeFilter = { createdAt: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
      break;
    }

    const users = await User.find(timeFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const usersWithActivity = await Promise.all(users.map(async (user) => {
      const lastLogin = await UserActivity.findOne({
        userId: user._id,
        activityType: 'login'
      }).sort({ timestamp: -1 });

      const activityCount = await UserActivity.countDocuments({ userId: user._id });
      const sessionCount = await UserActivity.distinct('sessionId', { userId: user._id });

      return {
        ...user.toObject(),
        lastLogin: lastLogin ? lastLogin.timestamp : null,
        totalActivities: activityCount,
        totalSessions: sessionCount.length
      };
    }));

    const totalUsers = await User.countDocuments(timeFilter);

    res.json({
      users: usersWithActivity,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});


// Add these routes to your analyticsRoutes.js

// Get activity statistics
router.get('/activity-stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    const now = new Date();
    let timeFilter = {};

    switch(timeframe) {
    case '24h':
      timeFilter = { timestamp: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
      break;
    case 'week':
      timeFilter = { timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
      break;
    case 'month':
      timeFilter = { timestamp: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
      break;
    case 'year':
      timeFilter = { timestamp: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
      break;
    default:
      timeFilter = {};
    }

    const activityStats = await UserActivity.aggregate([
      { $match: timeFilter },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          activityType: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ activityStats });
  } catch (error) {
    console.error('Activity stats error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get login patterns
router.get('/login-patterns', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    const now = new Date();
    let timeFilter = {};

    switch(timeframe) {
    case '24h':
      timeFilter = { timestamp: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
      break;
    case 'week':
      timeFilter = { timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
      break;
    case 'month':
      timeFilter = { timestamp: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
      break;
    case 'year':
      timeFilter = { timestamp: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
      break;
    default:
      timeFilter = {};
    }

    const loginPatterns = await UserActivity.aggregate([
      {
        $match: {
          activityType: 'login',
          ...timeFilter
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
              hour: '$_id.hour'
            }
          },
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({ loginPatterns });
  } catch (error) {
    console.error('Login patterns error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get user activity details
router.get('/users/:userId/activity', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 'week', page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;
    const now = new Date();
    let timeFilter = {};

    switch(timeframe) {
    case '24h':
      timeFilter = { timestamp: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
      break;
    case 'week':
      timeFilter = { timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
      break;
    case 'month':
      timeFilter = { timestamp: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
      break;
    case 'year':
      timeFilter = { timestamp: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
      break;
    default:
      timeFilter = {};
    }

    const activities = await UserActivity.find({
      userId,
      ...timeFilter
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name username email');

    const totalActivities = await UserActivity.countDocuments({
      userId,
      ...timeFilter
    });

    res.json({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / limit),
        totalActivities,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});



module.exports = router;
