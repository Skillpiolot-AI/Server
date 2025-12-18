const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { verifyToken } = require('../middleware/auth');

// Public route - create assessment (works with or without auth)
router.post('/', assessmentController.createAssessment);

// Get single assessment
router.get('/:id', assessmentController.getAssessment);

// Legacy route - get by userId string
router.get('/user/:userId', assessmentController.getUserAssessments);

// Protected route - get authenticated user's assessment history with trends
router.get('/me/history', verifyToken, assessmentController.getMyAssessmentHistory);

module.exports = router;
