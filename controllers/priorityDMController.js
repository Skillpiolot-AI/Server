// controllers/priorityDMController.js
// Handles all Priority DM inbox operations

const PriorityDM = require('../models/PriorityDM');
const MentorService = require('../models/MentorService');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');

// ═══════════════════════════════════════════════════════════════════════════
// MENTEE — OPEN A NEW THREAD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/dm/start
 * Mentee opens a new Priority DM thread with a mentor
 * Body: { mentorId, serviceId, subject, message, couponCode }
 */
exports.startThread = async (req, res) => {
  try {
    const menteeId = req.user._id || req.user.id;
    const { mentorId, serviceId, subject, message, couponCode } = req.body;

    if (!mentorId || !message?.trim()) {
      return res.status(400).json({ error: 'mentorId and message are required' });
    }

    // Verify the service is a priority_dm type
    let service = null;
    let responseDeadline = null;
    let amountPaid = 0;

    if (serviceId) {
      service = await MentorService.findById(serviceId);
      if (service && service.responseTime) {
        // Parse "Within X hours/days" → compute deadline
        const match = service.responseTime.match(/(\d+)\s*(hour|day)/i);
        if (match) {
          const amount = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          const ms = unit === 'hour' ? amount * 3600000 : amount * 86400000;
          responseDeadline = new Date(Date.now() + ms);
        }
        amountPaid = service.price || 0;
      }
    }

    // Get mentor profile id
    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });

    const thread = new PriorityDM({
      menteeId,
      mentorId,
      mentorProfileId: mentorProfile?._id,
      serviceId: service?._id,
      subject: subject?.trim() || 'Priority DM',
      responseDeadline,
      amountPaid,
      couponCode,
      isPaid: amountPaid === 0, // free DMs are auto-marked paid
      unreadByMentor: 1,
    });

    // Add the first message
    thread.messages.push({
      sender: menteeId,
      senderRole: 'mentee',
      content: message.trim(),
    });

    thread.lastMessageAt = new Date();

    await thread.save();

    res.status(201).json({
      success: true,
      message: 'DM thread created',
      threadId: thread._id,
      thread,
    });
  } catch (error) {
    console.error('startThread error:', error);
    res.status(500).json({ error: 'Failed to start DM thread' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SEND A MESSAGE IN AN EXISTING THREAD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/dm/:threadId/messages
 * Send a message in an existing thread (either participant)
 * Body: { content }
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { threadId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

    const thread = await PriorityDM.findById(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    // Check the caller is a participant
    const isMentee = thread.menteeId.toString() === userId.toString();
    const isMentor = thread.mentorId.toString() === userId.toString();

    if (!isMentee && !isMentor) {
      return res.status(403).json({ error: 'Not a participant in this thread' });
    }

    if (thread.status === 'closed' || thread.status === 'expired') {
      return res.status(400).json({ error: 'This thread is closed' });
    }

    const senderRole = isMentor ? 'mentor' : 'mentee';
    await thread.addMessage(userId, senderRole, content.trim());

    const newMsg = thread.messages[thread.messages.length - 1];
    res.status(201).json({ success: true, message: newMsg });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MENTOR — GET INBOX
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dm/inbox
 * Mentor's inbox — threads sorted by last message, with unread count
 * Query: status (open|active|closed|all), page, limit
 */
exports.getMentorInbox = async (req, res) => {
  try {
    const mentorId = req.user._id || req.user.id;
    const { status = 'all', page = 1, limit = 20 } = req.query;

    const query = { mentorId };
    if (status !== 'all') query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await PriorityDM.countDocuments(query);

    const threads = await PriorityDM.find(query)
      .sort({ unreadByMentor: -1, lastMessageAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('menteeId', 'name email imageUrl')
      .populate('serviceId', 'title price serviceType emoji')
      .select('-messages'); // don't load full message history in list view

    // Attach last message preview
    const threadIds = threads.map(t => t._id);
    const fullThreads = await PriorityDM.find({ _id: { $in: threadIds } })
      .select('_id messages');

    const lastMsgMap = {};
    fullThreads.forEach(t => {
      if (t.messages.length > 0) {
        const last = t.messages[t.messages.length - 1];
        lastMsgMap[t._id.toString()] = {
          content: last.content.slice(0, 120),
          senderRole: last.senderRole,
          createdAt: last.createdAt,
        };
      }
    });

    const enriched = threads.map(t => ({
      ...t.toObject(),
      lastMessage: lastMsgMap[t._id.toString()] || null,
    }));

    res.json({ success: true, threads: enriched, pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    console.error('getMentorInbox error:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MENTEE — GET MY THREADS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dm/my-threads
 * Mentee's sent DM threads (to see mentor responses)
 */
exports.getMenteeThreads = async (req, res) => {
  try {
    const menteeId = req.user._id || req.user.id;

    const threads = await PriorityDM.find({ menteeId })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .populate('mentorId', 'name email imageUrl')
      .populate('serviceId', 'title price serviceType emoji')
      .select('-messages');

    res.json({ success: true, threads });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your DM threads' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET FULL THREAD (single conversation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dm/:threadId
 * Full thread with all messages
 * Auto-marks as read for the caller
 */
exports.getThread = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { threadId } = req.params;

    const thread = await PriorityDM.findById(threadId)
      .populate('menteeId', 'name email imageUrl')
      .populate('mentorId', 'name email imageUrl')
      .populate('serviceId', 'title price serviceType emoji responseTime');

    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const isMentee = thread.menteeId._id.toString() === userId.toString();
    const isMentor = thread.mentorId._id.toString() === userId.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isMentee && !isMentor && !isAdmin) {
      return res.status(403).json({ error: 'Not a participant in this thread' });
    }

    // Auto-mark as read
    const role = isMentor ? 'mentor' : 'mentee';
    await thread.markReadBy(role);

    res.json({ success: true, thread });
  } catch (error) {
    console.error('getThread error:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CLOSE A THREAD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PUT /api/dm/:threadId/close
 * Close a thread (mentor or admin only)
 */
exports.closeThread = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { threadId } = req.params;

    const thread = await PriorityDM.findById(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const isMentor = thread.mentorId.toString() === userId.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isMentor && !isAdmin) {
      return res.status(403).json({ error: 'Only the mentor can close a thread' });
    }

    thread.status = 'closed';
    thread.closedAt = new Date();
    await thread.save();

    res.json({ success: true, message: 'Thread closed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close thread' });
  }
};

/**
 * GET /api/dm/unread-count
 * Mentor's total unread DM count (for badge on dashboard)
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const result = await PriorityDM.aggregate([
      { $match: { mentorId: userId, unreadByMentor: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$unreadByMentor' } } },
    ]);
    res.json({ success: true, unreadCount: result[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};
