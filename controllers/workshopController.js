
const Workshop = require('../models/Workshop');
const cloudinary = require('../config/cloudinary');


exports.createWorkshop = async (req, res) => {
  try {
    const workshop = new Workshop({
      title: req.body.title,
      banner: req.body.banner,
      date: req.body.date,
      time: req.body.time,
      location: req.body.location,
      ageGroup: req.body.ageGroup,
      language: req.body.language,
      venueAddress: req.body.venueAddress
    });

    await workshop.save();
    res.status(201).json(workshop);
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while creating the workshop',
      error: error.message
    });
  }
};

exports.getAllWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find();
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (workshop == null) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (workshop == null) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    if (req.body.title != null) {
      workshop.title = req.body.title;
    }
    if (req.file != null) {
      workshop.banner = req.file.path;
    }
    if (req.body.date != null) {
      workshop.date = req.body.date;
    }
    if (req.body.time != null) {
      workshop.time = req.body.time;
    }
    if (req.body.location != null) {
      workshop.location = req.body.location;
    }
    if (req.body.ageGroup != null) {
      workshop.ageGroup = req.body.ageGroup;
    }
    if (req.body.language != null) {
      workshop.language = req.body.language;
    }
    if (req.body.venueAddress != null) {
      workshop.venueAddress = req.body.venueAddress;
    }

    const updatedWorkshop = await workshop.save();
    res.json(updatedWorkshop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (workshop == null) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    await workshop.remove();
    res.json({ message: 'Workshop deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
