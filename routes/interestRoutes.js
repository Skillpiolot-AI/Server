const express = require('express');
const router = express.Router();
const Interest = require('../models/Interest'); // Assuming Interest is a Mongoose model

// Get all interests
router.get('/interests', async (req, res) => {
  try {
    const interests = await Interest.find();
    res.json(interests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new interests
router.post('/interests', async (req, res) => {
  try {
    const interests = req.body.interests;
    const newInterests = await Interest.insertMany(interests.map(name => ({ name })));
    res.json(newInterests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add interests' });
  }
});

// Edit interest
router.put('/interests/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const updatedInterest = await Interest.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.json(updatedInterest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update interest' });
  }
});

// Delete interest
router.delete('/interests/:id', async (req, res) => {
  try {
    await Interest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Interest deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete interest' });
  }
});

module.exports = router;
