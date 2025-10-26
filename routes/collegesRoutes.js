const express = require('express');
const router = express.Router();
const College = require('../models/College'); // Assuming College is a Mongoose model

// Get all colleges
router.get('/colleges', async (req, res) => {
  try {
    const colleges = await College.find();
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new colleges
router.post('/colleges', async (req, res) => {
  try {
    const colleges = req.body.colleges;
    const newColleges = await College.insertMany(colleges.map(name => ({ name })));
    res.json(newColleges);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add colleges' });
  }
});

// Edit college
router.put('/colleges/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const updatedCollege = await College.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.json(updatedCollege);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update college' });
  }
});

// Delete college
router.delete('/colleges/:id', async (req, res) => {
  try {
    await College.findByIdAndDelete(req.params.id);
    res.json({ message: 'College deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete college' });
  }
});

module.exports = router;
