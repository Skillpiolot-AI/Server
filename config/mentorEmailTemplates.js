// config/mentorEmailTemplates.js
// Simple email templates for SkillPilot mentor system

const FRONTEND_URL = process.env.FRONTEND_URL;
const COMPANY_NAME = 'SkillPilot';
const SUPPORT_EMAIL = 'support@skillpilot.in';

// Simple header
const professionalHeader = () => `
  <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-family: Arial, sans-serif;">${COMPANY_NAME}</h1>
    <p style="color: #E0E7FF; margin: 5px 0 0 0; font-size: 14px;">Your Career Guidance Partner</p>
  </div>
`;

// Simple footer
const professionalFooter = () => `
  <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-family: Arial, sans-serif;">
    <p style="margin: 0; color: #6B7280; font-size: 12px;">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
    <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 12px;">Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #4F46E5;">${SUPPORT_EMAIL}</a></p>
  </div>
`;

// Application submitted template
const applicationSubmittedTemplate = mentorName => ({
  subject: `Application Received - ${COMPANY_NAME} Mentor Program`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${professionalHeader()}
        <div style="padding: 30px;">
          <h2 style="color: #1F2937; margin-bottom: 20px;">Application Received</h2>
          <p style="color: #4B5563;">Dear ${mentorName},</p>
          <p style="color: #4B5563;">Thank you for applying to become a mentor at ${COMPANY_NAME}!</p>
          <p style="color: #4B5563;">We have received your application and our team will review it shortly. You will receive an email once a decision has been made.</p>
          
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #4B5563;"><strong>What's next?</strong></p>
            <ul style="color: #6B7280; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Our team will review your application</li>
              <li>We may reach out for additional information</li>
              <li>You'll receive a decision via email</li>
            </ul>
          </div>
          
          <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
        ${professionalFooter()}
      </div>
    </body>
    </html>
  `,
  text: `Application Received\n\nDear ${mentorName},\n\nThank you for applying to become a mentor at ${COMPANY_NAME}!\n\nWe have received your application and our team will review it shortly.\n\nBest regards,\n${COMPANY_NAME} Team`,
});

// Application approved template
const applicationApprovedTemplate = (mentorName, loginUrl) => ({
  subject: `Congratulations! Your Mentor Application is Approved - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${professionalHeader()}
        <div style="padding: 30px;">
          <h2 style="color: #10B981; margin-bottom: 20px;">🎉 Congratulations!</h2>
          <p style="color: #4B5563;">Dear ${mentorName},</p>
          <p style="color: #4B5563;">We are thrilled to inform you that your application to become a mentor at ${COMPANY_NAME} has been <strong style="color: #10B981;">approved</strong>!</p>
          
          <p style="color: #4B5563;">You can now:</p>
          <ul style="color: #4B5563;">
            <li>Set up your mentor profile</li>
            <li>Define your availability</li>
            <li>Start accepting mentorship sessions</li>
          </ul>
          
          <a href="${loginUrl || FRONTEND_URL + '/mentor/dashboard'}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Go to Mentor Dashboard</a>
          
          <p style="color: #6B7280; margin-top: 30px;">Welcome to the team!<br>${COMPANY_NAME} Team</p>
        </div>
        ${professionalFooter()}
      </div>
    </body>
    </html>
  `,
  text: `Congratulations!\n\nDear ${mentorName},\n\nYour application to become a mentor at ${COMPANY_NAME} has been approved!\n\nYou can now set up your profile and start accepting sessions.\n\nVisit your dashboard: ${loginUrl || FRONTEND_URL + '/mentor/dashboard'}\n\nWelcome to the team!\n${COMPANY_NAME} Team`,
});

// Application rejected template
const applicationRejectedTemplate = (mentorName, reason) => ({
  subject: `Mentor Application Update - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${professionalHeader()}
        <div style="padding: 30px;">
          <h2 style="color: #1F2937; margin-bottom: 20px;">Application Update</h2>
          <p style="color: #4B5563;">Dear ${mentorName},</p>
          <p style="color: #4B5563;">Thank you for your interest in becoming a mentor at ${COMPANY_NAME}.</p>
          <p style="color: #4B5563;">After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
          
          ${
            reason
              ? `
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #4B5563;"><strong>Feedback:</strong></p>
              <p style="margin: 10px 0 0 0; color: #6B7280;">${reason}</p>
            </div>
          `
              : ''
          }
          
          <p style="color: #4B5563;">You are welcome to reapply in the future with updated qualifications.</p>
          
          <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
        ${professionalFooter()}
      </div>
    </body>
    </html>
  `,
  text: `Application Update\n\nDear ${mentorName},\n\nThank you for your interest in becoming a mentor at ${COMPANY_NAME}.\n\nAfter careful review, we are unable to approve your application at this time.\n\n${reason ? `Feedback: ${reason}\n\n` : ''}You are welcome to reapply in the future.\n\nBest regards,\n${COMPANY_NAME} Team`,
});

// More info requested template
const moreInfoRequestedTemplate = (mentorName, requestedInfo) => ({
  subject: `Additional Information Needed - ${COMPANY_NAME} Mentor Application`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${professionalHeader()}
        <div style="padding: 30px;">
          <h2 style="color: #F59E0B; margin-bottom: 20px;">Additional Information Needed</h2>
          <p style="color: #4B5563;">Dear ${mentorName},</p>
          <p style="color: #4B5563;">Thank you for your application to become a mentor at ${COMPANY_NAME}.</p>
          <p style="color: #4B5563;">To continue processing your application, we need the following additional information:</p>
          
          <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="margin: 0; color: #92400E;">${requestedInfo}</p>
          </div>
          
          <p style="color: #4B5563;">Please reply to this email or update your application with the requested information.</p>
          
          <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
        ${professionalFooter()}
      </div>
    </body>
    </html>
  `,
  text: `Additional Information Needed\n\nDear ${mentorName},\n\nThank you for your application to become a mentor at ${COMPANY_NAME}.\n\nWe need the following additional information:\n\n${requestedInfo}\n\nPlease reply to this email with the requested information.\n\nBest regards,\n${COMPANY_NAME} Team`,
});

// Session booked template (for mentor)
const sessionBookedMentorTemplate = (
  mentorName,
  menteeName,
  sessionDate,
  sessionTime,
  meetingLink
) => ({
  subject: `New Session Booked - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${professionalHeader()}
        <div style="padding: 30px;">
          <h2 style="color: #1F2937; margin-bottom: 20px;">New Session Booked</h2>
          <p style="color: #4B5563;">Dear ${mentorName},</p>
          <p style="color: #4B5563;">A new mentorship session has been booked with you.</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Mentee:</strong> ${menteeName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionTime}</p>
            ${meetingLink ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #4F46E5;">${meetingLink}</a></p>` : ''}
          </div>
          
          <a href="${FRONTEND_URL}/mentor/sessions" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Session Details</a>
          
          <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
        ${professionalFooter()}
      </div>
    </body>
    </html>
  `,
  text: `New Session Booked\n\nDear ${mentorName},\n\nA new mentorship session has been booked with you.\n\nMentee: ${menteeName}\nDate: ${sessionDate}\nTime: ${sessionTime}\n${meetingLink ? `Meeting Link: ${meetingLink}\n` : ''}\nView session: ${FRONTEND_URL}/mentor/sessions\n\nBest regards,\n${COMPANY_NAME} Team`,
});

// Session booked template (for mentee)
const sessionBookedMenteeTemplate = (
  menteeName,
  mentorName,
  sessionDate,
  sessionTime,
  meetingLink
) => ({
  subject: `Session Confirmed - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${professionalHeader()}
        <div style="padding: 30px;">
          <h2 style="color: #10B981; margin-bottom: 20px;">Session Confirmed!</h2>
          <p style="color: #4B5563;">Dear ${menteeName},</p>
          <p style="color: #4B5563;">Your mentorship session has been confirmed.</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Mentor:</strong> ${mentorName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionTime}</p>
            ${meetingLink ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #4F46E5;">${meetingLink}</a></p>` : ''}
          </div>
          
          <a href="${FRONTEND_URL}/sessions" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View My Sessions</a>
          
          <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
        ${professionalFooter()}
      </div>
    </body>
    </html>
  `,
  text: `Session Confirmed!\n\nDear ${menteeName},\n\nYour mentorship session has been confirmed.\n\nMentor: ${mentorName}\nDate: ${sessionDate}\nTime: ${sessionTime}\n${meetingLink ? `Meeting Link: ${meetingLink}\n` : ''}\nView sessions: ${FRONTEND_URL}/sessions\n\nBest regards,\n${COMPANY_NAME} Team`,
});

// Session cancelled template
const sessionCancelledTemplate = (
  recipientName,
  sessionDate,
  sessionTime,
  cancelledBy,
  reason
) => ({
  subject: `Session Cancelled - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${professionalHeader()}
        <div style="padding: 30px;">
          <h2 style="color: #DC2626; margin-bottom: 20px;">Session Cancelled</h2>
          <p style="color: #4B5563;">Dear ${recipientName},</p>
          <p style="color: #4B5563;">We regret to inform you that your scheduled session has been cancelled.</p>
          
          <div style="background-color: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionTime}</p>
            <p style="margin: 5px 0;"><strong>Cancelled by:</strong> ${cancelledBy}</p>
            ${reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          <p style="color: #4B5563;">You can book a new session at your convenience.</p>
          
          <a href="${FRONTEND_URL}/mentors" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Book New Session</a>
          
          <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
        ${professionalFooter()}
      </div>
    </body>
    </html>
  `,
  text: `Session Cancelled\n\nDear ${recipientName},\n\nYour scheduled session has been cancelled.\n\nDate: ${sessionDate}\nTime: ${sessionTime}\nCancelled by: ${cancelledBy}\n${reason ? `Reason: ${reason}\n` : ''}\nBook a new session: ${FRONTEND_URL}/mentors\n\nBest regards,\n${COMPANY_NAME} Team`,
});

// Session reminder template
const sessionReminderTemplate = (
  recipientName,
  otherPartyName,
  sessionDate,
  sessionTime,
  meetingLink,
  isMentor
) => ({
  subject: `Session Reminder - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${professionalHeader()}
        <div style="padding: 30px;">
          <h2 style="color: #F59E0B; margin-bottom: 20px;">⏰ Session Reminder</h2>
          <p style="color: #4B5563;">Dear ${recipientName},</p>
          <p style="color: #4B5563;">This is a reminder about your upcoming mentorship session.</p>
          
          <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="margin: 5px 0;"><strong>${isMentor ? 'Mentee' : 'Mentor'}:</strong> ${otherPartyName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionTime}</p>
            ${meetingLink ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #4F46E5;">${meetingLink}</a></p>` : ''}
          </div>
          
          ${meetingLink ? `<a href="${meetingLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Join Session</a>` : ''}
          
          <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
        </div>
        ${professionalFooter()}
      </div>
    </body>
    </html>
  `,
  text: `Session Reminder\n\nDear ${recipientName},\n\nThis is a reminder about your upcoming mentorship session.\n\n${isMentor ? 'Mentee' : 'Mentor'}: ${otherPartyName}\nDate: ${sessionDate}\nTime: ${sessionTime}\n${meetingLink ? `Meeting Link: ${meetingLink}\n` : ''}\nBest regards,\n${COMPANY_NAME} Team`,
});

module.exports = {
  applicationSubmittedTemplate,
  applicationApprovedTemplate,
  applicationRejectedTemplate,
  moreInfoRequestedTemplate,
  sessionBookedMentorTemplate,
  sessionBookedMenteeTemplate,
  sessionCancelledTemplate,
  sessionReminderTemplate,
  professionalHeader,
  professionalFooter,
  COMPANY_NAME,
  FRONTEND_URL,
};
