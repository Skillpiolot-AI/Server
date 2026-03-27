const mongoose = require('mongoose');

const GroupCommentSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, maxlength: 10000, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupPost', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupComment', default: null }, // null = top-level
    depth: { type: Number, default: 0, max: 6 }, // max nesting depth = 6
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    score: { type: Number, default: 0 },
    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        reportedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedBody: { type: String, default: '[deleted]' }, // shown when deleted
    repliesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

GroupCommentSchema.index({ post: 1, parent: 1, score: -1 });
GroupCommentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model('GroupComment', GroupCommentSchema);
