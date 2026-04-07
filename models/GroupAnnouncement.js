const mongoose = require('mongoose');

const GroupAnnouncementSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // 'message' = admin sent manually; 'settings_change' = auto-generated on setting update
    type: {
      type: String,
      enum: ['message', 'settings_change'],
      default: 'message',
    },
    // For settings_change: stores what changed e.g. { field: 'type', from: 'Public', to: 'Private' }
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

GroupAnnouncementSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model('GroupAnnouncement', GroupAnnouncementSchema);
