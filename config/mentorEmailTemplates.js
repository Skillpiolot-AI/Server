// config/mentorEmailTemplates.js
// Professional email templates for Skill-Pilot mentor system

const FRONTEND_URL = process.env.FRONTEND_URL;
const COMPANY_NAME = 'Skill-Pilot';

// Clean, professional email styles with single border
const professionalStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1a1a1a;
      background: #ffffff;
    }
    .email-wrapper { 
      width: 100%; 
      padding: 40px 20px; 
      background: #ffffff;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
      border: 1px solid #e5e7eb;
    }
    .header { 
      padding: 40px 40px 30px 40px; 
      border-bottom: 1px solid #e5e7eb;
    }
    .logo { 
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
      font-weight: 400;
    }
    .content { 
      padding: 40px; 
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    .text {
      font-size: 15px;
      color: #374151;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .info-box {
      background: #f9fafb;
      padding: 20px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
      min-width: 140px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 15px;
      color: #1a1a1a;
      font-weight: 600;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: #1a1a1a;
      color: #ffffff;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      margin: 24px 0;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #374151;
    }
    .important-box {
      background: #fef3c7;
      padding: 20px;
      margin: 24px 0;
      border-left: 3px solid #f59e0b;
    }
    .important-title {
      font-size: 15px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }
    .important-text {
      font-size: 14px;
      color: #78350f;
      line-height: 1.5;
    }
    .footer { 
      padding: 30px 40px; 
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 24px 0;
    }
  </style>
`;

const emailHeader = () => `
  <div class="header">
    <div class="logo">${COMPANY_NAME}</div>
    <div class="tagline">Professional Career Guidance Platform</div>
  </div>
`;

const emailFooter = () => `
  <div class="footer">
    <div class="footer-text">
      © 2025 ${COMPANY_NAME}. All rights reserved.<br>
      This is an automated message, please do not reply directly to this email.
    </div>
  </div>
`;

// Template: Mentor receives appointment booking notification
const mentorAppointmentBookedEmail = (mentorName, userName, userEmail, appointmentDate) => ({
  subject: `New Appointment Request from ${userName} - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${professionalStyles}
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          ${emailHeader()}
          <div class="content">
            <div class="title">New Mentorship Appointment Request</div>
            
            <p class="text">Hello ${mentorName},</p>
            
            <p class="text">
              You have received a new appointment request from a mentee on ${COMPANY_NAME}.
            </p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Mentee Name</span>
                <span class="info-value">${userName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">${userEmail}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Requested Date</span>
                <span class="info-value">${new Date(appointmentDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
            
            <p class="text">
              Please log in to your mentor dashboard to schedule this meeting and send the details to your mentee.
            </p>
            
            <div style="text-align: center;">
              <a href="${FRONTEND_URL}/mentor-appointments" class="btn">View Appointment Request</a>
            </div>
            
            <div class="divider"></div>
            
            <p class="text">
              Best regards,<br>
              The ${COMPANY_NAME} Team
            </p>
          </div>
          ${emailFooter()}
        </div>
      </div>
    </body>
    </html>
  `,
  text: `New Mentorship Appointment Request\n\nHello ${mentorName},\n\nYou have received a new appointment request from:\n\nMentee: ${userName}\nEmail: ${userEmail}\nRequested Date: ${new Date(appointmentDate).toLocaleDateString()}\n\nPlease log in to schedule this meeting:\n${FRONTEND_URL}/mentor-appointments\n\nBest regards,\nThe ${COMPANY_NAME} Team`
});

// Template: User receives scheduled meeting details
const userMeetingScheduledEmail = (userName, mentorName, scheduledDate, scheduledTime, meetLink) => ({
  subject: `Meeting Scheduled with ${mentorName} - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${professionalStyles}
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          ${emailHeader()}
          <div class="content">
            <div class="title">Your Mentorship Session Has Been Scheduled</div>
            
            <p class="text">Hello ${userName},</p>
            
            <p class="text">
              Great news! Your mentor ${mentorName} has scheduled your mentorship session.
            </p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Mentor</span>
                <span class="info-value">${mentorName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">${new Date(scheduledDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Time</span>
                <span class="info-value">${scheduledTime}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${meetLink}" class="btn">Join Meeting</a>
            </div>
            
            <div class="important-box">
              <div class="important-title">Important Reminders</div>
              <div class="important-text">
                • You will receive reminder emails 24 hours, 12 hours, and 1 hour before the meeting<br>
                • Please join the meeting 5 minutes early to check your connection<br>
                • Have your questions and discussion points ready
              </div>
            </div>
            
            <div class="divider"></div>
            
            <p class="text">
              Looking forward to your session,<br>
              The ${COMPANY_NAME} Team
            </p>
          </div>
          ${emailFooter()}
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Meeting Scheduled with ${mentorName}\n\nHello ${userName},\n\nYour mentorship session has been scheduled!\n\nMentor: ${mentorName}\nDate: ${new Date(scheduledDate).toLocaleDateString()}\nTime: ${scheduledTime}\n\nJoin Meeting: ${meetLink}\n\nReminders:\n- You'll receive reminder emails at 24h, 12h, and 1h before the meeting\n- Join 5 minutes early\n- Prepare your questions\n\nBest regards,\nThe ${COMPANY_NAME} Team`
});

// Template: Meeting reminder (24h, 12h, 1h before)
const meetingReminderEmail = (userName, mentorName, scheduledDateTime, meetLink, hoursRemaining) => ({
  subject: `Reminder: Meeting with ${mentorName} in ${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'} - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${professionalStyles}
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          ${emailHeader()}
          <div class="content">
            <div class="title">Upcoming Mentorship Session Reminder</div>
            
            <p class="text">Hello ${userName},</p>
            
            <p class="text">
              This is a friendly reminder that your mentorship session with ${mentorName} is scheduled in 
              <strong>${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'}</strong>.
            </p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Mentor</span>
                <span class="info-value">${mentorName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date & Time</span>
                <span class="info-value">${new Date(scheduledDateTime).toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${meetLink}" class="btn">Join Meeting</a>
            </div>
            
            ${hoursRemaining === 1 ? `
            <div class="important-box">
              <div class="important-title">Meeting Starts Soon</div>
              <div class="important-text">
                Your session starts in 1 hour. Please ensure:<br>
                • Your internet connection is stable<br>
                • Your camera and microphone are working<br>
                • You have your questions prepared
              </div>
            </div>
            ` : `
            <div class="important-box">
              <div class="important-title">Preparation Tips</div>
              <div class="important-text">
                • Prepare your questions and discussion topics<br>
                • Review any materials shared by your mentor<br>
                • Join 5 minutes early to test your setup
              </div>
            </div>
            `}
            
            <div class="divider"></div>
            
            <p class="text">
              See you soon,<br>
              The ${COMPANY_NAME} Team
            </p>
          </div>
          ${emailFooter()}
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Meeting Reminder - ${hoursRemaining}h before\n\nHello ${userName},\n\nYour mentorship session with ${mentorName} starts in ${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'}.\n\nDate & Time: ${new Date(scheduledDateTime).toLocaleString()}\n\nJoin Meeting: ${meetLink}\n\nBest regards,\nThe ${COMPANY_NAME} Team`
});

module.exports = {
  mentorAppointmentBookedEmail,
  userMeetingScheduledEmail,
  meetingReminderEmail
};