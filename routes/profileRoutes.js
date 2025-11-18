const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { verifyToken } = require('../middleware/auth');


router.get('/', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/', verifyToken, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user._id },
        { $set: req.body },
        { new: true }
      );
    } else {
      profile = new Profile({
        user: req.user._id,
        ...req.body
      });
      await profile.save();
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/project', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    profile.projects.unshift(req.body);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/certification', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    profile.certifications.unshift(req.body);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/goal', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    profile.goals.unshift(req.body);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
