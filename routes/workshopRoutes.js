// const express = require('express');
// const router = express.Router();
// const workshopController = require('../controllers/workshopController');
// const upload = require('../middleware/upload');

// router.post('/', upload.single('banner'), workshopController.createWorkshop);
// router.get('/', workshopController.getAllWorkshops);
// router.get('/:id', workshopController.getWorkshop);
// router.put('/:id', upload.single('banner'), workshopController.updateWorkshop);
// router.delete('/:id', workshopController.deleteWorkshop);

// // module.exports = router;
// const express = require('express');
// const router = express.Router();
// const workshopController = require('../controllers/workshopController');
// const upload = require('../middleware/upload');

// router.post('/', upload.single('banner'), workshopController.createWorkshop);
// router.get('/', workshopController.getAllWorkshops);
// router.get('/:id', workshopController.getWorkshop);
// router.put('/:id', upload.single('banner'), workshopController.updateWorkshop);
// router.delete('/:id', workshopController.deleteWorkshop);

// module.exports = router;

const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');

router.post('/', workshopController.createWorkshop);
router.get('/', workshopController.getAllWorkshops);
router.get('/:id', workshopController.getWorkshop);
router.put('/:id', workshopController.updateWorkshop);
router.delete('/:id', workshopController.deleteWorkshop);

module.exports = router;