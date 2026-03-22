const GroupMember = require('../models/GroupMember');
const GroupRole = require('../models/GroupRole');
const Group = require('../models/Group');

exports.checkGroupPermission = permissionRequired => {
  return async (req, res, next) => {
    try {
      // Find the group based on params or body
      const groupId = req.params.groupId || req.body.groupId;
      if (!groupId) return res.status(400).json({ error: 'Group ID is missing' });

      // Find if user is a member
      const member = await GroupMember.findOne({
        group: groupId,
        user: req.user._id,
      }).populate('role');

      // If user isn't a member but checking if they are the owner etc.
      // Usually the owner is an Admin
      if (!member) return res.status(403).json({ error: 'You are not a member of this group' });

      if (permissionRequired) {
        if (!member.role.permissions[permissionRequired]) {
          return res
            .status(403)
            .json({ error: `You don't have the permission: ${permissionRequired}` });
        }
      }

      // Pass member details to next
      req.groupMember = member;
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
