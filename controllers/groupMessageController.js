const GroupMessage = require('../models/GroupMessage');
const Group = require('../models/Group');
const xss = require('xss');

// 1. Post a new Message
exports.postMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    let { content, replyTo, mentions, attachments } = req.body;

    // XSS Sanitization
    content = xss(content);

    // Check if user is muted
    const group = await Group.findById(groupId);
    const isMuted = group.mutedUsers.some(
      m => m.user.toString() === req.user._id.toString() && new Date(m.mutedUntil) > new Date()
    );
    if (isMuted) return res.status(403).json({ error: 'You are muted in this group' });

    const message = new GroupMessage({
      group: groupId,
      sender: req.user._id,
      content,
      replyTo: replyTo || null,
      mentions: mentions || [],
      attachments: attachments || [],
    });

    await message.save();

    // Socket.io event would go here to notify members
    // e.g. req.io.to(groupId).emit('new-message', message);

    res.status(201).json({ message: 'Message posted', data: message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get Messages
exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await GroupMessage.find({ group: groupId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name avatar')
      .populate('replyTo');

    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Delete a Message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await GroupMessage.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // If not their own, check 'deleteOthersPosts'
    if (message.sender.toString() !== req.user._id.toString()) {
      if (!req.groupMember.role.permissions.deleteOthersPosts) {
        return res.status(403).json({ error: 'Permission denied to delete others posts' });
      }
    }

    message.isDeleted = true;
    message.deletedBy = req.user._id;
    await message.save();

    res.status(200).json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Pin/Shoutout a Message
exports.togglePinshoutout = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { action } = req.body; // 'pin' or 'shoutout'
    const message = await GroupMessage.findById(messageId);

    if (action === 'pin' && req.groupMember.role.permissions.pinMessages) {
      message.isPinned = !message.isPinned;
      await message.save();
      // Add or remove from Group's pinned list
      if (message.isPinned) {
        await Group.findByIdAndUpdate(message.group, { $addToSet: { pinnedMessages: messageId } });
      } else {
        await Group.findByIdAndUpdate(message.group, { $pull: { pinnedMessages: messageId } });
      }
      return res.status(200).json({ message: 'Pin toggled', isPinned: message.isPinned });
    }

    if (action === 'shoutout' && req.groupMember.role.permissions.shoutoutMessages) {
      message.isShoutout = !message.isShoutout;
      await message.save();
      return res.status(200).json({ message: 'Shoutout toggled', isShoutout: message.isShoutout });
    }

    res.status(403).json({ error: 'Action not allowed or permission denied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
