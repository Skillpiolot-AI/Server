// routes/priorityDMRoutes.js
// Priority DM inbox routes

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/priorityDMController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// ─── Common ───────────────────────────────────────────────────────────────────
// Mentee starts a new thread
router.post('/dm/start', ctrl.startThread);

// Get a single thread with all messages (auto-marks read)
router.get('/dm/:threadId', ctrl.getThread);

// Send a message in an existing thread
router.post('/dm/:threadId/messages', ctrl.sendMessage);

// Close a thread (mentor only)
router.put('/dm/:threadId/close', ctrl.closeThread);

// ─── Mentor ───────────────────────────────────────────────────────────────────
// Mentor's inbox (all threads they received)
router.get('/dm/inbox/mentor', ctrl.getMentorInbox);

// Unread count badge
router.get('/dm/inbox/unread-count', ctrl.getUnreadCount);

// ─── Mentee ───────────────────────────────────────────────────────────────────
// Mentee's sent threads
router.get('/dm/inbox/mentee', ctrl.getMenteeThreads);

module.exports = router;
