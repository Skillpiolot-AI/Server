const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');
const User=require("../models/User")
const { verifyToken } = require('../middleware/auth'); // Assuming you have this middleware


router.post('/register-mentor', mentorController.registerMentor);
router.get('/all-mentors', mentorController.getAllMentors);
router.put('/update-mentor/:id', verifyToken, mentorController.updateMentor);
router.delete('/delete-mentor/:id', verifyToken, mentorController.deleteMentor);

router.get('/mentors', mentorController.getMentors);
router.post('/book-appointment', mentorController.bookAppointment);
router.get('/mentor-appointments/:mentorId', mentorController.getMentorAppointments);
router.put('/schedule-meeting/:appointmentId',  mentorController.scheduleMeeting);
router.get('/user-appointments/:userId',  mentorController.getUserAppointments);
router.put('/complete-session/:appointmentId', verifyToken, mentorController.completeSession);
router.post('/submit-rating', verifyToken, mentorController.submitRating);
router.get('/mentor-feedback/:mentorId', verifyToken, mentorController.getMentorFeedback);
router.get('/all-feedback', mentorController.getAllFeedback);

router.get('/mentors/:id', verifyToken, mentorController.getMentorData);
//router.get('/mentor-appointments/:id', verifyToken, mentorController.getMentorAppointments);
router.get('/mentor-notes/:id', verifyToken, mentorController.getMentorNotes);
router.post('/mentor-notes', verifyToken, mentorController.addMentorNote);


router.get('/job-titles', async (req, res) => {
    try {
      const jobTitles = await User.distinct('jobTitle', { role: 'Mentor' });
      res.json(jobTitles);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
  // Get unique experience levels
  router.get('/experience-levels', async (req, res) => {
    try {
      const experienceLevels = await User.distinct('experience', { role: 'Mentor' });
      res.json(experienceLevels);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
  // Get mentors with optional filtering
  router.get('/mentors', async (req, res) => {
    try {
      const { jobTitle, experience } = req.query;
      let query = { role: 'Mentor' };
      if (jobTitle) query.jobTitle = jobTitle;
      if (experience) query.experience = parseInt(experience);
      
      const mentors = await User.find(query).select('-password');
      res.json(mentors);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
  router.get('/skills', async (req, res) => {
    try {
      const skills = await User.distinct('skills', { role: 'Mentor' });
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
  // Get unique companies
  router.get('/companies', async (req, res) => {
    try {
      const companies = await User.distinct('companiesJoined', { role: 'Mentor' });
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  });


module.exports = router;
