// controllers/mentorController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const emailjs = require('@emailjs/nodejs');
const MentorAppointment = require('../models/Mentor');
const mongoose = require('mongoose');
const SystemSettings = require('../models/SystemSettings');
const { sendEmailFast } = require('../config/mailHelper');
const {
  mentorAppointmentBookedEmail,
  userMeetingScheduledEmail,
  meetingReminderEmail,
} = require('../config/mentorEmailTemplates');

emailjs.init({
  publicKey: 'VtWNYb9AxIQiQsP_s',
  privateKey: 'mrFJw2Q0Hj6tCJ9pd-rPE',
});

exports.registerMentor = async (req, res) => {
  const {
    name,
    email,
    phoneNumber,
    jobTitle,
    companiesJoined,
    experience,
    password,
    username,
    imageUrl,
  } = req.body;

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
  } catch (error) {
    console.error('Error during mentor registration:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllMentors = async (req, res) => {
  try {
    const MentorProfile = require('../models/MentorProfile');

    const {
      expertise,
      domain,
      minRating,
      maxPrice,
      city,
      language,
      menteeType,
      featured,
      page = 1,
      limit = 20,
      sortBy = 'averageRating',
      sortOrder = 'desc',
    } = req.query;

    // Build query for MentorProfile
    const query = { isVisible: true };

    if (expertise) {
      query.expertise = { $in: Array.isArray(expertise) ? expertise : [expertise] };
    }
    if (domain) {
      query.targetingDomains = { $in: Array.isArray(domain) ? domain : [domain] };
    }
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    if (maxPrice) {
      query['pricingPlans.price'] = { $lte: parseFloat(maxPrice) };
    }
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    if (language) {
      query.languages = { $in: Array.isArray(language) ? language : [language] };
    }
    if (menteeType) {
      query.preferredMenteeType = menteeType;
    }
    if (featured === 'true') {
      query.featured = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Check if free mentorship is active
    const settings = await SystemSettings.getSettings();
    const isFreeMentorship = await SystemSettings.isFreeMentorshipActive();
    const campaign = isFreeMentorship
      ? {
          name: settings.globalFreeMentorship.reason || 'Free Mentorship Campaign',
          endDate: settings.globalFreeMentorship.endDate,
        }
      : null;

    const [mentors, total] = await Promise.all([
      MentorProfile.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate(
          'userId',
          'name email imageUrl mentorStatus mentorBadge jobTitle experience companiesJoined'
        ),
      MentorProfile.countDocuments(query),
    ]);

    // Get unique filter options
    const [allExpertise, allDomains, allLanguages, allCities] = await Promise.all([
      MentorProfile.distinct('expertise', { isVisible: true }),
      MentorProfile.distinct('targetingDomains', { isVisible: true }),
      MentorProfile.distinct('languages', { isVisible: true }),
      MentorProfile.distinct('location.city', { isVisible: true }),
    ]);

    res.json({
      mentors: mentors.map(mentor => ({
        id: mentor._id,
        mentorProfileId: mentor._id,
        userId: mentor.userId?._id,
        handle: mentor.handle,
        // User info
        name: mentor.displayName || mentor.userId?.name,
        email: mentor.userId?.email,
        profileImage: mentor.profileImage || mentor.userId?.imageUrl,
        jobTitle: mentor.userId?.jobTitle,
        experience: mentor.userId?.experience,
        companiesWorked: mentor.userId?.companiesJoined,
        badge: mentor.userId?.mentorBadge,
        status: mentor.userId?.mentorStatus,
        // Profile info
        tagline: mentor.tagline,
        bio: mentor.bio,
        location: mentor.location,
        expertise: mentor.expertise,
        targetingDomains: mentor.targetingDomains,
        preferredMenteeType: mentor.preferredMenteeType,
        languages: mentor.languages,
        // Stats
        averageRating: mentor.averageRating,
        totalReviews: mentor.totalReviews,
        totalMentees: mentor.totalMentees,
        totalPlacements: mentor.totalPlacements,
        // Session info
        sessionsPerWeek: mentor.sessionsPerWeek,
        sessionDuration: mentor.sessionDuration,
        availabilitySlots: mentor.availabilitySlots,
        // Pricing (override if global free is active)
        isFree: isFreeMentorship || mentor.pricingType === 'free',
        pricingType: isFreeMentorship ? 'free' : mentor.pricingType,
        pricingPlans: isFreeMentorship ? [] : mentor.pricingPlans,
        trialSession: mentor.trialSession,
        // Features
        referralsInTopCompanies: mentor.referralsInTopCompanies,
        topCompanies: mentor.topCompanies,
        curriculum: mentor.curriculum,
        socialLinks: mentor.socialLinks,
        featured: mentor.featured,
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      filters: {
        expertise: allExpertise.filter(Boolean),
        domains: allDomains.filter(Boolean),
        languages: allLanguages.filter(Boolean),
        cities: allCities.filter(Boolean),
      },
      isFreeMentorship,
      campaign,
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedMentor = await User.findByIdAndUpdate(id, updateData, { new: true }).select(
      '-password'
    );

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

// exports.bookAppointment = async (req, res) => {
//   try {
//     const { mentorId, userId, date } = req.body;

//     console.log('Received booking request:', { mentorId, userId, date });

//     // Validate that IDs are provided
//     if (!mentorId || !userId) {
//       return res.status(400).json({
//         message: 'Mentor ID and User ID are required',
//         received: { mentorId, userId }
//       });
//     }

//     // Validate ObjectId format
//     if (!mongoose.Types.ObjectId.isValid(mentorId)) {
//       console.log('Invalid mentorId format:', mentorId);
//       return res.status(400).json({
//         message: 'Invalid mentor ID format',
//         mentorId: mentorId
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       console.log('Invalid userId format:', userId);
//       return res.status(400).json({
//         message: 'Invalid user ID format',
//         userId: userId
//       });
//     }

//     // Check if mentor exists
//     const mentor = await User.findById(mentorId);
//     if (!mentor) {
//       console.log('Mentor not found:', mentorId);
//       return res.status(404).json({ message: 'Mentor not found' });
//     }

//     if (mentor.role !== 'Mentor') {
//       return res.status(400).json({ message: 'Selected user is not a mentor' });
//     }

//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       console.log('User not found:', userId);
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Create new appointment
//     const newAppointment = new MentorAppointment({
//       mentorId: mentorId,  // Mongoose will automatically convert string to ObjectId
//       userId: userId,      // Mongoose will automatically convert string to ObjectId
//       requestedDate: date || new Date()
//     });

//     await newAppointment.save();

//     console.log('Appointment created successfully:', newAppointment._id);

//     res.status(201).json({
//       message: 'Appointment booked successfully',
//       appointmentId: newAppointment._id
//     });
//   } catch (error) {
//     console.error('Error booking appointment:', error);
//     res.status(500).json({
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

exports.bookAppointment = async (req, res) => {
  try {
    const { mentorId, userId, date } = req.body;

    console.log('Received booking request:', { mentorId, userId, date });

    if (!mentorId || !userId) {
      return res.status(400).json({
        message: 'Mentor ID and User ID are required',
        received: { mentorId, userId },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({
        message: 'Invalid mentor ID format',
        mentorId: mentorId,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format',
        userId: userId,
      });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (mentor.role !== 'Mentor') {
      return res.status(400).json({ message: 'Selected user is not a mentor' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAppointment = new MentorAppointment({
      mentorId: mentorId,
      userId: userId,
      requestedDate: date || new Date(),
    });

    await newAppointment.save();

    // ✅ SEND EMAIL TO MENTOR
    try {
      const emailTemplate = mentorAppointmentBookedEmail(
        mentor.name,
        user.name,
        user.email,
        newAppointment.requestedDate
      );

      await sendEmailFast(mentor.email, emailTemplate);
      console.log('✅ Appointment notification email sent to mentor:', mentor.email);
    } catch (emailError) {
      console.error('❌ Failed to send appointment notification email:', emailError);
      // Don't fail the appointment booking if email fails
    }

    res.status(201).json({
      message: 'Appointment booked successfully. Mentor has been notified.',
      appointmentId: newAppointment._id,
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      message: 'Server Error',
      error: error.message,
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

// exports.scheduleMeeting = async (req, res) => {
//   try {
//     const { appointmentId } = req.params;
//     const { date, time, meetLink } = req.body;

//     const appointment = await MentorAppointment.findById(appointmentId);

//     if (!appointment) {
//       return res.status(404).json({ message: 'Appointment not found' });
//     }

//     appointment.scheduledDate = new Date(`${date}T${time}`);
//     appointment.meetLink = meetLink;
//     appointment.status = 'scheduled';

//     await appointment.save();

//     res.json({ message: 'Meeting scheduled successfully' });
//   } catch (error) {
//     console.error('Error scheduling meeting:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

exports.scheduleMeeting = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { date, time, meetLink } = req.body;

    const appointment = await MentorAppointment.findById(appointmentId)
      .populate('mentorId', 'name email')
      .populate('userId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const scheduledDateTime = new Date(`${date}T${time}`);

    appointment.scheduledDate = scheduledDateTime;
    appointment.meetLink = meetLink;
    appointment.status = 'scheduled';

    await appointment.save();

    // ✅ SEND EMAIL TO USER with meeting details
    try {
      const emailTemplate = userMeetingScheduledEmail(
        appointment.userId.name,
        appointment.mentorId.name,
        date,
        time,
        meetLink
      );

      await sendEmailFast(appointment.userId.email, emailTemplate);
      console.log('✅ Meeting scheduled email sent to user:', appointment.userId.email);
    } catch (emailError) {
      console.error('❌ Failed to send meeting scheduled email:', emailError);
    }

    // ✅ SCHEDULE REMINDER EMAILS (24h, 12h, 1h before)
    scheduleReminderEmails(appointment, scheduledDateTime);

    res.json({
      message: 'Meeting scheduled successfully. User has been notified with reminders set.',
      scheduledDate: scheduledDateTime,
      meetLink: meetLink,
    });
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Function to schedule reminder emails
const scheduleReminderEmails = (appointment, scheduledDateTime) => {
  const now = new Date();

  // Calculate reminder times
  const reminder24h = new Date(scheduledDateTime.getTime() - 24 * 60 * 60 * 1000);
  const reminder12h = new Date(scheduledDateTime.getTime() - 12 * 60 * 60 * 1000);
  const reminder1h = new Date(scheduledDateTime.getTime() - 1 * 60 * 60 * 1000);

  // Schedule 24h reminder
  if (reminder24h > now) {
    const delay24h = reminder24h.getTime() - now.getTime();
    setTimeout(() => {
      sendReminderEmail(appointment, 24);
    }, delay24h);
    console.log(`⏰ 24h reminder scheduled for ${reminder24h.toLocaleString()}`);
  }

  // Schedule 12h reminder
  if (reminder12h > now) {
    const delay12h = reminder12h.getTime() - now.getTime();
    setTimeout(() => {
      sendReminderEmail(appointment, 12);
    }, delay12h);
    console.log(`⏰ 12h reminder scheduled for ${reminder12h.toLocaleString()}`);
  }

  // Schedule 1h reminder
  if (reminder1h > now) {
    const delay1h = reminder1h.getTime() - now.getTime();
    setTimeout(() => {
      sendReminderEmail(appointment, 1);
    }, delay1h);
    console.log(`⏰ 1h reminder scheduled for ${reminder1h.toLocaleString()}`);
  }
};

// Function to send reminder email
const sendReminderEmail = async (appointment, hoursRemaining) => {
  try {
    // Fetch fresh appointment data
    const freshAppointment = await MentorAppointment.findById(appointment._id)
      .populate('mentorId', 'name email')
      .populate('userId', 'name email');

    if (!freshAppointment || freshAppointment.status !== 'scheduled') {
      console.log(`⚠️ Appointment ${appointment._id} is no longer scheduled. Skipping reminder.`);
      return;
    }

    const emailTemplate = meetingReminderEmail(
      freshAppointment.userId.name,
      freshAppointment.mentorId.name,
      freshAppointment.scheduledDate,
      freshAppointment.meetLink,
      hoursRemaining
    );

    await sendEmailFast(freshAppointment.userId.email, emailTemplate);
    console.log(`✅ ${hoursRemaining}h reminder sent to:`, freshAppointment.userId.email);
  } catch (error) {
    console.error(`❌ Failed to send ${hoursRemaining}h reminder:`, error);
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
    const {
      appointmentId,
      communicationSkills,
      clarityOfGuidance,
      learningOutcomes,
      frequencyAndQualityOfMeetings,
      remarks,
    } = req.body;

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
      remarks,
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
      rating: { $exists: true },
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
      rating: { $exists: true },
    })
      .populate('userId', 'name')
      .populate('mentorId', 'name');

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

exports.getMentorDashboardStats = async (req, res) => {
  try {
    const mentorId = req.user._id;
    console.log('Fetching dashboard stats for mentor:', mentorId);

    const now = new Date();
    // Use fresh dates to avoid side effects
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [upcoming, completed, week, month, year, totalMentees] = await Promise.all([
      MentorAppointment.countDocuments({
        mentorId,
        status: 'scheduled',
        scheduledDate: { $gt: new Date() },
      }),
      MentorAppointment.countDocuments({ mentorId, status: 'completed' }),
      MentorAppointment.countDocuments({
        mentorId,
        status: 'completed',
        scheduledDate: { $gte: startOfWeek },
      }),
      MentorAppointment.countDocuments({
        mentorId,
        status: 'completed',
        scheduledDate: { $gte: startOfMonth },
      }),
      MentorAppointment.countDocuments({
        mentorId,
        status: 'completed',
        scheduledDate: { $gte: startOfYear },
      }),
      User.countDocuments({ role: 'Student', 'appointments.userId': mentorId }),
    ]);

    // Average calls per day (last 30 days)
    const last30DaysCount = await MentorAppointment.countDocuments({
      mentorId,
      status: 'completed',
      scheduledDate: { $gte: thirtyDaysAgo },
    });
    const avgCallsPerDay = (last30DaysCount / 30).toFixed(1);

    res.json({
      upcomingSessions: upcoming,
      completedSessions: completed,
      weekSessions: week,
      monthSessions: month,
      yearSessions: year,
      totalMentees,
      avgCallsPerDay,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server Error', details: error.message });
  }
};

exports.getActivityGraph = async (req, res) => {
  try {
    const mentorId = req.user._id;
    console.log('Fetching activity graph for mentor:', mentorId);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const stats = await MentorAppointment.aggregate([
      {
        $match: {
          mentorId: new mongoose.Types.ObjectId(mentorId),
          status: 'completed',
          scheduledDate: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledDate' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const dataMap = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const graphData = last7Days.map(date => ({
      date,
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date).getDay()],
      count: dataMap[date] || 0,
    }));

    res.json(graphData);
  } catch (error) {
    console.error('Error fetching activity graph:', error);
    res.status(500).json({ message: 'Server Error', details: error.message });
  }
};

exports.requestProfileUpdate = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const updateData = req.body;
    const MentorProfile = require('../models/MentorProfile');

    const profile = await MentorProfile.findOne({ userId: mentorId });
    if (!profile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    // Store changes in pendingChanges and set flag
    profile.pendingChanges = updateData;
    profile.isChangePending = true;
    await profile.save();

    // NOTIFY ADMINS
    const admins = await User.find({ role: 'Admin' });
    const adminEmails = admins.map(a => a.email);

    if (adminEmails.length > 0) {
      const emailContent = {
        subject: `Mentor Profile Update Request: ${profile.displayName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Profile Update Request</h2>
            <p>Mentor <strong>${profile.displayName}</strong> has requested an update to their profile.</p>
            <p>Please review the changes in the admin dashboard.</p>
            <div style="margin-top: 20px;">
              <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin/mentors'}/${profile._id}" 
                 style="background: #3F3FF3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Review Changes
              </a>
            </div>
          </div>
        `,
      };

      for (const email of adminEmails) {
        await sendEmailFast(email, emailContent);
      }
    }

    res.json({ message: 'Update request submitted for admin review' });
  } catch (error) {
    console.error('Error requesting profile update:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.approveProfileUpdate = async (req, res) => {
  try {
    const { id } = req.params; // mentorId (User ID)
    const MentorProfile = require('../models/MentorProfile');

    const profile = await MentorProfile.findOne({ userId: id });
    if (!profile || !profile.isChangePending) {
      return res.status(404).json({ message: 'No pending changes found for this mentor' });
    }

    // Apply changes
    Object.assign(profile, profile.pendingChanges);
    profile.isChangePending = false;
    profile.pendingChanges = undefined;
    await profile.save();

    // Notify mentor
    const user = await User.findById(id);
    if (user) {
      await sendEmailFast(user.email, {
        subject: 'Your Profile Update was Approved!',
        html: `<p>Hi ${profile.displayName}, your recent profile changes have been reviewed and approved. They are now live on the platform.</p>`,
      });
    }

    res.json({ message: 'Profile update approved and applied' });
  } catch (error) {
    console.error('Error approving profile update:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.rejectProfileUpdate = async (req, res) => {
  try {
    const { id } = req.params; // mentorId
    const { reason } = req.body;
    const MentorProfile = require('../models/MentorProfile');

    const profile = await MentorProfile.findOne({ userId: id });
    if (!profile || !profile.isChangePending) {
      return res.status(404).json({ message: 'No pending changes found' });
    }

    profile.isChangePending = false;
    profile.pendingChanges = undefined;
    await profile.save();

    // Notify mentor
    const user = await User.findById(id);
    if (user) {
      await sendEmailFast(user.email, {
        subject: 'Profile Update Request Feedback',
        html: `<p>Hi ${profile.displayName}, your recent profile update request was not approved.</p>
               <p><strong>Reason:</strong> ${reason || 'Does not meet our community standards.'}</p>`,
      });
    }

    res.json({ message: 'Profile update rejected' });
  } catch (error) {
    console.error('Error rejecting profile update:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPendingProfileUpdates = async (req, res) => {
  try {
    const MentorProfile = require('../models/MentorProfile');
    // Find profiles with pending changes and populate user info
    const pendingProfiles = await MentorProfile.find({ isChangePending: true }).populate(
      'userId',
      'name email createdAt updatedAt'
    );

    // Format data for the frontend
    const result = pendingProfiles.map(profile => ({
      _id: profile.userId._id, // Send userId as _id for the frontend actions
      name: profile.userId.name,
      email: profile.userId.email,
      updatedAt: profile.updatedAt,
      mentorProfile: profile,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching pending profile updates:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ==================== NEW: MENTOR PROFILE MANAGEMENT ====================

// Get mentor's own profile (full details)
exports.getMyMentorProfile = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const MentorProfile = require('../models/MentorProfile');
    const MentorBooking = require('../models/MentorBooking');

    const profile = await MentorProfile.findOne({ userId: mentorId }).populate(
      'userId',
      'name email imageUrl role mentorStatus mentorBadge'
    );

    if (!profile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    // Get session stats
    const [completedCount, pendingCount, totalCount] = await Promise.all([
      MentorBooking.countDocuments({ mentorId, status: 'completed' }),
      MentorBooking.countDocuments({ mentorId, status: { $in: ['scheduled', 'pending'] } }),
      MentorBooking.countDocuments({ mentorId }),
    ]);

    res.json({
      profile,
      sessionStats: {
        completed: completedCount,
        pending: pendingCount,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update mentor profile (instant update + admin notification)
exports.updateMentorProfile = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const updateData = req.body;
    const MentorProfile = require('../models/MentorProfile');
    const MentorBooking = require('../models/MentorBooking');

    const profile = await MentorProfile.findOne({ userId: mentorId }).populate(
      'userId',
      'name email'
    );

    if (!profile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    // Track changes for admin notification
    const changes = [];
    const allowedFields = [
      'displayName',
      'tagline',
      'bio',
      'profileImage',
      'location',
      'expertise',
      'targetingDomains',
      'preferredMenteeType',
      'languages',
      'sessionsPerWeek',
      'sessionDuration',
      'pricingType',
      'pricingPlans',
      'trialSession',
      'availabilitySlots',
      'socialLinks',
      'curriculum',
      'education',
      'certifications',
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        const oldValue = profile[field];
        const newValue = updateData[field];

        // Check if value actually changed
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            field,
            oldValue,
            newValue,
          });
          profile[field] = newValue;
        }
      }
    }

    if (changes.length === 0) {
      return res.json({ message: 'No changes detected', profile });
    }

    // Get session stats for admin notification
    const [completedCount, pendingCount, totalCount] = await Promise.all([
      MentorBooking.countDocuments({ mentorId, status: 'completed' }),
      MentorBooking.countDocuments({ mentorId, status: { $in: ['scheduled', 'pending'] } }),
      MentorBooking.countDocuments({ mentorId }),
    ]);

    // Add to change history
    profile.profileChangeHistory.push({
      changedAt: new Date(),
      changes,
      sessionStats: {
        completed: completedCount,
        pending: pendingCount,
        total: totalCount,
      },
      isReviewed: false,
    });

    await profile.save();

    // NOTIFY ADMINS with detailed change info
    const admins = await User.find({ role: 'Admin' });

    if (admins.length > 0) {
      const changesHtml = changes
        .map(
          c => `
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>${c.field}</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; color: #dc2626;">${
              typeof c.oldValue === 'object' ? JSON.stringify(c.oldValue) : c.oldValue || 'N/A'
            }</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; color: #059669;">${
              typeof c.newValue === 'object' ? JSON.stringify(c.newValue) : c.newValue || 'N/A'
            }</td>
          </tr>
        `
        )
        .join('');

      const emailContent = {
        subject: `Mentor Profile Updated: ${profile.displayName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 700px;">
            <h2 style="color: #1e40af;">Mentor Profile Update</h2>
            <p>Mentor <strong>${profile.displayName}</strong> (${profile.userId.email}) has updated their profile.</p>
            
            <h3 style="margin-top: 20px;">Session Statistics</h3>
            <ul>
              <li>Completed Sessions: <strong>${completedCount}</strong></li>
              <li>Pending Sessions: <strong>${pendingCount}</strong></li>
              <li>Total Sessions: <strong>${totalCount}</strong></li>
            </ul>
            
            <h3 style="margin-top: 20px;">Changes Made</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Field</th>
                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Previous Value</th>
                  <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">New Value</th>
                </tr>
              </thead>
              <tbody>
                ${changesHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/mentor-review" 
                 style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View in Admin Dashboard
              </a>
            </div>
          </div>
        `,
      };

      for (const admin of admins) {
        await sendEmailFast(admin.email, emailContent);
      }
      console.log('✅ Admin notification sent for mentor profile update');
    }

    res.json({
      message: 'Profile updated successfully',
      profile,
      changesCount: changes.length,
    });
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update busy dates
exports.updateBusyDates = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { action, date, reason, dateId } = req.body;
    const MentorProfile = require('../models/MentorProfile');

    const profile = await MentorProfile.findOne({ userId: mentorId });

    if (!profile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    if (action === 'add') {
      if (!date) {
        return res.status(400).json({ message: 'Date is required' });
      }
      profile.busyDates.push({
        date: new Date(date),
        reason: reason || 'Unavailable',
      });
    } else if (action === 'remove') {
      if (!dateId) {
        return res.status(400).json({ message: 'Date ID is required for removal' });
      }
      profile.busyDates = profile.busyDates.filter(d => d._id.toString() !== dateId);
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "add" or "remove".' });
    }

    await profile.save();

    res.json({
      message: `Busy date ${action === 'add' ? 'added' : 'removed'} successfully`,
      busyDates: profile.busyDates,
    });
  } catch (error) {
    console.error('Error updating busy dates:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get mentor's sessions with filters
exports.getMentorSessions = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;
    const MentorBooking = require('../models/MentorBooking');

    const query = { mentorId };
    if (status) {
      if (status === 'upcoming') {
        query.status = 'scheduled';
        query.scheduledDate = { $gte: new Date() };
      } else if (status === 'pending') {
        query.status = { $in: ['pending', 'scheduled'] };
      } else {
        query.status = status;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, total] = await Promise.all([
      MentorBooking.find(query)
        .populate('userId', 'name email imageUrl')
        .sort({ scheduledDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MentorBooking.countDocuments(query),
    ]);

    // Get counts for each status
    const [completedCount, scheduledCount, pendingCount, cancelledCount] = await Promise.all([
      MentorBooking.countDocuments({ mentorId, status: 'completed' }),
      MentorBooking.countDocuments({ mentorId, status: 'scheduled' }),
      MentorBooking.countDocuments({ mentorId, status: 'pending' }),
      MentorBooking.countDocuments({ mentorId, status: 'cancelled' }),
    ]);

    res.json({
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      statusCounts: {
        completed: completedCount,
        scheduled: scheduledCount,
        pending: pendingCount,
        cancelled: cancelledCount,
        all: completedCount + scheduledCount + pendingCount + cancelledCount,
      },
    });
  } catch (error) {
    console.error('Error fetching mentor sessions:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get all mentors with change history for admin (replaces getPendingProfileUpdates for new flow)
exports.getMentorChangeHistory = async (req, res) => {
  try {
    const MentorProfile = require('../models/MentorProfile');
    const MentorBooking = require('../models/MentorBooking');

    // Find profiles with unreviewed changes
    const profiles = await MentorProfile.find({
      'profileChangeHistory.isReviewed': false,
    }).populate('userId', 'name email imageUrl createdAt mentorStatus');

    const result = await Promise.all(
      profiles.map(async profile => {
        const unreviewedChanges = profile.profileChangeHistory.filter(ch => !ch.isReviewed);

        // Get current session stats
        const [completedCount, pendingCount] = await Promise.all([
          MentorBooking.countDocuments({ mentorId: profile.userId._id, status: 'completed' }),
          MentorBooking.countDocuments({
            mentorId: profile.userId._id,
            status: { $in: ['scheduled', 'pending'] },
          }),
        ]);

        return {
          _id: profile.userId._id,
          mentorProfileId: profile._id,
          name: profile.userId.name,
          email: profile.userId.email,
          imageUrl: profile.userId.imageUrl,
          displayName: profile.displayName,
          mentorStatus: profile.userId.mentorStatus,
          currentSessionStats: {
            completed: completedCount,
            pending: pendingCount,
          },
          unreviewedChanges,
          profile,
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching mentor change history:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Mark changes as reviewed
exports.markChangesReviewed = async (req, res) => {
  try {
    const { mentorProfileId } = req.params;
    const MentorProfile = require('../models/MentorProfile');

    const profile = await MentorProfile.findById(mentorProfileId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Mark all unreviewed changes as reviewed
    profile.profileChangeHistory.forEach(change => {
      if (!change.isReviewed) {
        change.isReviewed = true;
      }
    });

    await profile.save();

    res.json({ message: 'Changes marked as reviewed' });
  } catch (error) {
    console.error('Error marking changes as reviewed:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
