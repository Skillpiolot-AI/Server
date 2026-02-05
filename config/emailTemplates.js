/**
 * SkillPilot Email Templates
 * Simple, clean email templates for all user management scenarios
 */

const FRONTEND_URL = process.env.FRONTEND_URL;
const LOGO = 'SkillPilot';
const TAGLINE = 'Your Career Guidance Partner';
const SUPPORT_EMAIL = 'support@skillpilot.in';
const COMPANY_NAME = 'SkillPilot';

// Simple header for emails
const Header = () => `
  <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-family: Arial, sans-serif;">${LOGO}</h1>
    <p style="color: #E0E7FF; margin: 5px 0 0 0; font-size: 14px;">${TAGLINE}</p>
  </div>
`;

// Simple footer for emails
const Footer = () => `
  <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-family: Arial, sans-serif;">
    <p style="margin: 0; color: #6B7280; font-size: 12px;">© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
    <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 12px;">Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #4F46E5;">${SUPPORT_EMAIL}</a></p>
  </div>
`;

// Create email template wrapper
const createEmailTemplate = (subject, htmlContent, textContent) => ({
  subject,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${htmlContent}
      </div>
    </body>
    </html>
  `,
  text: textContent
});

// Admin created welcome email
const adminCreatedWelcome = (name, username, email, tempPassword) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #1F2937; margin-bottom: 20px;">Welcome to ${COMPANY_NAME}!</h2>
      <p style="color: #4B5563;">Hello ${name},</p>
      <p style="color: #4B5563;">Your account has been created by an administrator. Here are your login credentials:</p>
      
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      
      <p style="color: #DC2626; font-weight: bold;">Please change your password after logging in.</p>
      
      <a href="${FRONTEND_URL}/login" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Login Now</a>
      
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Welcome to ${COMPANY_NAME}!\n\nHello ${name},\n\nYour account has been created. Here are your credentials:\n\nUsername: ${username}\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease change your password after logging in.\n\nLogin at: ${FRONTEND_URL}/login\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Welcome to ${COMPANY_NAME}!`, htmlContent, textContent);
};

// Admin created verification email
const adminCreatedVerification = (name, otp) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #1F2937; margin-bottom: 20px;">Verify Your Email</h2>
      <p style="color: #4B5563;">Hello ${name},</p>
      <p style="color: #4B5563;">Please use the following verification code to verify your email:</p>
      
      <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
      </div>
      
      <p style="color: #6B7280;">This code expires in 10 minutes.</p>
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Verify Your Email\n\nHello ${name},\n\nYour verification code: ${otp}\n\nThis code expires in 10 minutes.\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Verify Your Email - ${COMPANY_NAME}`, htmlContent, textContent);
};

// Account deleted email
const accountDeletedEmail = (name, reason) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #DC2626; margin-bottom: 20px;">Account Deleted</h2>
      <p style="color: #4B5563;">Dear ${name},</p>
      <p style="color: #4B5563;">Your ${COMPANY_NAME} account has been deleted by an administrator.</p>
      
      ${reason ? `<p style="color: #4B5563;"><strong>Reason:</strong> ${reason}</p>` : ''}
      
      <p style="color: #6B7280;">If you believe this was a mistake, please contact our support team.</p>
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Account Deleted\n\nDear ${name},\n\nYour ${COMPANY_NAME} account has been deleted by an administrator.\n\n${reason ? `Reason: ${reason}\n\n` : ''}If you believe this was a mistake, please contact our support team.\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Account Deleted - ${COMPANY_NAME}`, htmlContent, textContent);
};

// Account unverified email
const accountUnverifiedEmail = (name, reason) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #F59E0B; margin-bottom: 20px;">Account Unverified</h2>
      <p style="color: #4B5563;">Dear ${name},</p>
      <p style="color: #4B5563;">Your ${COMPANY_NAME} account has been marked as unverified by an administrator.</p>
      
      ${reason ? `<p style="color: #4B5563;"><strong>Reason:</strong> ${reason}</p>` : ''}
      
      <p style="color: #4B5563;">You will need to verify your email again to access your account.</p>
      
      <a href="${FRONTEND_URL}/verify-email" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Verify Email</a>
      
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Account Unverified\n\nDear ${name},\n\nYour ${COMPANY_NAME} account has been marked as unverified.\n\n${reason ? `Reason: ${reason}\n\n` : ''}Please verify your email at: ${FRONTEND_URL}/verify-email\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Account Unverified - ${COMPANY_NAME}`, htmlContent, textContent);
};

// Role changed email
const roleChangedEmail = (name, oldRole, newRole, reason) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #1F2937; margin-bottom: 20px;">Role Updated</h2>
      <p style="color: #4B5563;">Dear ${name},</p>
      <p style="color: #4B5563;">Your account role has been updated.</p>
      
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Previous Role:</strong> ${oldRole}</p>
        <p style="margin: 5px 0;"><strong>New Role:</strong> ${newRole}</p>
      </div>
      
      ${reason ? `<p style="color: #4B5563;"><strong>Reason:</strong> ${reason}</p>` : ''}
      
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Role Updated\n\nDear ${name},\n\nYour account role has been updated.\n\nPrevious Role: ${oldRole}\nNew Role: ${newRole}\n${reason ? `\nReason: ${reason}` : ''}\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Role Updated - ${COMPANY_NAME}`, htmlContent, textContent);
};

// Account deactivated email
const accountDeactivatedEmail = (name, reason) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #DC2626; margin-bottom: 20px;">Account Deactivated</h2>
      <p style="color: #4B5563;">Dear ${name},</p>
      <p style="color: #4B5563;">Your ${COMPANY_NAME} account has been deactivated by an administrator.</p>
      
      ${reason ? `<p style="color: #4B5563;"><strong>Reason:</strong> ${reason}</p>` : ''}
      
      <p style="color: #6B7280;">If you believe this was a mistake, please contact our support team.</p>
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Account Deactivated\n\nDear ${name},\n\nYour ${COMPANY_NAME} account has been deactivated.\n\n${reason ? `Reason: ${reason}\n\n` : ''}If you believe this was a mistake, please contact support.\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Account Deactivated - ${COMPANY_NAME}`, htmlContent, textContent);
};

// Account reactivated email
const accountReactivatedEmail = (name) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #10B981; margin-bottom: 20px;">Account Reactivated</h2>
      <p style="color: #4B5563;">Dear ${name},</p>
      <p style="color: #4B5563;">Great news! Your ${COMPANY_NAME} account has been reactivated.</p>
      <p style="color: #4B5563;">You can now log in and access all features.</p>
      
      <a href="${FRONTEND_URL}/login" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Login Now</a>
      
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Account Reactivated\n\nDear ${name},\n\nGreat news! Your ${COMPANY_NAME} account has been reactivated.\n\nYou can now log in at: ${FRONTEND_URL}/login\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Account Reactivated - ${COMPANY_NAME}`, htmlContent, textContent);
};

// Temp password reminder email
const tempPasswordReminderEmail = (name, daysRemaining) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #F59E0B; margin-bottom: 20px;">Password Change Reminder</h2>
      <p style="color: #4B5563;">Dear ${name},</p>
      <p style="color: #4B5563;">This is a reminder that you are still using a temporary password.</p>
      
      <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <p style="margin: 0; color: #92400E;"><strong>Please change your password within ${daysRemaining} days.</strong></p>
      </div>
      
      <a href="${FRONTEND_URL}/change-password" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Change Password</a>
      
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Password Change Reminder\n\nDear ${name},\n\nThis is a reminder that you are still using a temporary password.\n\nPlease change your password within ${daysRemaining} days.\n\nChange password at: ${FRONTEND_URL}/change-password\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Password Change Reminder - ${COMPANY_NAME}`, htmlContent, textContent);
};

// Google welcome template
const googleWelcomeTemplate = (name, email, username) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #1F2937; margin-bottom: 20px;">Welcome to ${COMPANY_NAME}!</h2>
      <p style="color: #4B5563;">Hello ${name},</p>
      <p style="color: #4B5563;">Thank you for joining ${COMPANY_NAME}! Your account has been created successfully using Google Sign-In.</p>
      
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
      </div>
      
      <p style="color: #4B5563;">You can now explore all the features we offer:</p>
      <ul style="color: #4B5563;">
        <li>Career assessments and recommendations</li>
        <li>Mentorship booking</li>
        <li>Skill development resources</li>
        <li>Industry insights and guidance</li>
      </ul>
      
      <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Go to Dashboard</a>
      
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Welcome to ${COMPANY_NAME}!\n\nHello ${name},\n\nThank you for joining ${COMPANY_NAME} using Google Sign-In!\n\nYour account details:\nUsername: ${username}\nEmail: ${email}\n\nExplore our features:\n- Career assessments and recommendations\n- Mentorship booking\n- Skill development resources\n- Industry insights and guidance\n\nVisit your dashboard: ${FRONTEND_URL}/dashboard\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Welcome to ${COMPANY_NAME}!`, htmlContent, textContent);
};

// Email change OTP template
const emailChangeOTPTemplate = (name, newEmail, otp) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #1F2937; margin-bottom: 20px;">Email Change Verification</h2>
      <p style="color: #4B5563;">Hello ${name},</p>
      <p style="color: #4B5563;">You've requested to change your email to: <strong>${newEmail}</strong></p>
      
      <p style="color: #4B5563;">Your verification code:</p>
      <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
      </div>
      
      <p style="color: #6B7280;">This code expires in 10 minutes.</p>
      <p style="color: #DC2626;">If you didn't request this change, please ignore this email.</p>
      
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Email Change Verification\n\nHello ${name},\n\nYou've requested to change your email to: ${newEmail}\n\nYour verification code: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this message.\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Email Change Verification - ${COMPANY_NAME}`, htmlContent, textContent);
};

// Email change confirmation template
const emailChangeConfirmationTemplate = (name, oldEmail, newEmail) => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #10B981; margin-bottom: 20px;">Email Changed Successfully</h2>
      <p style="color: #4B5563;">Hello ${name},</p>
      <p style="color: #4B5563;">Your ${COMPANY_NAME} account email has been successfully changed.</p>
      
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Previous Email:</strong> <span style="text-decoration: line-through; color: #9CA3AF;">${oldEmail}</span></p>
        <p style="margin: 5px 0;"><strong>New Email:</strong> <span style="color: #10B981;">${newEmail}</span></p>
      </div>
      
      <p style="color: #DC2626;"><strong>Didn't make this change?</strong> Contact our support team immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color: #DC2626;">${SUPPORT_EMAIL}</a></p>
      
      <p style="color: #6B7280; margin-top: 30px;">Best regards,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Email Changed Successfully\n\nHello ${name},\n\nYour ${COMPANY_NAME} account email has been changed.\n\nPrevious Email: ${oldEmail}\nNew Email: ${newEmail}\n\nIf you didn't make this change, contact support immediately at ${SUPPORT_EMAIL}\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Email Changed Successfully - ${COMPANY_NAME}`, htmlContent, textContent);
};

// Self delete account email
const selfDeleteAccountEmail = name => {
  const htmlContent = `
    ${Header()}
    <div style="padding: 30px; font-family: Arial, sans-serif;">
      <h2 style="color: #DC2626; margin-bottom: 20px;">Account Deleted</h2>
      <p style="color: #4B5563;">Dear ${name},</p>
      <p style="color: #4B5563;">As per your request, your ${COMPANY_NAME} account has been permanently deleted. All your data has been removed from our systems.</p>
      
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #4B5563;">We're sad to see you go!</p>
        <p style="margin: 10px 0 0 0; color: #6B7280;">If you change your mind, you're always welcome to create a new account.</p>
      </div>
      
      <p style="color: #4B5563;"><strong>What happens next?</strong></p>
      <ul style="color: #6B7280;">
        <li>All your profile data has been deleted</li>
        <li>Your projects, certifications, and goals are removed</li>
        <li>You will no longer receive emails from us</li>
      </ul>
      
      <p style="color: #6B7280; margin-top: 30px;">Thank you for being part of our journey,<br>${COMPANY_NAME} Team</p>
    </div>
    ${Footer()}
  `;

  const textContent = `Account Deleted\n\nDear ${name},\n\nAs per your request, your ${COMPANY_NAME} account has been permanently deleted.\n\nAll your data has been removed from our systems.\n\nIf you change your mind, you're always welcome to create a new account.\n\nThank you for being part of our journey,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Account Deleted - ${COMPANY_NAME}`, htmlContent, textContent);
};

module.exports = {
  // Admin templates
  adminCreatedWelcome,
  adminCreatedVerification,

  // User management templates
  accountDeletedEmail,
  accountUnverifiedEmail,
  roleChangedEmail,
  accountDeactivatedEmail,
  accountReactivatedEmail,
  tempPasswordReminderEmail,
  googleWelcomeTemplate,

  // Email change & account deletion templates
  emailChangeOTPTemplate,
  emailChangeConfirmationTemplate,
  selfDeleteAccountEmail,

  // Utility exports
  Header,
  Footer,
  createEmailTemplate,
  FRONTEND_URL,
  LOGO,
  TAGLINE,
  SUPPORT_EMAIL,
  COMPANY_NAME,
};
