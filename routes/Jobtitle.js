
const express = require('express');
const router = express.Router();
const careerController = require('../controllers/JobTitle');

// Job Titles routes
router.post('/job-titles', careerController.addJobTitles);
router.get('/job-titles', careerController.getJobTitles);
router.put('/job-titles/:id', careerController.updateJobTitle);
router.delete('/job-titles/:id', careerController.deleteJobTitle);

// Companies routes
router.post('/companies', careerController.addCompanies);
router.get('/companies', careerController.getCompanies);
router.put('/companies/:id', careerController.updateCompany);
router.delete('/companies/:id', careerController.deleteCompany);

module.exports = router;