const mongoose = require('mongoose');

const GroupMemberSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupRole',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    strikes: {
      type: Number,
      default: 0,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

GroupMemberSchema.index({ group: 1, user: 1 }, { unique: true }); // A user can only join a group once

module.exports = mongoose.model('GroupMember', GroupMemberSchema);
