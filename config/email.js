const FRONTEND_URL = process.env.FRONTEND_URL;
const COMPANY_NAME = 'Skill-Pilot Career Guidance';

const emailStyles = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 0; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #ffffff; padding: 40px 30px; }
    .otp-box { background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%); border: 3px solid #667eea; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center; }
    .otp-code { font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #667eea; text-align: center; padding: 25px; background: white; border-radius: 12px; margin: 20px 0; font-family: 'Courier New', monospace; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .info-box { background: #f8f9ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f5f5f5; }
    .expiry { background: #fff3cd; padding: 12px; border-radius: 8px; margin: 15px 0; color: #856404; font-size: 14px; font-weight: 600; }
  </style>
`;

/**
 * OTP Email Template
 */
const otpEmail = (name, otp, validityMinutes = 10) => ({
  subject: `🔐 Your Verification Code - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Verification Code</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}! 👋</h2>
          <p>You requested a verification code for your account. Use the code below to complete your request:</p>
          
          <div class="otp-box">
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #4a5568;">Your Verification Code:</p>
            <div class="otp-code">${otp}</div>
            <div class="expiry">
              ⏰ This code expires in ${validityMinutes} minutes
            </div>
          </div>
          
          <div class="warning-box">
            <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
            <ul style="margin: 10px 0 0 20px; padding: 0;">
              <li>Never share this code with anyone</li>
              <li>Our team will never ask for your verification code</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The ${COMPANY_NAME} Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply.</p>
          <p>&copy; 2025 ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${name}!\n\nYour verification code is: ${otp}\n\nThis code expires in ${validityMinutes} minutes.\n\nNever share this code with anyone.\n\nBest regards,\n${COMPANY_NAME} Team`,
});

/**
 * Password Reset Success Email
 */
const passwordResetSuccess = name => ({
  subject: `✅ Password Reset Successful - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Changed</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}! 👋</h2>
          
          <div class="success-box">
            <p style="margin: 0; font-size: 18px;">✅ Your password has been successfully reset!</p>
          </div>
          
          <p>Your account password was changed successfully. You can now log in with your new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/login" class="button">
              🚀 Login to Your Account
            </a>
          </div>
          
          <div class="warning-box">
            <p style="margin: 0;"><strong>⚠️ Didn't make this change?</strong></p>
            <p style="margin: 10px 0 0 0;">If you didn't reset your password, please contact our support team immediately to secure your account.</p>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The ${COMPANY_NAME} Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${name}!\n\nYour password has been successfully reset!\n\nYou can now log in with your new password at: ${FRONTEND_URL}/login\n\nIf you didn't make this change, contact support immediately.\n\nBest regards,\n${COMPANY_NAME} Team`,
});

/**
 * Account Locked Email
 */
const accountLockedEmail = (name, unlockTime) => ({
  subject: `🔒 Account Temporarily Locked - ${COMPANY_NAME}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Account Locked</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <div class="warning-box">
            <p style="margin: 0; font-size: 18px;"><strong>⚠️ Your account has been temporarily locked</strong></p>
          </div>
          
          <p>Due to multiple failed login attempts, your account has been temporarily locked for security purposes.</p>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>📅 Unlock Time:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">${unlockTime}</p>
          </div>
          
          <p><strong>What you can do:</strong></p>
          <ul>
            <li>Wait for the lock period to expire (approximately 2 hours)</li>
            <li>Use the "Forgot Password" feature to reset your password immediately</li>
            <li>Contact our support team if you need assistance</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/forgot-password" class="button">
              🔐 Reset Password
            </a>
          </div>
          
          <p style="margin-top: 30px;">Stay secure,<br><strong>The ${COMPANY_NAME} Security Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${name},\n\nYour account has been temporarily locked due to multiple failed login attempts.\n\nUnlock Time: ${unlockTime}\n\nYou can:\n- Wait for the lock period to expire\n- Reset your password at: ${FRONTEND_URL}/forgot-password\n\nStay secure,\n${COMPANY_NAME} Security Team`,
});

module.exports = {
  emailTemplates: {
    otpEmail,
    passwordResetSuccess,
    accountLockedEmail,
  },
};
