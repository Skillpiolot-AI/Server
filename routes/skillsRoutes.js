const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill'); // Assuming Skill is a Mongoose model

// Get all skills
router.get('/skills', async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new skills
router.post('/skills', async (req, res) => {
  try {
    const skills = req.body.skills;
    const newSkills = await Skill.insertMany(skills.map(name => ({ name })));
    res.json(newSkills);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add skills' });
  }
});

// Edit skill
router.put('/skills/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const updatedSkill = await Skill.findByIdAndUpdate(req.params.id, { name }, { new: true });
    res.json(updatedSkill);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update skill' });
  }
});

// Delete skill
router.delete('/skills/:id', async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete skill' });
  }
});

module.exports = router;
