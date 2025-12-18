const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get user context for chatbot
router.get('/context', chatbotController.getUserContext);

// Get career recommendations
router.get('/careers', chatbotController.getCareerRecommendations);

// Get mentors
router.get('/mentors', chatbotController.getMentors);

// Get colleges
router.get('/colleges', chatbotController.getColleges);

// Get workshops
router.get('/workshops', chatbotController.getWorkshops);

// Book mentor appointment
router.post('/book-mentor', chatbotController.bookMentorAppointment);

// Save chat history
router.post('/save-history', chatbotController.saveChatHistory);

module.exports = router;