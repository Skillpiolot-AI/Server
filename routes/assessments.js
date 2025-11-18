const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');

router.post('/', assessmentController.createAssessment);
router.get('/:id', assessmentController.getAssessment);
router.get('/user/:userId', assessmentController.getUserAssessments);

module.exports = router;
