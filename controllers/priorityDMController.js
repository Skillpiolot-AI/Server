// controllers/priorityDMController.js
// Handles all Priority DM inbox operations

const PriorityDM = require('../models/PriorityDM');
const MentorService = require('../models/MentorService');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');

// ─── Shortcut message templates ────────────────────────────────────────────
const SHORTCUT_SUGGESTIONS = {
  mentee: [
    'Hi! I have a question about career guidance.',
    'Could you review my resume and give feedback?',
    'I need help preparing for interviews.',
    'What resources do you recommend for getting started?',
    'Can you help me with my project approach?',
    'I\'m stuck on a problem — could you help?',
    'Thank you for the great advice!',
    'When would be a good time for a follow-up?',
  ],
  mentor: [
    'Hi! Thanks for reaching out. Let me help you.',
    'Great question! Here\'s what I suggest:',
    'I\'ve reviewed your profile. Here are my thoughts:',
    'Let me share some resources with you.',
    'I\'d recommend focusing on these areas:',
    'Excellent progress! Keep it up.',
    'Let\'s schedule a call to discuss this further.',
    'Feel free to ask any follow-up questions!',
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function parseResponseTime(responseTime) {
  if (!responseTime) return 48 * 3600000; // default 48 hours
  const match = responseTime.match(/(\d+)\s*(hour|day|week|month)/i);
  if (!match) return 48 * 3600000;
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'hour': return amount * 3600000;
    case 'day': return amount * 86400000;
    case 'week': return amount * 7 * 86400000;
    case 'month': return amount * 30 * 86400000;
    default: return 48 * 3600000;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MENTEE — OPEN A NEW THREAD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/dm/start
 * Mentee opens a new Priority DM thread with a mentor
 * Body: { mentorId, serviceId, subject, message, couponCode }
 * Timer does NOT start now — only when mentor first replies.
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
    let serviceDurationMs = 0;
    let responseDeadline = null;
    let amountPaid = 0;

    if (serviceId) {
      service = await MentorService.findById(serviceId);
      if (service) {
        // Calculate service duration from subscriptionMonths or responseTime
        if (service.subscriptionMonths && service.subscriptionMonths > 0) {
          serviceDurationMs = service.subscriptionMonths * 30 * 86400000; // months → ms
        } else {
          serviceDurationMs = parseResponseTime(service.responseTime);
        }

        // Calculate response deadline (mentor should respond within this time)
        const deadlineMs = parseResponseTime(service.responseTime);
        responseDeadline = new Date(Date.now() + deadlineMs);

        amountPaid = service.price || 0;
      }
    }

    // Get mentor profile id
    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });

    // Find previous thread between same mentee+mentor (for history linking, within 30 days)
    let previousThreadId = null;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const previousThread = await PriorityDM.findOne({
      menteeId,
      mentorId,
      status: { $in: ['closed', 'expired'] },
      lastMessageAt: { $gte: thirtyDaysAgo },
    }).sort({ lastMessageAt: -1 }).select('_id');

    if (previousThread) {
      previousThreadId = previousThread._id;
    }

    const thread = new PriorityDM({
      menteeId,
      mentorId,
      mentorProfileId: mentorProfile?._id,
      serviceId: service?._id,
      subject: subject?.trim() || 'Priority DM',
      serviceDurationMs,
      responseDeadline,
      previousThreadId,
      amountPaid,
      couponCode,
      isPaid: amountPaid === 0, // free DMs are auto-marked paid
      unreadByMentor: 1,
      // expiresAt is NOT set here — it's set when mentor first replies
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
      message: 'DM thread created. Timer will start when mentor replies.',
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
 * Timer starts on mentor's FIRST reply via model's addMessage()
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
      return res.status(400).json({ error: 'This thread is closed/expired. Start a new DM to continue.' });
    }

    // Check if thread has expired by time
    if (thread.expiresAt && new Date() > thread.expiresAt) {
      thread.status = 'expired';
      thread.closedAt = new Date();
      await thread.save();
      return res.status(400).json({ error: 'This thread has expired. Start a new DM to continue.' });
    }

    const senderRole = isMentor ? 'mentor' : 'mentee';
    await thread.addMessage(userId, senderRole, content.trim());

    const newMsg = thread.messages[thread.messages.length - 1];
    res.status(201).json({
      success: true,
      message: newMsg,
      expiresAt: thread.expiresAt,
      status: thread.status,
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MENTOR — GET INBOX
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dm/inbox/mentor
 * Mentor's inbox — threads sorted by last message, with unread count
 * Query: status (open|active|closed|expired|all), page, limit
 */
exports.getMentorInbox = async (req, res) => {
  try {
    const mentorId = req.user._id || req.user.id;
    const { status = 'all', page = 1, limit = 30 } = req.query;

    const query = { mentorId };
    if (status !== 'all') query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await PriorityDM.countDocuments(query);

    const threads = await PriorityDM.find(query)
      .sort({ unreadByMentor: -1, lastMessageAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('menteeId', 'name email imageUrl')
      .populate('serviceId', 'title price serviceType emoji responseTime subscriptionMonths')
      .select('-messages'); // don't load full message history in list view

    // Attach last message preview
    const threadIds = threads.map(t => t._id);
    const fullThreads = await PriorityDM.find({ _id: { $in: threadIds } }).select('_id messages');

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

    res.json({
      success: true,
      threads: enriched,
      pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('getMentorInbox error:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MENTEE — GET MY THREADS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dm/inbox/mentee
 * Mentee's sent DM threads (to see mentor responses)
 */
exports.getMenteeThreads = async (req, res) => {
  try {
    const menteeId = req.user._id || req.user.id;

    const threads = await PriorityDM.find({ menteeId })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .populate('mentorId', 'name email imageUrl')
      .populate('mentorProfileId', 'displayName profileImage handle')
      .populate('serviceId', 'title price serviceType emoji responseTime subscriptionMonths')
      .select('-messages');

    // Attach last message preview
    const threadIds = threads.map(t => t._id);
    const fullThreads = await PriorityDM.find({ _id: { $in: threadIds } }).select('_id messages');
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

    res.json({ success: true, threads: enriched });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your DM threads' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET FULL THREAD (single conversation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dm/:threadId
 * Full thread with all messages.
 * Auto-marks as read for the caller.
 * Also checks and updates expiry status.
 */
exports.getThread = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { threadId } = req.params;

    const thread = await PriorityDM.findById(threadId)
      .populate('menteeId', 'name email imageUrl')
      .populate('mentorId', 'name email imageUrl')
      .populate('serviceId', 'title price serviceType emoji responseTime subscriptionMonths');

    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const isMentee = thread.menteeId._id.toString() === userId.toString();
    const isMentor = thread.mentorId._id.toString() === userId.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isMentee && !isMentor && !isAdmin) {
      return res.status(403).json({ error: 'Not a participant in this thread' });
    }

    // Check if thread should be expired
    if (thread.expiresAt && new Date() > thread.expiresAt && thread.status === 'active') {
      thread.status = 'expired';
      thread.closedAt = new Date();
      await thread.save();
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
// GET CHAT HISTORY (previous thread between same participants)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dm/:threadId/history
 * Returns messages from the previous linked thread (if within 30 days)
 */
exports.getThreadHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { threadId } = req.params;

    const thread = await PriorityDM.findById(threadId).select('menteeId mentorId previousThreadId');
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const isMentee = thread.menteeId.toString() === userId.toString();
    const isMentor = thread.mentorId.toString() === userId.toString();
    if (!isMentee && !isMentor) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    if (!thread.previousThreadId) {
      return res.json({ success: true, previousMessages: [], hasPreviousThread: false });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const prevThread = await PriorityDM.findOne({
      _id: thread.previousThreadId,
      lastMessageAt: { $gte: thirtyDaysAgo },
    })
      .populate('menteeId', 'name imageUrl')
      .populate('mentorId', 'name imageUrl')
      .select('messages subject createdAt closedAt lastMessageAt status');

    if (!prevThread) {
      return res.json({ success: true, previousMessages: [], hasPreviousThread: false });
    }

    res.json({
      success: true,
      hasPreviousThread: true,
      previousThread: {
        subject: prevThread.subject,
        createdAt: prevThread.createdAt,
        closedAt: prevThread.closedAt,
        status: prevThread.status,
        messages: prevThread.messages,
      },
    });
  } catch (error) {
    console.error('getThreadHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SHORTCUT MESSAGE SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dm/suggestions
 * Returns shortcut message templates for both roles
 */
exports.getSuggestions = (req, res) => {
  const userId = req.user._id || req.user.id;
  const role = req.query.role || 'mentee';
  res.json({
    success: true,
    suggestions: SHORTCUT_SUGGESTIONS[role] || SHORTCUT_SUGGESTIONS.mentee,
  });
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
 * GET /api/dm/inbox/unread-count
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
