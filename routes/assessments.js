const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { verifyToken } = require('../middleware/auth');

// Public route - create assessment (works with or without auth)
router.post('/', assessmentController.createAssessment);

// Protected route - get authenticated user's assessment history with trends
// MUST be before /:id so Express doesn't treat 'me' as a MongoDB id param
router.get('/me/history', verifyToken, assessmentController.getMyAssessmentHistory);

// Legacy route - get by userId string
// MUST also be before /:id
router.get('/user/:userId', assessmentController.getUserAssessments);

// Get single assessment by MongoDB ObjectId
router.get('/:id', assessmentController.getAssessment);

module.exports = router;
