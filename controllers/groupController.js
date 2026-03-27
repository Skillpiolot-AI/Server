const Group = require('../models/Group');
const GroupRole = require('../models/GroupRole');
const GroupMember = require('../models/GroupMember');
const GroupJoinRequest = require('../models/GroupJoinRequest');
const User = require('../models/User');
const xss = require('xss');

// 1. Create a Group
exports.createGroup = async (req, res) => {
  try {
    let { name, description, type, settings, rules, tags } = req.body;
    name = xss(name);
    description = xss(description);

    const newGroup = new Group({
      name,
      description,
      type: type || 'Public',
      owner: req.user._id,
      settings: settings || {},
      rules: rules || [],
      tags: tags || [],
    });

    await newGroup.save();

    // Create default roles
    const adminRole = await GroupRole.create({
      group: newGroup._id,
      name: 'Admin',
      permissions: {
        deleteGroup: true,
        banUser: true,
        postContent: true,
        deleteOthersPosts: true,
        inviteUsers: true,
        pinMessages: true,
        shoutoutMessages: true,
        updateGroupSettings: true,
      },
    });

    const moderatorRole = await GroupRole.create({
      group: newGroup._id,
      name: 'Moderator',
      permissions: {
        deleteGroup: false,
        banUser: true,
        postContent: true,
        deleteOthersPosts: true,
        inviteUsers: true,
        pinMessages: true,
        shoutoutMessages: true,
        updateGroupSettings: false,
      },
    });

    const memberRole = await GroupRole.create({
      group: newGroup._id,
      name: 'Member',
      isDefault: true,
      permissions: {
        deleteGroup: false,
        banUser: false,
        postContent: true,
        deleteOthersPosts: false,
        inviteUsers: false,
        pinMessages: false,
        shoutoutMessages: false,
        updateGroupSettings: false,
      },
    });

    // Add owner as Admin
    await GroupMember.create({
      group: newGroup._id,
      user: req.user._id,
      role: adminRole._id,
    });

    res.status(201).json({ message: 'Group created successfully', group: newGroup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get All Groups (with filtering)
exports.getGroups = async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = {};
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    const groups = await Group.find(query).populate('owner', 'name avatar');
    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Join Group
exports.joinGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Group.findById(groupId);

    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Check if banned
    const isBanned = group.bannedUsers.some(b => b.user.toString() === req.user._id.toString());
    if (isBanned) return res.status(403).json({ error: 'You are banned from this group' });

    // Check membership
    const existingMember = await GroupMember.findOne({ group: groupId, user: req.user._id });
    if (existingMember) return res.status(400).json({ error: 'Already a member' });

    if (group.type === 'Private') {
      // Create Join Request
      const existingReq = await GroupJoinRequest.findOne({
        group: groupId,
        user: req.user._id,
        status: 'Pending',
      });
      if (existingReq) return res.status(400).json({ error: 'Join request already pending' });

      const joinReq = new GroupJoinRequest({
        group: groupId,
        user: req.user._id,
        message: xss(req.body.message || ''),
      });
      await joinReq.save();
      return res.status(200).json({ message: 'Join request sent' });
    } else if (group.type === 'Invite-only') {
      return res.status(403).json({ error: 'This group is invite only' });
    } else {
      // Public group
      const defaultRole = await GroupRole.findOne({ group: groupId, isDefault: true });
      if (!defaultRole) return res.status(500).json({ error: 'Group configuration error' });

      await GroupMember.create({ group: groupId, user: req.user._id, role: defaultRole._id });
      await Group.findByIdAndUpdate(groupId, { $inc: { membersCount: 1 } });
      return res.status(200).json({ message: 'Joined group successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Handle Join Request (Admin/Moderator action, needs auth middleware to protect)
exports.handleJoinRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body; // status: 'Approved' or 'Rejected'
    const request = await GroupJoinRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = status;
    request.handledBy = req.user._id;
    request.handledAt = Date.now();
    await request.save();

    if (status === 'Approved') {
      const defaultRole = await GroupRole.findOne({ group: request.group, isDefault: true });
      await GroupMember.create({ group: request.group, user: request.user, role: defaultRole._id });
      await Group.findByIdAndUpdate(request.group, { $inc: { membersCount: 1 } });
    }
    res.status(200).json({ message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Ban or Kick User
exports.removeUser = async (req, res) => {
  try {
    const { memberId, ban, reason } = req.body;
    const member = await GroupMember.findById(memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const groupId = member.group;
    await GroupMember.findByIdAndDelete(memberId);
    await Group.findByIdAndUpdate(groupId, { $inc: { membersCount: -1 } });

    if (ban) {
      await Group.findByIdAndUpdate(groupId, {
        $push: { bannedUsers: { user: member.user, reason, bannedBy: req.user._id } },
      });
    }

    res.status(200).json({ message: ban ? 'User banned' : 'User kicked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Get My Groups
exports.getMyGroups = async (req, res) => {
  try {
    const memberships = await GroupMember.find({ user: req.user._id }).populate('group');
    const groups = memberships.map(m => m.group).filter(Boolean);
    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. Get Group By ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('owner', 'name avatar');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. Leave Group
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    await GroupMember.deleteOne({ group: groupId, user: req.user._id });
    await Group.findByIdAndUpdate(groupId, { $inc: { membersCount: -1 } });
    res.status(200).json({ message: 'Left group successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9. Get Group Members
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await GroupMember.find({ group: groupId })
      .populate('user', 'name avatar email')
      .populate('role');
    res.status(200).json({ members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 10. Mute User
exports.muteUser = async (req, res) => {
  try {
    const { userId, durationMinutes, reason } = req.body;
    const { groupId } = req.params;

    // Validate duration
    const mins = parseInt(durationMinutes) || 60; // default 1 hour
    const mutedUntil = new Date(Date.now() + mins * 60000);

    await Group.findByIdAndUpdate(groupId, {
      $push: { mutedUsers: { user: userId, mutedUntil, reason, mutedBy: req.user._id } },
    });
    res.status(200).json({ message: 'User muted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 11. Ban User (direct lookup variant to match FE context)
exports.banUserDirect = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const { groupId } = req.params;

    // Delete membership if exists
    await GroupMember.deleteOne({ group: groupId, user: userId });

    await Group.findByIdAndUpdate(groupId, {
      $inc: { membersCount: -1 },
      $push: { bannedUsers: { user: userId, reason, bannedBy: req.user._id } },
    });

    res.status(200).json({ message: 'User banned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 12. Update Group (Admin)
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, type, settings } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (name) group.name = xss(name);
    if (description) group.description = xss(description);
    if (type) group.type = type;
    if (settings) {
      group.settings = {
        ...group.settings,
        ...settings,
      };
    }

    await group.save();
    res.status(200).json({ message: 'Group updated successfully', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
