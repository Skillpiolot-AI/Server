// routes/bookingRoutes.js - Mentorship booking API routes

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, isAdmin, isMentor } = require('../middleware/auth');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get available time slots for a mentor on a specific date
router.get('/available-slots/:mentorProfileId', bookingController.getAvailableSlots);

// Get meeting link page data (token-based, no auth required)
router.get('/send-link-page/:token', bookingController.getMeetingLinkPage);

// Submit meeting link via token (for email-based flow)
router.post('/public/send-link', bookingController.sendMeetingLink);

// ==========================================
// USER ROUTES (Authenticated)
// ==========================================

// Create a new booking
router.post('/book', verifyToken, bookingController.createBooking);

// Get user's bookings
router.get('/my-bookings', verifyToken, bookingController.getUserBookings);

// Get single booking details
router.get('/:bookingId', verifyToken, bookingController.getBookingById);

// Cancel a booking
router.put('/:bookingId/cancel', verifyToken, bookingController.cancelBooking);

// Submit rating for completed booking
router.post('/:bookingId/rate', verifyToken, bookingController.rateBooking);

// Respond to reschedule (select a proposed slot)
router.put('/:bookingId/reschedule-respond', verifyToken, bookingController.respondToReschedule);

// ==========================================
// MENTOR ROUTES (Authenticated + Mentor role)
// ==========================================

// Middleware to check mentor role
const mentorAuth = [verifyToken, isMentor];

// Get mentor's sessions
router.get('/mentor/sessions', mentorAuth, bookingController.getMentorBookings);

// Send meeting link to student
router.post('/mentor/:bookingId/send-link', mentorAuth, bookingController.sendMeetingLink);

// Mark session as complete
router.put('/mentor/:bookingId/complete', mentorAuth, bookingController.completeSession);

// Request reschedule (mentor proposes 3-5 time slots)
router.put('/mentor/:bookingId/reschedule', mentorAuth, bookingController.requestReschedule);

// Get student profile for a booking
router.get('/mentor/:bookingId/student-profile', mentorAuth, bookingController.getStudentProfile);

// Submit mentor feedback for completed session
router.post('/mentor/:bookingId/feedback', mentorAuth, bookingController.submitMentorFeedback);

// ==========================================
// ADMIN ROUTES (Authenticated + Admin role)
// ==========================================

// Middleware to check admin role
const adminAuth = [verifyToken, isAdmin];

// Get system settings
router.get('/admin/settings', adminAuth, bookingController.getSystemSettings);

// Update system settings (toggle free mentorship, etc.)
router.put('/admin/settings', adminAuth, bookingController.updateSystemSettings);

// Get all bookings (with filters)
router.get('/admin/all-bookings', adminAuth, bookingController.getAllBookings);

module.exports = router;
