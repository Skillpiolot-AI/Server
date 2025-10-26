const UserActivity = require('../models/UserActivity');
const { v4: uuidv4 } = require('uuid');

const logActivity = async (userId, activityType, details = {}) => {
  try {
    await UserActivity.create({
      userId,
      sessionId: details.sessionId || 'manual-' + Date.now(),
      activityType,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

module.exports = { logActivity };
