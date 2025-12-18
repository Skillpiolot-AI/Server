// jobs/bookingReminders.js - Scheduled job for booking reminders

const cron = require('node-cron');
const MentorBooking = require('../models/MentorBooking');
const User = require('../models/User');
const { sendEmailFast } = require('../config/mailHelper');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Reminder intervals in minutes
const REMINDER_INTERVALS = {
  oneHour: 60,
  thirtyMin: 30,
  tenMin: 10,
  fiveMin: 5,
  twoMin: 2,
};

/**
 * Send reminder email to user
 */
const sendUserReminder = async (booking, minutesLeft, user, mentor) => {
  const timeText = minutesLeft === 60 ? '1 hour' : `${minutesLeft} minutes`;

  await sendEmailFast(user.email, {
    subject: `⏰ Reminder: Your session starts in ${timeText}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3F3FF3 0%, #2F2FD3 100%); color: white; padding: 30px; text-align: center;">
          <h1>⏰ Session Reminder</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2>Hello ${user.name}!</h2>
          <p>Your mentorship session with <strong>${mentor.name}</strong> starts in <strong>${timeText}</strong>.</p>
          
          <div style="background: #f8f9ff; border-left: 4px solid #3F3FF3; padding: 15px; margin: 20px 0;">
            <p><strong>📅 Time:</strong> ${booking.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>⏱️ Duration:</strong> ${booking.duration} minutes</p>
          </div>
          
          ${
            booking.meetingLink
              ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${booking.meetingLink}" style="display: inline-block; padding: 14px 32px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">🎯 Join Meeting</a>
            </div>
          `
              : `
            <p style="color: #666;">Your mentor will share the meeting link shortly.</p>
          `
          }
          
          <p>Best regards,<br><strong>The Skill-Pilot Team</strong></p>
        </div>
      </div>
    `,
    text: `Hello ${user.name}!\n\nYour session with ${mentor.name} starts in ${timeText}.\n\n${booking.meetingLink ? `Join: ${booking.meetingLink}` : 'Meeting link will be shared shortly.'}\n\nBest regards,\nThe Skill-Pilot Team`,
  });
};

/**
 * Send reminder email to mentor
 */
const sendMentorReminder = async (booking, minutesLeft, user, mentor) => {
  const timeText = minutesLeft === 60 ? '1 hour' : `${minutesLeft} minutes`;

  // At 2 min mark, include meeting link prompt
  const isTwoMinReminder = minutesLeft === 2;

  // Generate token for meeting link page
  let meetingLinkToken = null;
  if (isTwoMinReminder && !booking.meetingLink) {
    meetingLinkToken = booking.generateMeetingLinkToken();
    await booking.save();
  }

  const meetingLinkUrl = meetingLinkToken
    ? `${FRONTEND_URL}/mentor/send-meeting-link?token=${meetingLinkToken}&bookingId=${booking.bookingId}`
    : null;

  await sendEmailFast(mentor.email, {
    subject: isTwoMinReminder
      ? '🚨 Session in 2 min - Send Meeting Link Now!'
      : `⏰ Reminder: Session in ${timeText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${isTwoMinReminder ? '#dc3545' : '#28a745'} 0%, ${isTwoMinReminder ? '#c82333' : '#20c997'} 100%); color: white; padding: 30px; text-align: center;">
          <h1>${isTwoMinReminder ? '🚨 Session Starting!' : '⏰ Session Reminder'}</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2>Hello ${mentor.name}!</h2>
          <p>Your session with <strong>${user.name}</strong> starts in <strong>${timeText}</strong>.</p>
          
          <div style="background: #f8f9ff; border-left: 4px solid #3F3FF3; padding: 15px; margin: 20px 0;">
            <p><strong>👤 Student:</strong> ${user.name}</p>
            <p><strong>📅 Time:</strong> ${booking.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>⏱️ Duration:</strong> ${booking.duration} minutes</p>
            ${booking.remark ? `<p><strong>📝 Topic:</strong> ${booking.remark}</p>` : ''}
          </div>
          
          ${
            isTwoMinReminder && !booking.meetingLink
              ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p><strong>⚠️ Action Required:</strong> Please share your meeting link with the student!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${meetingLinkUrl}" style="display: inline-block; padding: 16px 40px; background: #dc3545; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px;">🔗 Send Meeting Link Now</a>
            </div>
          `
              : booking.meetingLink
                ? `
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
              <p>✅ Meeting link already shared</p>
            </div>
          `
                : ''
          }
          
          <p>Best regards,<br><strong>The Skill-Pilot Team</strong></p>
        </div>
      </div>
    `,
    text: `Hello ${mentor.name}!\n\nYour session with ${user.name} starts in ${timeText}.\n\n${isTwoMinReminder && !booking.meetingLink ? `Send meeting link: ${meetingLinkUrl}` : ''}\n\nBest regards,\nThe Skill-Pilot Team`,
  });
};

/**
 * Process reminders for a booking
 */
const processReminders = async booking => {
  const now = new Date();
  const scheduledAt = new Date(booking.scheduledAt);
  const minutesUntilSession = Math.round((scheduledAt - now) / 60000);

  // Get user and mentor details
  const [user, mentor] = await Promise.all([
    User.findById(booking.userId).select('name email'),
    User.findById(booking.mentorId).select('name email'),
  ]);

  if (!user || !mentor) return;

  // Check each reminder interval
  for (const [key, minutes] of Object.entries(REMINDER_INTERVALS)) {
    // Check if this reminder should be sent
    // Send if we're within the window (e.g., between 60 and 55 min for 1hr reminder)
    const windowStart = minutes;
    const windowEnd = minutes - 5;

    if (
      minutesUntilSession <= windowStart &&
      minutesUntilSession > windowEnd &&
      !booking.reminders[key].sent
    ) {
      console.log(`📧 Sending ${key} reminder for booking ${booking.bookingId}`);

      try {
        // Send to user
        await sendUserReminder(booking, minutes, user, mentor);

        // Send to mentor
        await sendMentorReminder(booking, minutes, user, mentor);

        // Mark reminder as sent
        booking.reminders[key].sent = true;
        booking.reminders[key].sentAt = new Date();
        await booking.save();

        console.log(`✅ ${key} reminder sent for ${booking.bookingId}`);
      } catch (error) {
        console.error(`❌ Failed to send ${key} reminder for ${booking.bookingId}:`, error);
      }
    }
  }
};

/**
 * Send rating request email
 */
const sendRatingRequestEmail = async booking => {
  const user = await User.findById(booking.userId).select('name email');
  const mentor = await User.findById(booking.mentorId).select('name');

  if (!user || !mentor) return;

  const ratingUrl = `${FRONTEND_URL}/rate-session/${booking.bookingId}`;

  await sendEmailFast(user.email, {
    subject: '⭐ How was your session? Rate your mentor!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: #333; padding: 30px; text-align: center;">
          <h1>⭐ Rate Your Session</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <h2>Hello ${user.name}!</h2>
          <p>We hope you had a great session with <strong>${mentor.name}</strong>!</p>
          <p>Your feedback helps us improve and helps other students find great mentors.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${ratingUrl}" style="display: inline-block; padding: 16px 40px; background: #ffc107; color: #333; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px;">⭐ Rate Your Session</a>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p><strong>⏰ Note:</strong> Please submit your rating within 48 hours.</p>
          </div>
          
          <p>Thank you for being part of Skill-Pilot!</p>
          <p>Best regards,<br><strong>The Skill-Pilot Team</strong></p>
        </div>
      </div>
    `,
    text: `Hello ${user.name}!\n\nWe hope you had a great session with ${mentor.name}!\n\nPlease rate your session: ${ratingUrl}\n\nSubmit within 48 hours.\n\nBest regards,\nThe Skill-Pilot Team`,
  });
};

/**
 * Process rating requests for completed sessions
 */
const processRatingRequests = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Find completed sessions that need rating request
    const bookings = await MentorBooking.find({
      status: 'completed',
      'ratingRequest.sent': false,
      'rating.submittedAt': { $exists: false },
      completedAt: { $lte: oneHourAgo }, // Wait 1 hour after completion
    });

    for (const booking of bookings) {
      try {
        await sendRatingRequestEmail(booking);

        booking.ratingRequest.sent = true;
        booking.ratingRequest.sentAt = new Date();
        booking.ratingRequest.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await booking.save();

        console.log(`✅ Rating request sent for ${booking.bookingId}`);
      } catch (error) {
        console.error(`❌ Failed to send rating request for ${booking.bookingId}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error processing rating requests:', error);
  }
};

/**
 * Main job function - runs every minute
 */
const runReminderJob = async () => {
  try {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find confirmed bookings scheduled within next 2 hours
    const bookings = await MentorBooking.find({
      status: 'confirmed',
      scheduledAt: { $gte: now, $lte: twoHoursFromNow },
    });

    for (const booking of bookings) {
      await processReminders(booking);
    }

    // Also process rating requests
    await processRatingRequests();
  } catch (error) {
    console.error('❌ Error in reminder job:', error);
  }
};

/**
 * Schedule the reminder job
 */
const scheduleReminders = () => {
  // Run every minute
  cron.schedule('* * * * *', () => {
    runReminderJob();
  });

  console.log('✅ Booking reminder scheduler initialized (runs every minute)');
};

/**
 * Manual trigger for testing
 */
const runNow = async () => {
  console.log('🔧 Manually running reminder job...');
  await runReminderJob();
  return { success: true, message: 'Reminder job completed' };
};

module.exports = {
  scheduleReminders,
  runNow,
  runReminderJob,
};
