const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { verifyToken } = require('../middleware/auth');

// Chat endpoint - works with or without auth
router.post('/chat', chatbotController.chat);

// Get quick suggestions
router.get('/suggestions', chatbotController.getSuggestions);

module.exports = router;
