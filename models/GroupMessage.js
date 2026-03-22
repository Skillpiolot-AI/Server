const mongoose = require('mongoose');

const GroupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String, // Pre-processed via sanitization (xss prevention)
      required: true,
      maxlength: 5000,
    },
    attachments: [
      {
        fileUrl: { type: String },
        fileType: { type: String }, // image, video, doc
        fileName: { type: String },
        fileSize: { type: Number },
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupMessage', // For threads / replies
      default: null,
    },
    isPinned: { type: Boolean, default: false },
    isShoutout: { type: Boolean, default: false },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Self or moderator
  },
  { timestamps: true }
);

// Basic indexes
GroupMessageSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model('GroupMessage', GroupMessageSchema);
