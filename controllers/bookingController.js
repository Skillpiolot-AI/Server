const MentorBooking = require('../models/MentorBooking');
const MentorProfile = require('../models/MentorProfile');
const MentorService = require('../models/MentorService');
const MentorCoupon = require('../models/MentorCoupon');
const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const Announcement = require('../models/Announcement');
const { sendEmailFast } = require('../config/mailHelper');
const crypto = require('crypto');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Generate Jitsi meeting link with proper configuration
// Using meet.jit.si's URL parameters to ensure meetings start properly
const generateJitsiLink = bookingId => {
  // Create a shorter, cleaner room name
  const shortId = bookingId.replace('BK-', '').substring(0, 12);
  const roomName = `SkillPilot${shortId}`;

  // Add config parameters to:
  // - Disable lobby (startWithAudioMuted/VideoMuted are optional preferences)
  // - Allow direct join without waiting for moderator
  // Note: For public meet.jit.si, the first person to join becomes moderator automatically
  // Adding config to improve user experience
  const configParams = [
    'config.prejoinConfig.enabled=false', // Skip pre-join screen
    'config.startWithAudioMuted=true', // Start muted to be polite
    'config.startWithVideoMuted=false', // Video on by default
  ].join('&');

  return `https://meet.jit.si/${roomName}#${configParams}`;
};

// ==========================================
// USER BOOKING ENDPOINTS
// ==========================================

/**
 * Get available time slots for a mentor on a specific date
 * GET /api/bookings/available-slots/:mentorProfileId
 * Query params: date (YYYY-MM-DD)
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { mentorProfileId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
    }

    // Get mentor profile with availability
    const mentorProfile = await MentorProfile.findById(mentorProfileId);
    if (!mentorProfile) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const mentorId = mentorProfile.userId;
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if this date is in busy dates
    const isBusyDate = (mentorProfile.busyDates || []).some(busy => {
      const busyDate = new Date(busy.date);
      return busyDate.toISOString().split('T')[0] === date;
    });

    if (isBusyDate) {
      return res.json({
        date,
        dayOfWeek,
        isBusyDate: true,
        slots: [],
        message: 'Mentor is unavailable on this date',
      });
    }

    // Get mentor's availability for this day of week
    const dayAvailability = (mentorProfile.availabilitySlots || []).find(
      slot => slot.day === dayOfWeek && slot.isAvailable
    );

    // Generate base slots (9 AM to 9 PM)
    const allSlots = [];
    for (let hour = 9; hour <= 21; hour++) {
      allSlots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        label: hour <= 12 ? `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}` : `${hour - 12}:00 PM`,
      });
    }

    // Filter by mentor's weekly availability (if set)
    let availableSlots = allSlots;
    if (dayAvailability) {
      const startHour = parseInt(dayAvailability.startTime.split(':')[0]);
      const endHour = parseInt(dayAvailability.endTime.split(':')[0]);
      availableSlots = allSlots.filter(slot => slot.hour >= startHour && slot.hour < endHour);
    } else if (mentorProfile.availabilitySlots && mentorProfile.availabilitySlots.length > 0) {
      // Mentor has set availability but not for this day - they're unavailable
      return res.json({
        date,
        dayOfWeek,
        isBusyDate: false,
        isWeeklyUnavailable: true,
        slots: [],
        message: `Mentor is not available on ${dayOfWeek}s`,
      });
    }

    // Get existing bookings for this date
    // Use the same construction as the frontend for the 24-hour window
    const dateStart = new Date(`${date}T00:00:00`);
    const dateEnd = new Date(`${date}T23:59:59`);

    const existingBookings = await MentorBooking.find({
      mentorId,
      scheduledAt: { $gte: dateStart, $lte: dateEnd },
      status: { $nin: ['cancelled'] },
    }).select('scheduledAt duration');

    // Build final slots with availability status
    const slots = availableSlots.map(slot => {
      // Create a date object for this specific slot to check for conflicts
      // We use the same construction as the frontend (Local construction)
      const slotTime = new Date(`${date}T${slot.time}:00`);
      const slotEndTime = new Date(
        slotTime.getTime() + (mentorProfile.sessionDuration || 60) * 60000
      );

      // Check if any existing booking overlaps with this slot
      const isBooked = existingBookings.some(booking => {
        const bookingStart = new Date(booking.scheduledAt);
        const bookingEnd = new Date(bookingStart.getTime() + (booking.duration || 60) * 60000);

        // Overlap: (StartA < EndB) and (EndA > StartB)
        return slotTime < bookingEnd && slotEndTime > bookingStart;
      });

      return {
        ...slot,
        isBooked,
        isAvailable: !isBooked,
      };
    });

    res.json({
      date,
      dayOfWeek,
      isBusyDate: false,
      isWeeklyUnavailable: false,
      mentorName: mentorProfile.displayName,
      sessionDuration: mentorProfile.sessionDuration || 60,
      slots,
      availableCount: slots.filter(s => s.isAvailable).length,
      bookedCount: slots.filter(s => s.isBooked).length,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};

/**
 * Create a new booking
 * POST /api/bookings/book
 */
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      mentorProfileId,
      scheduledAt,
      duration: reqDuration = 60,
      remark,
      topics,
      serviceId,
      couponCode,
    } = req.body;

    // Validate required fields
    if (!mentorProfileId || !scheduledAt) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['mentorProfileId', 'scheduledAt'],
      });
    }

    // Get mentor profile
    const mentorProfile = await MentorProfile.findById(mentorProfileId).populate(
      'userId',
      'name email'
    );

    if (!mentorProfile || !mentorProfile.isVisible) {
      return res.status(404).json({ error: 'Mentor not found or unavailable' });
    }

    const mentorId = mentorProfile.userId._id;

    // Prevent self-booking
    if (mentorId.toString() === userId.toString()) {
      return res.status(400).json({ error: 'You cannot book a session with yourself' });
    }

    // Check for time conflicts
    const scheduledDate = new Date(scheduledAt);

    // We will establish finalDuration soon, so we check conflict after assessing duration

    // Calculate pricing based on service or fallback
    const settings = await SystemSettings.getSettings();
    const isFreeMentorship = await SystemSettings.isFreeMentorshipActive();
    let isFree = isFreeMentorship;
    let originalPrice = 0;
    let paidAmount = 0;
    let finalDuration = reqDuration;
    let serviceName = 'Mentorship Session';
    let finalCouponId = null;

    if (serviceId) {
      const service = await MentorService.findById(serviceId);
      if (service && service.isActive) {
        serviceName = service.title;
        finalDuration = service.duration || finalDuration;
        originalPrice = service.price || 0;
        paidAmount = originalPrice;
        isFree = paidAmount === 0;

        // Apply coupon if provided
        if (couponCode && !isFree) {
          const coupon = await MentorCoupon.findOne({
            code: couponCode.toUpperCase(),
            mentorId: mentorId,
            isActive: true,
          });
          if (coupon) {
            finalCouponId = coupon._id;
            if (coupon.discountType === 'percentage') {
              paidAmount = Math.max(
                0,
                originalPrice - (originalPrice * coupon.discountValue) / 100
              );
            } else {
              paidAmount = Math.max(0, originalPrice - coupon.discountValue);
            }
          }
        }
      }
    } else if (!isFreeMentorship && mentorProfile.pricingType !== 'free') {
      // Fallback calculations for legacy bookings
      if (mentorProfile.trialSession?.available && mentorProfile.trialSession?.price) {
        originalPrice = mentorProfile.trialSession.price;
      } else if (mentorProfile.pricingPlans?.length > 0) {
        originalPrice = mentorProfile.pricingPlans[0].price / 4; // Per session estimate
      }
      paidAmount = originalPrice;
      isFree = paidAmount === 0;
    } else {
      isFree = true;
    }

    // Now check for time conflicts using finalDuration
    const conflict = await MentorBooking.checkConflict(mentorId, scheduledDate, finalDuration);
    if (conflict) {
      return res.status(400).json({
        error: 'This time slot is not available',
        conflictingBooking: conflict.bookingId,
      });
    }

    // Create booking with auto-generated Jitsi link
    const booking = new MentorBooking({
      userId,
      mentorId,
      mentorProfileId,
      serviceId: serviceId || undefined,
      couponId: finalCouponId || undefined,
      scheduledAt: scheduledDate,
      duration: finalDuration,
      remark,
      topics: topics || [],
      isFree,
      originalPrice,
      paidAmount,
      status: settings.bookingSettings?.autoConfirmBookings ? 'confirmed' : 'pending',
    });

    // Auto-generate Jitsi meeting link
    booking.meetingLink = generateJitsiLink(booking.bookingId);
    booking.meetingLinkSentAt = new Date();

    const savedBooking = await booking.save();

    // Get user details for email
    const user = await User.findById(userId).select('name email');

    // Send confirmation email to user (simple, no CSS)
    sendEmailFast(user.email, {
      subject: 'Booking Confirmed - Skill-Pilot Mentorship',
      html: `<div style="font-family: Arial, sans-serif;">
<p>Hello ${user.name},</p>
<p>Your ${serviceName} with <strong>${mentorProfile.displayName}</strong> has been ${savedBooking.status === 'confirmed' ? 'confirmed' : 'submitted'}.</p>
<p><strong>Booking Details:</strong></p>
<ul>
<li>Booking ID: ${savedBooking.bookingId}</li>
<li>Mentor: ${mentorProfile.displayName}</li>
<li>Date: ${scheduledDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
<li>Time: ${scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</li>
<li>Duration: ${finalDuration} minutes</li>
${isFree ? '<li>Price: FREE</li>' : `<li>Amount: Rs.${paidAmount}</li>`}
</ul>
<p><strong>Meeting Link (Jitsi):</strong><br/>${savedBooking.meetingLink}</p>
${remark ? `<p><strong>Your Message:</strong> ${remark}</p>` : ''}
<p>You will receive reminders before your session.</p>
<p>Best regards,<br/>The Skill-Pilot Team</p>
</div>`,
      text: `Hello ${user.name},\n\nYour ${serviceName} with ${mentorProfile.displayName} has been ${savedBooking.status}.\n\nBooking ID: ${savedBooking.bookingId}\nMentor: ${mentorProfile.displayName}\nDate: ${scheduledDate.toLocaleDateString()}\nTime: ${scheduledDate.toLocaleTimeString()}\nDuration: ${finalDuration} minutes\n${isFree ? 'Price: FREE' : `Amount: Rs.${paidAmount}`}\n\nMeeting Link: ${savedBooking.meetingLink}\n${remark ? `Your Message: ${remark}` : ''}\n\nBest regards,\nThe Skill-Pilot Team`,
    }).catch(err => console.error('Failed to send user booking email:', err));

    // Send notification to mentor (simple, no CSS)
    sendEmailFast(mentorProfile.userId.email, {
      subject: 'New Booking Request - Skill-Pilot',
      html: `<div style="font-family: Arial, sans-serif;">
<p>Hello ${mentorProfile.displayName},</p>
<p>A student has booked a ${serviceName} with you.</p>
<p><strong>Booking Details:</strong></p>
<ul>
<li>Booking ID: ${savedBooking.bookingId}</li>
<li>Student: ${user.name} (${user.email})</li>
<li>Date: ${scheduledDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
<li>Time: ${scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</li>
<li>Duration: ${finalDuration} minutes</li>
</ul>
<p><strong>Meeting Link (Jitsi):</strong><br/>${savedBooking.meetingLink}</p>
${remark ? `<p><strong>Student's Message:</strong> ${remark}</p>` : ''}
<p>You will receive reminders before the session.</p>
<p>Best regards,<br/>The Skill-Pilot Team</p>
</div>`,
      text: `Hello ${mentorProfile.displayName},\n\nA student has booked a ${serviceName} with you.\n\nBooking ID: ${savedBooking.bookingId}\nStudent: ${user.name} (${user.email})\nDate: ${scheduledDate.toLocaleDateString()}\nTime: ${scheduledDate.toLocaleTimeString()}\nDuration: ${finalDuration} minutes\n\nMeeting Link: ${savedBooking.meetingLink}\n${remark ? `Student Message: ${remark}` : ''}\n\nBest regards,\nThe Skill-Pilot Team`,
    }).catch(err => console.error('Failed to send mentor booking email:', err));

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: savedBooking._id,
        bookingId: savedBooking.bookingId,
        status: savedBooking.status,
        scheduledAt: savedBooking.scheduledAt,
        duration: savedBooking.duration,
        isFree: savedBooking.isFree,
        serviceName,
        mentor: {
          name: mentorProfile.displayName,
          profileImage: mentorProfile.profileImage,
        },
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
};

/**
 * Get user's bookings
 * GET /api/bookings/my-bookings
 */
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, upcoming, past, page = 1, limit = 100 } = req.query;

    const query = { userId };
    if (status) query.status = status;

    if (upcoming === 'true') {
      query.endTime = { $gte: new Date() };
      query.status = { $in: ['pending', 'confirmed', 'in-progress'] };
    } else if (past === 'true') {
      query.$or = [
        { endTime: { $lt: new Date() } },
        { status: { $in: ['completed', 'cancelled', 'no-show'] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      MentorBooking.find(query)
        .sort({ scheduledAt: upcoming === 'true' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('mentorId', 'name email imageUrl')
        .populate('mentorProfileId', 'displayName tagline profileImage')
        .populate('serviceId', 'title serviceType price duration'),
      MentorBooking.countDocuments(query),
    ]);

    res.json({
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

/**
 * Get booking by ID
 * GET /api/bookings/:bookingId
 */
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    // Build query - only use _id if it's a valid ObjectId (24 hex chars)
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(bookingId);
    const query = isValidObjectId ? { $or: [{ _id: bookingId }, { bookingId }] } : { bookingId };

    const booking = await MentorBooking.findOne(query)
      .populate('userId', 'name email imageUrl')
      .populate('mentorId', 'name email imageUrl')
      .populate('mentorProfileId', 'displayName tagline profileImage bio');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check access (user or mentor can view)
    const isUser = booking.userId._id.toString() === userId.toString();
    const isMentor = booking.mentorId._id.toString() === userId.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isUser && !isMentor && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ booking, isUser, isMentor });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

/**
 * Cancel booking
 * PUT /api/bookings/:bookingId/cancel
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const booking = await MentorBooking.findOne({
      $or: [{ _id: bookingId }, { bookingId }],
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user can cancel
    const isUser = booking.userId.toString() === userId.toString();
    const isMentor = booking.mentorId.toString() === userId.toString();

    if (!isUser && !isMentor) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    await booking.cancel(isUser ? 'user' : 'mentor', reason);

    res.json({
      message: 'Booking cancelled',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// ==========================================
// RATING ENDPOINT
// ==========================================

/**
 * Rate a completed session
 * POST /api/bookings/:bookingId/rate
 */
exports.rateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { score, comment } = req.body;
    const userId = req.user._id;

    // Validate rating score
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Build query - only use _id if it's a valid ObjectId (24 hex chars)
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(bookingId);
    const query = isValidObjectId ? { $or: [{ _id: bookingId }, { bookingId }] } : { bookingId };

    const booking = await MentorBooking.findOne(query);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only the user who booked can rate
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the booking user can rate this session' });
    }

    // Check if already rated
    if (booking.rating?.score) {
      return res.status(400).json({ error: 'You have already rated this session' });
    }

    // Check if session is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed sessions' });
    }

    // Add rating using model method
    await booking.addRating(score, comment || '');

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      rating: {
        score,
        comment,
        submittedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error rating booking:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

// ==========================================
// MENTOR ENDPOINTS
// ==========================================

/**
 * Get mentor's sessions
 * GET /api/bookings/mentor/sessions
 */
exports.getMentorBookings = async (req, res) => {
  try {
    const mentorId = req.user._id;
    const { status, upcoming, past, page = 1, limit = 100 } = req.query;

    const query = { mentorId };
    if (status) query.status = status;

    if (upcoming === 'true') {
      query.endTime = { $gte: new Date() };
      query.status = { $in: ['pending', 'confirmed', 'in-progress'] };
    } else if (past === 'true') {
      query.$or = [
        { endTime: { $lt: new Date() } },
        { status: { $in: ['completed', 'cancelled', 'no-show'] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      MentorBooking.find(query)
        .sort({ scheduledAt: upcoming === 'true' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email imageUrl')
        .populate('serviceId', 'title serviceType price duration'),
      MentorBooking.countDocuments(query),
    ]);

    res.json({
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching mentor bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

/**
 * Send meeting link (from token-based email link)
 * POST /api/bookings/mentor/:bookingId/send-link
 */
exports.sendMeetingLink = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { meetingLink, token } = req.body;

    if (!meetingLink) {
      return res.status(400).json({ error: 'Meeting link is required' });
    }

    // Find booking by token or by mentor auth
    let booking;

    if (token) {
      // Token-based access (from email)
      booking = await MentorBooking.findOne({
        $or: [{ _id: bookingId }, { bookingId }],
        meetingLinkToken: token,
      });

      if (!booking || !booking.verifyMeetingLinkToken(token)) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
    } else {
      // Authenticated mentor access
      const mentorId = req.user._id;
      booking = await MentorBooking.findOne({
        $or: [{ _id: bookingId }, { bookingId }],
        mentorId,
      });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await booking.setMeetingLink(meetingLink);
    booking.status = 'in-progress';
    await booking.save();

    // Get user details
    const user = await User.findById(booking.userId).select('name email');
    const mentor = await User.findById(booking.mentorId).select('name');

    // Send meeting link to user
    sendEmailFast(user.email, {
      subject: '🔗 Meeting Link Ready - Your Session Starts Now!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center;">
            <h1>🚀 Your Session is Starting!</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2>Hello ${user.name}!</h2>
            <p>Your mentor <strong>${mentor.name}</strong> has shared the meeting link.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${meetingLink}" style="display: inline-block; padding: 16px 40px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px;">🎯 Join Meeting Now</a>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; word-break: break-all;"><strong>Meeting Link:</strong> ${meetingLink}</p>
            </div>
            
            <p style="margin-top: 30px;">Have a great session!<br><strong>The Skill-Pilot Team</strong></p>
          </div>
        </div>
      `,
      text: `Hello ${user.name}!\n\nYour mentor ${mentor.name} has shared the meeting link.\n\nJoin now: ${meetingLink}\n\nHave a great session!`,
    }).catch(err => console.error('Failed to send meeting link email:', err));

    res.json({
      message: 'Meeting link sent successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        meetingLinkSentAt: booking.meetingLinkSentAt,
      },
    });
  } catch (error) {
    console.error('Error sending meeting link:', error);
    res.status(500).json({ error: 'Failed to send meeting link' });
  }
};

/**
 * Get meeting link page data (for token-based access)
 * GET /api/bookings/send-link-page/:token
 */
exports.getMeetingLinkPage = async (req, res) => {
  try {
    const { token } = req.params;

    const booking = await MentorBooking.findOne({ meetingLinkToken: token })
      .populate('userId', 'name')
      .populate('mentorId', 'name')
      .populate('mentorProfileId', 'displayName');

    if (!booking) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    if (!booking.verifyMeetingLinkToken(token)) {
      return res.status(400).json({ error: 'Token expired' });
    }

    res.json({
      booking: {
        bookingId: booking.bookingId,
        scheduledAt: booking.scheduledAt,
        duration: booking.duration,
        studentName: booking.userId.name,
        mentorName: booking.mentorProfileId?.displayName || booking.mentorId.name,
        remark: booking.remark,
      },
    });
  } catch (error) {
    console.error('Error fetching meeting link page:', error);
    res.status(500).json({ error: 'Failed to load page' });
  }
};

/**
 * Complete session
 * PUT /api/bookings/mentor/:bookingId/complete
 */
exports.completeSession = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { notes } = req.body;
    const mentorId = req.user._id;

    const booking = await MentorBooking.findOne({
      $or: [{ _id: bookingId }, { bookingId }],
      mentorId,
    }).populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Session already completed' });
    }

    await booking.markComplete('mentor', notes);

    // Schedule rating request email (will be sent by cron job)
    // The job checks for completed sessions without rating requests sent

    res.json({
      message: 'Session marked as complete',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        completedAt: booking.completedAt,
      },
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
};

// ==========================================
// RATING ENDPOINTS
// ==========================================

/**
 * Submit rating for a booking
 * POST /api/bookings/:bookingId/rate
 */
exports.submitRating = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { score, comment } = req.body;
    const userId = req.user._id;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Rating score must be between 1 and 5' });
    }

    const booking = await MentorBooking.findOne({
      $or: [{ _id: bookingId }, { bookingId }],
      userId,
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed sessions' });
    }

    if (booking.rating?.submittedAt) {
      return res.status(400).json({ error: 'Rating already submitted' });
    }

    await booking.addRating(score, comment);

    res.json({
      message: 'Rating submitted successfully',
      rating: booking.rating,
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

/**
 * Get system settings
 * GET /api/bookings/admin/settings
 */
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

/**
 * Update system settings (toggle free mentorship)
 * PUT /api/bookings/admin/settings
 */
exports.updateSystemSettings = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { globalFreeMentorship, bookingSettings } = req.body;

    let settings = await SystemSettings.getSettings();

    if (globalFreeMentorship !== undefined) {
      settings = await SystemSettings.toggleFreeMentorship(
        globalFreeMentorship.enabled,
        adminId,
        globalFreeMentorship.reason || '',
        globalFreeMentorship.endDate
      );
    }

    if (bookingSettings) {
      settings = await SystemSettings.updateBookingSettings(bookingSettings, adminId);
    }

    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

/**
 * Get all bookings (admin)
 * GET /api/bookings/admin/all-bookings
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, mentorId, userId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (mentorId) query.mentorId = mentorId;
    if (userId) query.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total, stats] = await Promise.all([
      MentorBooking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email')
        .populate('mentorId', 'name email')
        .populate('mentorProfileId', 'displayName')
        .populate('serviceId', 'title serviceType price duration'),
      MentorBooking.countDocuments(query),
      MentorBooking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts = {};
    stats.forEach(s => {
      statusCounts[s._id] = s.count;
    });

    res.json({
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      stats: statusCounts,
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};
// ==========================================
// RESCHEDULE ENDPOINTS
// ==========================================

/**
 * Mentor requests reschedule with 3-5 proposed time slots
 * PUT /api/bookings/mentor/:bookingId/reschedule
 */
exports.requestReschedule = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason, proposedSlots } = req.body;
    const mentorId = req.user._id;

    if (!reason || !proposedSlots || proposedSlots.length < 3 || proposedSlots.length > 5) {
      return res.status(400).json({ error: 'Please provide a reason and 3-5 proposed time slots' });
    }

    const booking = await MentorBooking.findOne({
      $or: [{ _id: bookingId }, { bookingId }],
      mentorId,
    }).populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot reschedule this booking' });
    }

    // Update booking with reschedule request
    booking.reschedule = {
      status: 'pending',
      reason,
      proposedSlots: proposedSlots.map(dt => ({ dateTime: new Date(dt) })),
      requestedAt: new Date(),
    };
    booking.status = 'pending'; // reset to pending while awaiting user response
    await booking.save();

    // Get mentor profile for display name
    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    const mentorName = mentorProfile?.displayName || req.user.name;

    // Format proposed slots for email
    const slotsText = proposedSlots
      .map((dt, i) => {
        const d = new Date(dt);
        return `${i + 1}. ${d.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
      })
      .join('\n');

    // Send email to user
    sendEmailFast(booking.userId.email, {
      subject: 'Session Rescheduled - Action Required - Skill-Pilot',
      html: `<div style="font-family: Arial, sans-serif;">
<p>Hello ${booking.userId.name},</p>
<p>Your mentor <strong>${mentorName}</strong> needs to reschedule your session.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p><strong>Booking ID:</strong> ${booking.bookingId}</p>
<p><strong>Please select one of the following time slots:</strong></p>
<ol>
${proposedSlots
  .map(dt => {
    const d = new Date(dt);
    return `<li>${d.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</li>`;
  })
  .join('\n')}
</ol>
<p>Please log in to Skill-Pilot to select your preferred time slot.</p>
<p>Best regards,<br/>The Skill-Pilot Team</p>
</div>`,
      text: `Hello ${booking.userId.name},\n\nYour mentor ${mentorName} needs to reschedule your session.\n\nReason: ${reason}\nBooking ID: ${booking.bookingId}\n\nProposed time slots:\n${slotsText}\n\nPlease log in to select your preferred time.\n\nBest regards,\nThe Skill-Pilot Team`,
    }).catch(err => console.error('Failed to send reschedule email:', err));

    // Create website announcement for the user
    try {
      const announcement = new Announcement({
        subject: `Session Rescheduled by ${mentorName}`,
        description: `Your mentor ${mentorName} needs to reschedule your session (${booking.bookingId}). Reason: ${reason}. Please go to My Sessions to select a new time slot.`,
        type: 'important',
        recipientType: 'specific',
        recipientIds: [booking.userId._id],
        channels: { push: true, email: false, inApp: true },
        status: 'sent',
        sentAt: new Date(),
        createdBy: mentorId,
      });
      await announcement.save();
    } catch (annErr) {
      console.error('Failed to create reschedule announcement:', annErr);
    }

    res.json({
      message: 'Reschedule request sent to student',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        reschedule: booking.reschedule,
      },
    });
  } catch (error) {
    console.error('Error requesting reschedule:', error);
    res.status(500).json({ error: 'Failed to request reschedule' });
  }
};

/**
 * User responds to reschedule (selects a proposed slot)
 * PUT /api/bookings/:bookingId/reschedule-respond
 */
exports.respondToReschedule = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { selectedSlot } = req.body;
    const userId = req.user._id;

    if (!selectedSlot) {
      return res.status(400).json({ error: 'Please select a time slot' });
    }

    const booking = await MentorBooking.findOne({
      $or: [{ _id: bookingId }, { bookingId }],
      userId,
    })
      .populate('userId', 'name email')
      .populate('mentorId', 'name email');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.reschedule?.status !== 'pending') {
      return res.status(400).json({ error: 'No pending reschedule request' });
    }

    // Verify the selected slot is one of the proposed ones
    const selectedDate = new Date(selectedSlot);
    const isValidSlot = booking.reschedule.proposedSlots.some(
      s => new Date(s.dateTime).getTime() === selectedDate.getTime()
    );

    if (!isValidSlot) {
      return res.status(400).json({ error: 'Selected slot is not one of the proposed options' });
    }

    // Update booking
    booking.reschedule.status = 'accepted';
    booking.reschedule.selectedSlot = selectedDate;
    booking.reschedule.respondedAt = new Date();
    booking.scheduledAt = selectedDate;
    booking.status = 'confirmed';

    // Regenerate meeting link for new time
    const generateJitsiLink = bId => {
      const shortId = bId.replace('BK-', '').substring(0, 12);
      return `https://meet.jit.si/SkillPilot${shortId}`;
    };
    booking.meetingLink = generateJitsiLink(booking.bookingId);

    await booking.save();

    // Get mentor profile
    const mentorProfile = await MentorProfile.findOne({ userId: booking.mentorId._id });
    const mentorName = mentorProfile?.displayName || booking.mentorId.name;

    const fmtDate = selectedDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const fmtTime = selectedDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Email to user
    sendEmailFast(booking.userId.email, {
      subject: 'Session Rescheduled Successfully - Skill-Pilot',
      html: `<div style="font-family: Arial, sans-serif;">
<p>Hello ${booking.userId.name},</p>
<p>Your session with <strong>${mentorName}</strong> has been rescheduled successfully.</p>
<p><strong>New Schedule:</strong></p>
<ul>
<li>Date: ${fmtDate}</li>
<li>Time: ${fmtTime}</li>
<li>Booking ID: ${booking.bookingId}</li>
</ul>
<p><strong>Meeting Link:</strong><br/>${booking.meetingLink}</p>
<p>Best regards,<br/>The Skill-Pilot Team</p>
</div>`,
      text: `Hello ${booking.userId.name},\n\nYour session has been rescheduled.\n\nNew Date: ${fmtDate}\nNew Time: ${fmtTime}\nBooking ID: ${booking.bookingId}\nMeeting Link: ${booking.meetingLink}\n\nBest regards,\nThe Skill-Pilot Team`,
    }).catch(err => console.error('Failed to send reschedule confirmation to user:', err));

    // Email to mentor
    sendEmailFast(booking.mentorId.email, {
      subject: 'Reschedule Accepted by Student - Skill-Pilot',
      html: `<div style="font-family: Arial, sans-serif;">
<p>Hello ${mentorName},</p>
<p>Your student <strong>${booking.userId.name}</strong> has accepted the rescheduled time.</p>
<p><strong>New Schedule:</strong></p>
<ul>
<li>Date: ${fmtDate}</li>
<li>Time: ${fmtTime}</li>
<li>Booking ID: ${booking.bookingId}</li>
</ul>
<p><strong>Meeting Link:</strong><br/>${booking.meetingLink}</p>
<p>Best regards,<br/>The Skill-Pilot Team</p>
</div>`,
      text: `Hello ${mentorName},\n\nStudent ${booking.userId.name} accepted the reschedule.\n\nNew Date: ${fmtDate}\nNew Time: ${fmtTime}\nBooking ID: ${booking.bookingId}\nMeeting Link: ${booking.meetingLink}\n\nBest regards,\nThe Skill-Pilot Team`,
    }).catch(err => console.error('Failed to send reschedule confirmation to mentor:', err));

    res.json({
      message: 'Reschedule accepted. Session updated.',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        meetingLink: booking.meetingLink,
      },
    });
  } catch (error) {
    console.error('Error responding to reschedule:', error);
    res.status(500).json({ error: 'Failed to respond to reschedule' });
  }
};

// ==========================================
// STUDENT PROFILE FOR MENTOR
// ==========================================

/**
 * Get student's profile for mentor view (assessment results + past feedback)
 * GET /api/bookings/mentor/:bookingId/student-profile
 */
exports.getStudentProfile = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const mentorId = req.user._id;

    const booking = await MentorBooking.findOne({
      $or: [{ _id: bookingId }, { bookingId }],
      mentorId,
    }).populate('userId', 'name email imageUrl');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const studentId = booking.userId._id;

    // Get latest assessment
    const latestAssessment = await Assessment.findOne({ user: studentId })
      .sort({ completedAt: -1 })
      .select('results improvement completedAt');

    // Get all past bookings with this mentor (or any mentor) that have feedback
    const pastBookings = await MentorBooking.find({
      userId: studentId,
      status: 'completed',
      'mentorFeedback.text': { $exists: true, $ne: '' },
    })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate('mentorProfileId', 'displayName')
      .select('bookingId scheduledAt completedAt mentorFeedback mentorProfileId rating');

    res.json({
      student: {
        name: booking.userId.name,
        email: booking.userId.email,
        imageUrl: booking.userId.imageUrl,
      },
      assessment: latestAssessment
        ? {
            hollandCode: latestAssessment.results?.hollandCode,
            domainScores: latestAssessment.results?.percentages,
            topThreeDomains: latestAssessment.results?.topThreeDomains,
            recommendedCareers: latestAssessment.results?.recommendedCareers?.slice(0, 5),
            improvement: latestAssessment.improvement,
            completedAt: latestAssessment.completedAt,
          }
        : null,
      pastFeedback: pastBookings.map(b => ({
        bookingId: b.bookingId,
        mentorName: b.mentorProfileId?.displayName || 'Mentor',
        date: b.scheduledAt,
        feedback: b.mentorFeedback?.text,
        feedbackDate: b.mentorFeedback?.submittedAt,
        studentRating: b.rating?.score,
      })),
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Failed to fetch student profile' });
  }
};

// ==========================================
// MENTOR FEEDBACK ENDPOINT
// ==========================================

/**
 * Submit mentor feedback for a booking
 * POST /api/bookings/mentor/:bookingId/feedback
 */
exports.submitMentorFeedback = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { feedback } = req.body;
    const mentorId = req.user._id;

    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    const booking = await MentorBooking.findOne({
      $or: [{ _id: bookingId }, { bookingId }],
      mentorId,
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only submit feedback for completed sessions' });
    }

    booking.mentorFeedback = {
      text: feedback.trim(),
      submittedAt: new Date(),
    };
    await booking.save();

    res.json({
      message: 'Feedback submitted successfully',
      mentorFeedback: booking.mentorFeedback,
    });
  } catch (error) {
    console.error('Error submitting mentor feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

module.exports = exports;
