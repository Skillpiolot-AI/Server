// routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const Video = require('../models/videoModel');

// @route POST /api/videos
// @desc Create a new video
router.post('/', async (req, res) => {
  try {
    const { title, youtubeLink } = req.body;
    const newVideo = new Video({ title, youtubeLink });
    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create video', error });
  }
});

// @route GET /api/videos
// @desc Get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve videos', error });
  }
});

// @route PUT /api/videos/:id
// @desc Update a video
router.put('/:id', async (req, res) => {
  try {
    const { title, youtubeLink } = req.body;
    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      { title, youtubeLink },
      { new: true }
    );
    res.json(updatedVideo);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update video', error });
  }
});

// @route DELETE /api/videos/:id
// @desc Delete a video
router.delete('/:id', async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete video', error });
  }
});

module.exports = router;
