// routes/priorityDMRoutes.js
// Priority DM inbox routes

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/priorityDMController');
const { verifyToken } = require('../middleware/auth');

// ─── Common ───────────────────────────────────────────────────────────────────
// Mentee starts a new thread
router.post('/dm/start', verifyToken, ctrl.startThread);

// Get shortcut message suggestions
router.get('/dm/suggestions', verifyToken, ctrl.getSuggestions);

// Get a single thread with all messages (auto-marks read)
router.get('/dm/:threadId', verifyToken, ctrl.getThread);

// Get previous thread history (linked via previousThreadId, ≤30 days)
router.get('/dm/:threadId/history', verifyToken, ctrl.getThreadHistory);

// Send a message in an existing thread
router.post('/dm/:threadId/messages', verifyToken, ctrl.sendMessage);

// Close a thread (mentor only)
router.put('/dm/:threadId/close', verifyToken, ctrl.closeThread);

// ─── Mentor ───────────────────────────────────────────────────────────────────
// Mentor's inbox (all threads they received)
router.get('/dm/inbox/mentor', verifyToken, ctrl.getMentorInbox);

// Unread count badge
router.get('/dm/inbox/unread-count', verifyToken, ctrl.getUnreadCount);

// ─── Mentee ───────────────────────────────────────────────────────────────────
// Mentee's sent threads
router.get('/dm/inbox/mentee', verifyToken, ctrl.getMenteeThreads);

module.exports = router;
