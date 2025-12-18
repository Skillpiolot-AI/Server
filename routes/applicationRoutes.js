// Server/routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ==========================================
// PUBLIC ROUTES - No authentication required
// ==========================================

// Submit a new mentor application
router.post('/submit-application', applicationController.submitApplication);

// Track application status by tracking ID
router.get('/track/:trackingId', applicationController.getApplicationByTrackingId);

// Respond to more info request (applicant submits additional info)
router.post('/respond-info/:trackingId', applicationController.respondToInfoRequest);

// ==========================================
// VERIFICATION ROUTES - For approved mentors
// ==========================================

// Verify email via token link
router.get('/verify-email/:token', applicationController.verifyMentorEmail);

// Send verification email (authenticated)
router.post('/send-verification-email', verifyToken, applicationController.sendVerificationEmail);

// Send phone OTP (authenticated)
router.post('/send-phone-otp', verifyToken, applicationController.sendPhoneOTP);

// Verify phone OTP (authenticated)
router.post('/verify-phone-otp', verifyToken, applicationController.verifyPhoneOTP);

// Get verification status (authenticated)
router.get('/verification-status/:mentorId', verifyToken, applicationController.getVerificationStatus);

// ==========================================
// ADMIN ROUTES - Admin authentication required
// ==========================================

// Middleware to check admin role
const adminAuth = [verifyToken, isAdmin];

// Get all applications with filters and pagination
router.get('/admin/applications', adminAuth, applicationController.getApplications);

// Get application statistics for dashboard
router.get('/admin/stats', adminAuth, applicationController.getApplicationStats);

// Get single application details
router.get('/admin/applications/:id', adminAuth, applicationController.getApplicationById);

// Approve application and create mentor account
router.put('/admin/applications/:id/approve', adminAuth, applicationController.approveApplication);

// Reject application with reason
router.put('/admin/applications/:id/reject', adminAuth, applicationController.rejectApplication);

// Request more information from applicant
router.put('/admin/applications/:id/request-info', adminAuth, applicationController.requestMoreInfo);

// ==========================================
// LEGACY ROUTES - For backward compatibility
// ==========================================

// Legacy: Get all applications (redirects to admin route behavior)
router.get('/applications', verifyToken, applicationController.getApplications);

// Legacy: Update application status
router.put('/applications/:id/status', adminAuth, applicationController.updateApplicationStatus);

module.exports = router;
