
// controllers/mentorController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const emailjs = require('@emailjs/nodejs');
const MentorAppointment = require('../models/Mentor');
const mongoose = require('mongoose');

emailjs.init({
  publicKey: 'VtWNYb9AxIQiQsP_s',
  privateKey: 'mrFJw2Q0Hj6tCJ9pd-rPE'
});



exports.registerMentor = async (req, res) => {
  const { name, email, phoneNumber, jobTitle, companiesJoined, experience, password, username, imageUrl } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newMentor = new User({
      username,
      name,
      email,
      phoneNumber,
      jobTitle,
      companiesJoined,
      experience,
      password: hashedPassword,
      role: 'Mentor',
      imageUrl,
    });

    await newMentor.save();

    // ... rest of the function ...
  } catch (error) {
    console.error('Error during mentor registration:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'Mentor' }).select('-password');
    res.json(mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedMentor = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    
    if (!updatedMentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    res.json(updatedMentor);
  } catch (error) {
    console.error('Error updating mentor:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
exports.deleteMentor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedMentor = await User.findByIdAndDelete(id);
    
    if (!deletedMentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    
    res.json({ message: 'Mentor deleted successfully' });
  } catch (error) {
    console.error('Error deleting mentor:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.getMentors = async (req, res) => {
    try {
      const { jobTitle, experience } = req.query;
      let query = { role: 'Mentor' };
  
      if (jobTitle) {
        query.jobTitle = jobTitle;
      }
  
      if (experience) {
        query.experience = { $gte: parseInt(experience) };
      }
  
      const mentors = await User.find(query).select('name jobTitle experience');
      res.json(mentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };
  
// In mentorController.js - Replace the bookAppointment function

exports.bookAppointment = async (req, res) => {
  try {
    const { mentorId, userId, date } = req.body;
    
    console.log('Received booking request:', { mentorId, userId, date });

    // Validate that IDs are provided
    if (!mentorId || !userId) {
      return res.status(400).json({ 
        message: 'Mentor ID and User ID are required',
        received: { mentorId, userId }
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      console.log('Invalid mentorId format:', mentorId);
      return res.status(400).json({ 
        message: 'Invalid mentor ID format',
        mentorId: mentorId
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid userId format:', userId);
      return res.status(400).json({ 
        message: 'Invalid user ID format',
        userId: userId
      });
    }

    // Check if mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      console.log('Mentor not found:', mentorId);
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (mentor.role !== 'Mentor') {
      return res.status(400).json({ message: 'Selected user is not a mentor' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new appointment
    const newAppointment = new MentorAppointment({
      mentorId: mentorId,  // Mongoose will automatically convert string to ObjectId
      userId: userId,      // Mongoose will automatically convert string to ObjectId
      requestedDate: date || new Date()
    });

    await newAppointment.save();

    console.log('Appointment created successfully:', newAppointment._id);

    res.status(201).json({ 
      message: 'Appointment booked successfully',
      appointmentId: newAppointment._id
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ 
      message: 'Server Error',
      error: error.message 
    });
  }
};

exports.getMentorAppointments = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const appointments = await MentorAppointment.find({ mentorId })
      .populate('userId', 'name email')
      .sort({ requestedDate: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching mentor appointments:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.scheduleMeeting = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { date, time, meetLink } = req.body;

    const appointment = await MentorAppointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.scheduledDate = new Date(`${date}T${time}`);
    appointment.meetLink = meetLink;
    appointment.status = 'scheduled';

    await appointment.save();

    res.json({ message: 'Meeting scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getUserAppointments = async (req, res) => {
  try {
    const { userId } = req.params;
    const appointments = await MentorAppointment.find({ userId })
      .populate('mentorId', 'name email jobTitle')
      .sort({ requestedDate: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};




exports.completeSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const appointment = await MentorAppointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointment.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this session' });
    }
    
    appointment.status = 'completed';
    await appointment.save();
    
    res.json({ message: 'Session marked as completed successfully' });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.submitRating = async (req, res) => {
  try {
    const { appointmentId, communicationSkills, clarityOfGuidance, learningOutcomes, frequencyAndQualityOfMeetings, remarks } = req.body;
    
    const appointment = await MentorAppointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this session' });
    }
    
    appointment.rating = {
      communicationSkills,
      clarityOfGuidance,
      learningOutcomes,
      frequencyAndQualityOfMeetings,
      remarks
    };
    
    await appointment.save();
    
    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.getMentorFeedback = async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    console.log('Received mentorId:', mentorId); 

    if (!mentorId) {
      return res.status(400).json({ message: 'mentorId is required' });
    }

    const feedback = await MentorAppointment.find({ 
      mentorId, 
      status: 'completed',
      rating: { $exists: true }
    }).populate('userId', 'name');
    
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching mentor feedback:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};



exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await MentorAppointment.find({
      status: 'completed',
      rating: { $exists: true }
    }).populate('userId', 'name').populate('mentorId', 'name');
    
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


exports.getMentorData = async (req, res) => {
  try {
    const mentorId = req.params.id;
    const mentor = await User.findById(mentorId).select('-password');
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.json(mentor);
  } catch (error) {
    console.error('Error fetching mentor data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.getMentorNotes = async (req, res) => {
  try {
    const mentorId = req.params.id;
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.json(mentor.notes);
  } catch (error) {
    console.error('Error fetching mentor notes:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.addMentorNote = async (req, res) => {
  try {
    const { mentorId, content } = req.body;
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    const newNote = { content, createdAt: new Date() };
    mentor.notes.push(newNote);
    await mentor.save();
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error adding mentor note:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};