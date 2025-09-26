// // routes/resourceRoutes.js
// const express = require('express');
// const router = express.Router();
// const upload = require('../middleware/upload');
// const resourceController = require('../controllers/resourceController');

// router.post('/resources', upload.single('pdfFile'), resourceController.addResource);
// router.get('/resources', resourceController.getResources);
// router.get('/resources/:id/download', resourceController.downloadResource);

// module.exports = router;

const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

router.post('/resources', resourceController.addResource);
router.get('/resources', resourceController.getResources);
router.get('/resources/:id/download', resourceController.downloadResource);

module.exports = router;