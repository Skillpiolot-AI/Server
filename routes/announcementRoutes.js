// routes/announcementRoutes.js - Announcement API routes

const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ==========================================
// ADMIN ROUTES (Authenticated + Admin role)
// ==========================================

const adminAuth = [verifyToken, isAdmin];

// Create announcement
router.post('/', adminAuth, announcementController.createAnnouncement);

// Get all announcements (admin view)
router.get('/', adminAuth, announcementController.getAnnouncements);

// Get single announcement
router.get('/:id', adminAuth, announcementController.getAnnouncementById);

// Update announcement
router.put('/:id', adminAuth, announcementController.updateAnnouncement);

// Delete announcement
router.delete('/:id', adminAuth, announcementController.deleteAnnouncement);

// Send announcement
router.post('/:id/send', adminAuth, announcementController.sendAnnouncement);

// Test notification (send to admin's device)
router.post('/test', adminAuth, announcementController.testNotification);

// Preview recipients count
router.post('/preview-recipients', adminAuth, announcementController.previewRecipients);

// ==========================================
// USER ROUTES (Authenticated)
// ==========================================

// Get announcements for current user
router.get('/my', verifyToken, announcementController.getMyAnnouncements);

// Get unread count
router.get('/unread-count', verifyToken, announcementController.getUnreadCount);

// Mark announcement as read
router.post('/:id/read', verifyToken, announcementController.markAsRead);

// Register push token
router.post('/register-token', verifyToken, announcementController.registerPushToken);

module.exports = router;
