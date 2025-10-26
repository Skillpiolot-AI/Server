const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  activityType: {
    type: String,
    required: true,
    activityType: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'page_visit',
        'quiz_taken',
        'career_recommendation_viewed',
        'profile_updated',
        'profile_access', 
        'video_watched',
        'workshop_registered',
        'mentor_appointment',
        'resource_downloaded',
        'community_post',
        'idle_timeout'
      ]
    }

  },
  page: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    default: 0
  }
});

UserActivitySchema.index({ userId: 1, timestamp: -1 });
UserActivitySchema.index({ activityType: 1, timestamp: -1 });
UserActivitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('UserActivity', UserActivitySchema);
