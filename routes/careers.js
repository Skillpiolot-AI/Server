const express = require('express');
const router = express.Router();
const careerController = require('../controllers/CareerResult');

router.get('/recommendations', careerController.getCareerRecommendations);
router.get('/clusters', careerController.getAllClusters);
router.get('/cluster/:cluster', careerController.getCareersByCluster);

module.exports = router;
