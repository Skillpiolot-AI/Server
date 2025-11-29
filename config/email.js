// const nodemailer = require('nodemailer');

// // Email configuration
// const emailConfig = {
//   host: 'smtp.hostinger.com',
//   port: 465,
//   secure: true, // ✅ must be true for SSL
//   auth: {
//     user: 'no-reply@pratimesh.com',
//     pass: 'Ujjwaljha_12'
//   }
// };
// // Create reusable transporter
// const transporter = nodemailer.createTransport(emailConfig);

// // Verify transporter configuration
// transporter.verify(function (error, success) {
//     if (error) {
//         console.error('Email configuration error:', error);
//     } else {
//         console.log('Email server is ready to send messages');
//     }
// });

// // Email templates
// const emailTemplates = {
//     // OTP Email Template
//     otpEmail: (name, otp, expiryMinutes = 10) => ({
//         subject: 'Password Reset OTP - Spark Career Guidance',
//         html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .header { background-color: #3F3FF3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
//           .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
//           .otp-box { background-color: white; border: 2px dashed #3F3FF3; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
//           .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3F3FF3; }
//           .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
//           .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
//           .button { display: inline-block; padding: 12px 30px; background-color: #3F3FF3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>Password Reset Request</h1>
//           </div>
//           <div class="content">
//             <p>Hello ${name},</p>
//             <p>We received a request to reset your password for your Spark Career Guidance account.</p>

//             <div class="otp-box">
//               <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your OTP Code:</p>
//               <div class="otp-code">${otp}</div>
//               <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for ${expiryMinutes} minutes</p>
//             </div>

//             <p>Enter this code on the password reset page to continue. If you didn't request this, please ignore this email.</p>

//             <div class="warning">
//               <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
//             </div>

//             <p style="margin-top: 30px;">Best regards,<br>Spark Career Guidance Team</p>
//           </div>
//           <div class="footer">
//             <p>This is an automated email. Please do not reply to this message.</p>
//             <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `,
//         text: `Hello ${name},\n\nYour OTP for password reset is: ${otp}\n\nThis code will expire in ${expiryMinutes} minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nSpark Career Guidance Team`
//     }),

//     // Password Reset Success Email
//     passwordResetSuccess: (name) => ({
//         subject: 'Password Successfully Reset - Spark Career Guidance',
//         html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
//           .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
//           .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
//           .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>Password Reset Successful</h1>
//           </div>
//           <div class="content">
//             <div class="success-icon">✅</div>
//             <p>Hello ${name},</p>
//             <p>Your password has been successfully reset. You can now log in with your new password.</p>
//             <p>If you did not make this change, please contact our support team immediately.</p>
//             <p style="margin-top: 30px;">Best regards,<br>Spark Career Guidance Team</p>
//           </div>
//           <div class="footer">
//             <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `,
//         text: `Hello ${name},\n\nYour password has been successfully reset. You can now log in with your new password.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nSpark Career Guidance Team`
//     }),

//     // Welcome Email
//     welcomeEmail: (name, username) => ({
//         subject: 'Welcome to Spark Career Guidance!',
//         html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .header { background-color: #3F3FF3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
//           .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
//           .features { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
//           .feature-item { margin: 15px 0; padding-left: 25px; position: relative; }
//           .feature-item:before { content: "✓"; position: absolute; left: 0; color: #3F3FF3; font-weight: bold; }
//           .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>Welcome to Spark!</h1>
//           </div>
//           <div class="content">
//             <p>Hello ${name},</p>
//             <p>Welcome to Spark Career Guidance Portal! We're excited to have you on board.</p>
//             <p>Your username: <strong>${username}</strong></p>

//             <div class="features">
//               <h3>What you can do:</h3>
//               <div class="feature-item">Access personalized career assessments</div>
//               <div class="feature-item">Connect with industry mentors</div>
//               <div class="feature-item">Explore exclusive job listings</div>
//               <div class="feature-item">Access continuous learning resources</div>
//             </div>

//             <p>Get started by logging in and completing your profile!</p>
//             <p style="margin-top: 30px;">Best regards,<br>Spark Career Guidance Team</p>
//           </div>
//           <div class="footer">
//             <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `,
//         text: `Hello ${name},\n\nWelcome to Spark Career Guidance Portal!\n\nYour username: ${username}\n\nGet started by logging in and completing your profile!\n\nBest regards,\nSpark Career Guidance Team`
//     })
// };

// // Function to send email
// const sendEmail = async (to, template) => {
//     try {
//         const mailOptions = {
//             from: '"OTP-Verification" <no-reply@pratimesh.com>',
//             to: to,
//             subject: template.subject,
//             text: template.text,
//             html: template.html
//         };

//         const info = await transporter.sendMail(mailOptions);

//         console.log('Email sent successfully');
//         console.log('Message ID:', info.messageId);
//         console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

//         return {
//             success: true,
//             messageId: info.messageId,
//             previewUrl: nodemailer.getTestMessageUrl(info)
//         };
//     } catch (error) {
//         console.error('Error sending email:', error);
//         throw error;
//     }
// };

// module.exports = {
//     transporter,
//     emailTemplates,
//     sendEmail
// };


// config/email.js
// OTP and password reset email templates

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
  text: `Hello ${name}!\n\nYour verification code is: ${otp}\n\nThis code expires in ${validityMinutes} minutes.\n\nNever share this code with anyone.\n\nBest regards,\n${COMPANY_NAME} Team`
});

/**
 * Password Reset Success Email
 */
const passwordResetSuccess = (name) => ({
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
  text: `Hello ${name}!\n\nYour password has been successfully reset!\n\nYou can now log in with your new password at: ${FRONTEND_URL}/login\n\nIf you didn't make this change, contact support immediately.\n\nBest regards,\n${COMPANY_NAME} Team`
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
  text: `Hello ${name},\n\nYour account has been temporarily locked due to multiple failed login attempts.\n\nUnlock Time: ${unlockTime}\n\nYou can:\n- Wait for the lock period to expire\n- Reset your password at: ${FRONTEND_URL}/forgot-password\n\nStay secure,\n${COMPANY_NAME} Security Team`
});

module.exports = {
  emailTemplates: {
    otpEmail,
    passwordResetSuccess,
    accountLockedEmail
  }
};
