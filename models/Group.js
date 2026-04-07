const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    avatar: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    type: {
      type: String,
      enum: ['Public', 'Private', 'Invite-only'],
      default: 'Public',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      ageRestriction: { type: Number, default: 0 },
      maxMembers: { type: Number, default: null },
      allowMemberInvites: { type: Boolean, default: false },
      autoModerationEnabled: { type: Boolean, default: true },
      contentFiltering: { type: Boolean, default: true },
      subgroupCreationRequiresApproval: { type: Boolean, default: false },
    },
    rules: [
      {
        title: { type: String },
        description: { type: String },
      },
    ],
    bannedUsers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        bannedAt: { type: Date, default: Date.now },
        bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    mutedUsers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        mutedUntil: { type: Date },
        reason: { type: String },
        mutedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    tags: [{ type: String }],
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupMessage',
      },
    ],
    shoutoutMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupMessage',
      },
    ],
    membersCount: {
      type: Number,
      default: 1,
    },
    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        reportedAt: { type: Date, default: Date.now },
      },
    ],
    mutedNotifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', GroupSchema);
