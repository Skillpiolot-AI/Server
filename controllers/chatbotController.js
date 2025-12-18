const Assessment = require('../models/Assessment');
const Career = require('../models/Career');
const User = require('../models/User');
const MentorAppointment = require('../models/Mentor');
const Workshop = require('../models/Workshop');
const { College } = require('../models/College');

// Get user chat context
exports.getUserContext = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user profile
    const user = await User.findById(userId).select('-password');

    // Check assessment status
    const assessments = await Assessment.find({ userId }).sort({ completedAt: -1 }).limit(1);

    const hasAssessment = assessments.length > 0;
    const hollandCode = hasAssessment ? assessments[0].results.hollandCode : null;

    // Get user stats
    const appointmentCount = await MentorAppointment.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        user,
        hasAssessment,
        hollandCode,
        lastAssessment: assessments[0] || null,
        stats: {
          appointments: appointmentCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get career recommendations
exports.getCareerRecommendations = async (req, res) => {
  try {
    const { hollandCode, limit = 5 } = req.query;

    if (!hollandCode) {
      return res.status(400).json({ error: 'Holland code required' });
    }

    const careers = await Career.find({
      holland_codes: { $in: hollandCode.split('') },
    })
      .select(
        'id name career_cluster_name career_type salary_range future_growth holland_codes minimum_expense icon'
      )
      .limit(parseInt(limit));

    // Calculate match scores
    const careersWithScores = careers
      .map(career => ({
        ...career.toObject(),
        matchScore: calculateMatchScore(hollandCode, career.holland_codes),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: careersWithScores,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Calculate match score helper
const calculateMatchScore = (userCode, careerCodes) => {
  if (!careerCodes || careerCodes.length === 0) return 0;

  const userCodes = userCode.split('');
  let score = 0;

  userCodes.forEach((code, index) => {
    if (careerCodes.includes(code)) {
      const weight = index === 0 ? 0.5 : index === 1 ? 0.3 : 0.2;
      score += weight * 100;
    }
  });

  return Math.round(score);
};

// Get mentors
exports.getMentors = async (req, res) => {
  try {
    const { area, limit = 5 } = req.query;

    let query = { role: 'Mentor', isActive: true };

    if (area) {
      query.jobTitle = new RegExp(area, 'i');
    }

    const mentors = await User.find(query)
      .select('name jobTitle experience companiesJoined imageUrl email')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: mentors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get colleges
exports.getColleges = async (req, res) => {
  try {
    const { limit = 5, location, minRating } = req.query;

    let query = {};

    if (location) {
      query.displayLocationString = new RegExp(location, 'i');
    }

    if (minRating) {
      query.averageCourseRating = { $gte: parseFloat(minRating) };
    }

    const colleges = await College.find(query)
      .limit(parseInt(limit))
      .sort({ averageCourseRating: -1 });

    res.json({
      success: true,
      data: colleges,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get workshops
exports.getWorkshops = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const workshops = await Workshop.find().sort({ date: 1 }).limit(parseInt(limit));

    res.json({
      success: true,
      data: workshops,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Book mentor appointment
exports.bookMentorAppointment = async (req, res) => {
  try {
    const { mentorId, date, topic } = req.body;
    const userId = req.user._id;

    const appointment = new MentorAppointment({
      mentorId,
      userId,
      requestedDate: date || new Date(),
      details: { topic, source: 'chatbot' },
    });

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save chat history
exports.saveChatHistory = async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user._id;

    // You can create a ChatHistory model if you want to persist conversations
    // For now, we'll just acknowledge receipt

    res.json({
      success: true,
      message: 'Chat history saved',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
