// server/routes/collegeRoutes.js

const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

// Get filtered colleges
router.get('/filter', collegeController.getFilteredColleges);

// Get filter options
router.get('/filter-options', collegeController.getFilterOptions);

// Get college by ID
router.get('/:id', collegeController.getCollegeById);

module.exports = router;

// ============================================
// ADD TO server.js:
// ============================================
// const collegeRoutes = require('./routes/collegeRoutes');
// app.use('/api/colleges', collegeRoutes);