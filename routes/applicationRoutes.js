
// Server/routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

router.post('/submit-application', applicationController.submitApplication);
router.get('/applications', applicationController.getApplications);
router.put('/applications/:id/status', applicationController.updateApplicationStatus);
// Add this new route to the existing routes
router.get('/track/:trackingId', applicationController.getApplicationByTrackingId);

module.exports = router;
