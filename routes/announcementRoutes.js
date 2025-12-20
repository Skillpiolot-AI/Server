// routes/announcementRoutes.js - Announcement API routes

const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ==========================================
// USER ROUTES (Authenticated) - Must be BEFORE :id routes!
// ==========================================

// Get announcements for current user
router.get('/my', verifyToken, announcementController.getMyAnnouncements);

// Get unread count
router.get('/unread-count', verifyToken, announcementController.getUnreadCount);

// Register push token
router.post('/register-token', verifyToken, announcementController.registerPushToken);

// ==========================================
// ADMIN ROUTES (Authenticated + Admin role)
// ==========================================

const adminAuth = [verifyToken, isAdmin];

// Create announcement
router.post('/', adminAuth, announcementController.createAnnouncement);

// Get all announcements (admin view)
router.get('/', adminAuth, announcementController.getAnnouncements);

// Test notification (send to admin's device)
router.post('/test', adminAuth, announcementController.testNotification);

// Preview recipients count
router.post('/preview-recipients', adminAuth, announcementController.previewRecipients);

// ==========================================
// DYNAMIC :id ROUTES - Must be AFTER static routes!
// ==========================================

// Get single announcement (admin)
router.get('/:id', adminAuth, announcementController.getAnnouncementById);

// Update announcement (admin)
router.put('/:id', adminAuth, announcementController.updateAnnouncement);

// Delete announcement (admin)
router.delete('/:id', adminAuth, announcementController.deleteAnnouncement);

// Send announcement (admin)
router.post('/:id/send', adminAuth, announcementController.sendAnnouncement);

// Mark announcement as read (user)
router.post('/:id/read', verifyToken, announcementController.markAsRead);

module.exports = router;
