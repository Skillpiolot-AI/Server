const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');

router.post('/insert', careerController.insertCareerData);


router.get('/options', careerController.getInterestsAndStrengths);
router.post('/suggestions', careerController.getCareerSuggestions);
router.get('/job-titles', careerController.getAllJobTitles);
router.get('/suggestion', careerController.getCareerSuggestion);
router.get('/check-job-title', careerController.checkJobTitleExists);


router.post('/', careerController.createCareer);
router.put('/:id', careerController.updateCareer);
router.delete('/:id', careerController.deleteCareer);
router.get('/:id', careerController.getCareer);
router.get('/', careerController.getAllCareers);


module.exports = router;