// routes/mentorServicesRoutes.js
// Routes for Topmate-style mentor services, coupons, custom profile sections, and public search

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mentorServicesController');
const { verifyToken, isMentor } = require('../middleware/auth');

// Multer setup for image uploads (reuse existing uploads dir)
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'section-' + unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES — no auth needed
// ─────────────────────────────────────────────────────────────────────────────

// Mentor search with filters (q, domain, serviceType, minRating, maxPrice, sort, page, limit)
router.get('/mentor/search', ctrl.searchMentors);

// Full public mentor profile by handle or userId
router.get('/mentor/profile/:handle', ctrl.getMentorPublicProfile);

// All active services for a mentor (public facing)
router.get('/mentor/services/:mentorId', ctrl.getMentorServices);

// Validate + calculate a coupon (called at checkout — user must be logged in)
router.post('/coupons/validate', verifyToken, ctrl.validateCoupon);

// Submit an application to become a mentor (called by logged-in User)
router.post('/mentor/register', verifyToken, ctrl.applyToBeMentor);

// ─────────────────────────────────────────────────────────────────────────────

// MENTOR-ONLY ROUTES — authenticated + must be a mentor
// ─────────────────────────────────────────────────────────────────────────────

const mentorAuth = [verifyToken, isMentor];

// ── Service management ────────────────────────────────────────────────────────
router.post('/mentor/services', mentorAuth, ctrl.createService);
router.get('/mentor/services/my', mentorAuth, ctrl.getMyServices);
router.put('/mentor/services/reorder', mentorAuth, ctrl.reorderServices);
router.put('/mentor/services/:serviceId', mentorAuth, ctrl.updateService);
router.put('/mentor/services/:serviceId/toggle', mentorAuth, ctrl.toggleService);
router.delete('/mentor/services/:serviceId', mentorAuth, ctrl.deleteService);

// ── Coupon management ─────────────────────────────────────────────────────────
router.post('/mentor/coupons', mentorAuth, ctrl.createCoupon);
router.get('/mentor/coupons', mentorAuth, ctrl.getMyCoupons);
router.put('/mentor/coupons/:id', mentorAuth, ctrl.updateCoupon);
router.delete('/mentor/coupons/:id', mentorAuth, ctrl.deleteCoupon);

// ── Custom profile sections ───────────────────────────────────────────────────
router.post('/mentor/profile/sections', mentorAuth, ctrl.addCustomSection);
router.put('/mentor/profile/sections/:sectionId', mentorAuth, ctrl.updateCustomSection);
router.delete('/mentor/profile/sections/:sectionId', mentorAuth, ctrl.deleteCustomSection);

// Image upload for custom sections (multipart/form-data, field: 'image')
router.post(
  '/mentor/profile/upload-image',
  mentorAuth,
  upload.single('image'),
  ctrl.uploadSectionImage
);

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR STATUS — any logged-in mentor/pending user can check their own status
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mentor/my-status', verifyToken, ctrl.getMyMentorStatus);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES — approve / reject mentor applications
// ─────────────────────────────────────────────────────────────────────────────
const { adminOnly } = require('../middleware/auth');

router.get('/admin/mentor-applications', verifyToken, adminOnly, ctrl.adminListMentorApplications);
router.post(
  '/admin/mentor-applications/:userId/approve',
  verifyToken,
  adminOnly,
  ctrl.adminApproveMentor
);
router.post(
  '/admin/mentor-applications/:userId/reject',
  verifyToken,
  adminOnly,
  ctrl.adminRejectMentor
);

module.exports = router;
