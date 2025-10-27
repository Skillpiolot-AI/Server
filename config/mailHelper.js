// config/mailHelper.js - Fast and reliable email service with templates

const nodemailer = require('nodemailer');

// Configure transporter for fast delivery
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'no-reply@pratimesh.com',
    pass: 'Ujjwaljha_12'
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 10
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server ready for fast delivery');
  }
});

// Email template styles
const emailStyles = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 0; }
    .header { background: linear-gradient(135deg, #3F3FF3 0%, #2F2FD3 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #ffffff; padding: 40px 30px; }
    .button { display: inline-block; padding: 14px 32px; background: #3F3FF3; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #2F2FD3; }
    .info-box { background: #f8f9ff; border-left: 4px solid #3F3FF3; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f5f5f5; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3F3FF3; text-align: center; padding: 20px; background: #f8f9ff; border-radius: 8px; margin: 20px 0; }
    .location-info { background: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .location-info strong { color: #3F3FF3; }
  </style>
`;

// Fast email sending function
const sendMail = async (to, template) => {
  try {
    console.log(`📧 Sending email to: ${to}`);
    console.log(`📋 Subject: ${template.subject}`);

    const mailOptions = {
      from: {
        name: 'Spark Career Guidance',
        address: 'no-reply@pratimesh.com'
      },
      to: to,
      subject: template.subject,
      text: template.text,
      html: template.html,
      priority: 'high'
    };

    const startTime = Date.now();
    const info = await transporter.sendMail(mailOptions);
    const endTime = Date.now();

    console.log(`✅ Email sent successfully in ${endTime - startTime}ms`);
    console.log(`📨 Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      responseTime: endTime - startTime,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

// Template function: Email Verification
const verificationEmailTemplate = (name, verificationLink, username) => ({
  subject: '✉️ Verify Your Email - Spark Career Guidance',
  html: `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Welcome to Spark!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}! 👋</h2>
          <p>Thank you for signing up with Spark Career Guidance Portal. We're excited to have you on board!</p>
          
          <p><strong>To get started, please verify your email address:</strong></p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" class="button">
              ✅ Verify My Email
            </a>
          </div>
          
          <div class="info-box">
            <p><strong>📋 Verification Details:</strong></p>
            <ul>
              <li>This link will expire in <strong>24 hours</strong></li>
              <li>Click the button above to activate your account</li>
              <li>Once verified, you'll have full access to all features</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; word-break: break-all; font-size: 13px;">
            ${verificationLink}
          </div>
          
          <div class="warning-box" style="margin-top: 30px;">
            <p><strong>⚠️ Didn't sign up?</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The Spark Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply.</p>
          <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${name}!\n\nWelcome to Spark Career Guidance Portal!\n\nPlease verify your email by clicking this link:\n${verificationLink}\n\nThis link expires in 24 hours.\n\nBest regards,\nThe Spark Team`
});

// Template function: Verification Success
const verificationSuccessTemplate = (name) => ({
  subject: '🎉 Email Verified Successfully - Spark',
  html: `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Account Verified!</h1>
        </div>
        <div class="content">
          <h2>Congratulations ${name}! 🎊</h2>
          
          <div class="success-box">
            <p style="margin: 0; font-size: 18px;">✅ Your email has been successfully verified!</p>
          </div>
          
          <p>Your account is now fully activated and ready to use.</p>
          
          <p><strong>What's next?</strong></p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore career assessments</li>
            <li>Connect with mentors</li>
            <li>Access exclusive resources</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/login" class="button">
              🚀 Start Exploring
            </a>
          </div>
          
          <p style="margin-top: 30px;">Welcome aboard!<br><strong>The Spark Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Congratulations ${name}!\n\nYour email has been successfully verified!\n\nYour account is now fully activated. Log in to start exploring!\n\nBest regards,\nThe Spark Team`
});

// Template function: Suspicious Location
const suspiciousLocationTemplate = (name, location, verificationLink, deviceInfo) => ({
  subject: '🔐 New Login Location Detected - Spark',
  html: `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Security Alert</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <div class="warning-box">
            <p style="margin: 0; font-size: 16px;"><strong>⚠️ We detected a login from a new location</strong></p>
          </div>
          
          <p>A login attempt was made to your account from a location we don't recognize.</p>
          
          <div class="location-info">
            <p><strong>📍 Login Details:</strong></p>
            <ul style="margin: 10px 0;">
              <li><strong>Location:</strong> ${location.city}, ${location.region}, ${location.country}</li>
              <li><strong>Device:</strong> ${deviceInfo.device}</li>
              <li><strong>Browser:</strong> ${deviceInfo.browser}</li>
              <li><strong>OS:</strong> ${deviceInfo.os}</li>
              <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <p><strong>Was this you?</strong></p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" class="button" style="background: #28a745;">
              ✅ Yes, It Was Me
            </a>
          </div>
          
          <div class="warning-box" style="margin-top: 30px;">
            <p><strong>🚨 If this wasn't you:</strong></p>
            <ul>
              <li>Change your password immediately</li>
              <li>Review your recent account activity</li>
              <li>Contact our support team</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">Stay safe,<br><strong>The Spark Security Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated security message.</p>
          <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${name},\n\nWe detected a login from a new location:\n\nLocation: ${location.city}, ${location.region}, ${location.country}\nDevice: ${deviceInfo.device}\nBrowser: ${deviceInfo.browser}\n\nWas this you?\nVerify: ${verificationLink}\n\nIf not, secure your account immediately.\n\nBest regards,\nThe Spark Security Team`
});

// Legacy template-based functions for backward compatibility
const sendVerificationEmail = async (email, name, verificationLink, token) => {
  const template = verificationEmailTemplate(name, verificationLink, token);
  return await sendMail(email, template);
};

const sendVerificationSuccessEmail = async (email, name, username) => {
  const template = verificationSuccessTemplate(name);
  return await sendMail(email, template);
};

const sendLocationVerificationEmail = async (email, name, loginDetails, verificationLink) => {
  // Convert old format to new format
  const location = {
    city: loginDetails.location?.city || 'Unknown',
    region: loginDetails.location?.region || 'Unknown',
    country: loginDetails.location?.country || 'Unknown'
  };
  const deviceInfo = {
    device: loginDetails.userAgent || 'Unknown Device',
    browser: 'Unknown',
    os: 'Unknown'
  };
  const template = suspiciousLocationTemplate(name, location, verificationLink, deviceInfo);
  return await sendMail(email, template);
};

const sendLocationVerifiedEmail = async (email, name) => {
  const template = {
    subject: '✅ New Location Verified - Spark',
    html: `
      <!DOCTYPE html>
      <html>
      <head>${emailStyles}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Location Verified</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <div class="success-box">
              <p style="margin: 0; font-size: 16px;">✅ Your new login location has been verified!</p>
            </div>
            
            <p>Thank you for confirming your identity. This location has been added to your trusted devices.</p>
            
            <p style="margin-top: 30px;">Stay secure,<br><strong>The Spark Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${name},\n\nYour new login location has been verified successfully!\n\nStay secure,\nThe Spark Team`
  };
  return await sendMail(email, template);
};

module.exports = {
  transporter,
  sendMail,
  sendEmailFast: sendMail, // ✅ Alias for compatibility
  // Template functions
  verificationEmailTemplate,
  verificationSuccessTemplate,
  suspiciousLocationTemplate,
  // Legacy functions
  sendVerificationEmail,
  sendVerificationSuccessEmail,
  sendLocationVerificationEmail,
  sendLocationVerifiedEmail
};