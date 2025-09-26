const express = require('express');
const router = express.Router();
const Strength = require('../models/Strength'); // Assuming Strength is a Mongoose model

// Get all strengths
router.get('/strengths', async (req, res) => {
  try {
    const strengths = await Strength.find();
    res.json(strengths);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new strengths
router.post('/strengths', async (req, res) => {
  try {
    const strengths = req.body.strengths;
    const newStrengths = await Strength.insertMany(strengths.map(name => ({ name })));
    res.json(newStrengths);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add strengths' });
  }
});

// Edit strength
router.put('/strengths/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const updatedStrength = await Strength.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.json(updatedStrength);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update strength' });
  }
});

// Delete strength
router.delete('/strengths/:id', async (req, res) => {
  try {
    await Strength.findByIdAndDelete(req.params.id);
    res.json({ message: 'Strength deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete strength' });
  }
});

module.exports = router;
