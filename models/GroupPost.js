const mongoose = require('mongoose');

const GroupPostSchema = new mongoose.Schema(
  {
    // No title — posts are body-only (Reddit-style)
    body: { type: String, required: true, maxlength: 40000, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    subGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'SubGroup', default: null },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    score: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    flair: { type: String, default: '' },
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

GroupPostSchema.index({ group: 1, createdAt: -1 });
GroupPostSchema.index({ group: 1, score: -1 });
GroupPostSchema.index({ subGroup: 1, createdAt: -1 });

module.exports = mongoose.model('GroupPost', GroupPostSchema);
