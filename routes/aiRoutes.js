const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');

/**
 * Generic content generation for the frontend.
 * Use verifyToken for security.
 */
router.post('/generate', verifyToken, aiController.generateContent);
router.post('/career-prediction', aiController.generatePrediction);

module.exports = router;
