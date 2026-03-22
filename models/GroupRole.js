const mongoose = require('mongoose');

const GroupRoleSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    name: {
      type: String, // 'Admin', 'Moderator', 'Member', 'Guest', or custom
      required: true,
    },
    permissions: {
      deleteGroup: { type: Boolean, default: false },
      banUser: { type: Boolean, default: false },
      postContent: { type: Boolean, default: true },
      deleteOthersPosts: { type: Boolean, default: false },
      inviteUsers: { type: Boolean, default: false },
      pinMessages: { type: Boolean, default: false },
      shoutoutMessages: { type: Boolean, default: false },
      updateGroupSettings: { type: Boolean, default: false },
    },
    isDefault: {
      type: Boolean,
      default: false, // E.g. default 'Member' role when someone joins
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroupRole', GroupRoleSchema);
