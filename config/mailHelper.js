const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'no-reply@pratimesh.com',
    pass: 'Ujjwaljha_12'
  }
};

// Create reusable transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Email template for account verification
const verificationEmailTemplate = (name, verificationLink, username) => ({
  subject: 'Verify Your Spark Account - Welcome!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3F3FF3; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .verify-box { background-color: white; border: 2px solid #3F3FF3; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .verify-button { display: inline-block; padding: 15px 40px; background-color: #3F3FF3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .verify-button:hover { background-color: #2F2FD3; }
        .info-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .welcome-icon { font-size: 48px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="welcome-icon">🎉</div>
          <h1>Welcome to Spark!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for signing up for Spark Career Guidance Portal! We're excited to have you join our community.</p>
          
          <div class="verify-box">
            <h2 style="color: #3F3FF3; margin-top: 0;">Verify Your Email Address</h2>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <a href="${verificationLink}" class="verify-button">Verify My Account</a>
            <p style="font-size: 12px; color: #666; margin-top: 15px;">This link will expire in 24 hours</p>
          </div>

          <div class="info-box">
            <strong>📝 Your Account Details:</strong><br>
            Username: <strong>${username}</strong><br>
            Email: <strong>${name}</strong>
          </div>

          <p><strong>What happens after verification?</strong></p>
          <ul>
            <li>Full access to personalized career assessments</li>
            <li>Connect with industry mentors</li>
            <li>Access exclusive job listings</li>
            <li>Continuous learning resources</li>
          </ul>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationLink}" style="color: #3F3FF3; word-break: break-all;">${verificationLink}</a>
          </p>

          <p style="margin-top: 20px;">If you didn't create an account, please ignore this email.</p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Spark Career Guidance Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${name},\n\nThank you for signing up for Spark Career Guidance Portal!\n\nPlease verify your email address by clicking this link:\n${verificationLink}\n\nYour username: ${username}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nSpark Career Guidance Team`
});

// Email template for suspicious location login
const suspiciousLocationTemplate = (name, location, verificationLink, deviceInfo) => ({
  subject: '⚠️ New Login from Unrecognized Location - Spark Security Alert',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .alert-box { background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .location-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .verify-button { display: inline-block; padding: 15px 40px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 5px; }
        .deny-button { display: inline-block; padding: 15px 40px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .security-icon { font-size: 48px; margin-bottom: 10px; }
        .action-buttons { text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="security-icon">🔐</div>
          <h1>Security Alert</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          
          <div class="alert-box">
            <h3 style="margin-top: 0; color: #856404;">⚠️ Unusual Login Detected</h3>
            <p>We detected a login to your Spark account from a new or unrecognized location.</p>
          </div>

          <div class="location-info">
            <strong>📍 Login Details:</strong><br>
            Location: <strong>${location.city || 'Unknown'}, ${location.region || 'Unknown'}, ${location.country || 'Unknown'}</strong><br>
            Device: <strong>${deviceInfo.device || 'Unknown'}</strong><br>
            Browser: <strong>${deviceInfo.browser || 'Unknown'}</strong><br>
            Time: <strong>${new Date().toLocaleString()}</strong>
          </div>

          <h3>Was this you?</h3>
          <p>If you recognize this login, please confirm it was you by clicking the button below:</p>

          <div class="action-buttons">
            <a href="${verificationLink}?action=verify" class="verify-button">✓ Yes, This Was Me</a>
            <a href="${verificationLink}?action=deny" class="deny-button">✗ No, Secure My Account</a>
          </div>

          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <strong>🛡️ Security Tip:</strong> If this wasn't you, click "No, Secure My Account" immediately. We'll help you secure your account and change your password.
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If the buttons don't work, copy and paste this link into your browser:<br>
            <a href="${verificationLink}" style="color: #3F3FF3; word-break: break-all;">${verificationLink}</a>
          </p>

          <p style="margin-top: 30px;">Best regards,<br><strong>Spark Security Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated security email. Please do not reply to this message.</p>
          <p>If you need help, contact our support team.</p>
          <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${name},\n\nSecurity Alert: We detected a login to your Spark account from a new location.\n\nLocation: ${location.city}, ${location.region}, ${location.country}\nDevice: ${deviceInfo.device}\nBrowser: ${deviceInfo.browser}\nTime: ${new Date().toLocaleString()}\n\nIf this was you, verify it here:\n${verificationLink}?action=verify\n\nIf this wasn't you, secure your account immediately:\n${verificationLink}?action=deny\n\nBest regards,\nSpark Security Team`
});

// Email template for successful verification
const verificationSuccessTemplate = (name) => ({
  subject: '✅ Account Verified Successfully - Welcome to Spark!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .success-icon { font-size: 64px; margin-bottom: 10px; }
        .feature-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #28a745; }
        .login-button { display: inline-block; padding: 15px 40px; background-color: #3F3FF3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Account Verified!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Congratulations! Your email has been successfully verified. Your Spark Career Guidance account is now fully activated!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="login-button">Login to Your Account</a>
          </div>

          <h3 style="color: #3F3FF3;">What's Next?</h3>
          
          <div class="feature-box">
            <strong>📊 Complete Your Profile</strong><br>
            Add your skills, experience, and career interests
          </div>

          <div class="feature-box">
            <strong>🎯 Take Career Assessments</strong><br>
            Discover your strengths and find the perfect career path
          </div>

          <div class="feature-box">
            <strong>👥 Connect with Mentors</strong><br>
            Get guidance from industry professionals
          </div>

          <div class="feature-box">
            <strong>💼 Explore Opportunities</strong><br>
            Access exclusive job listings and resources
          </div>

          <p style="margin-top: 30px;">We're here to support your career journey every step of the way!</p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Spark Career Guidance Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${name},\n\nCongratulations! Your email has been successfully verified.\n\nYour Spark Career Guidance account is now fully activated!\n\nLogin now: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login\n\nBest regards,\nSpark Career Guidance Team`
});

// Function to send email
const sendEmail = async (to, template) => {
  try {
    const mailOptions = {
      from: '"Spark Career Guidance" <no-reply@pratimesh.com>',
      to: to,
      subject: template.subject,
      text: template.text,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully');
    console.log('📧 To:', to);
    console.log('📝 Message ID:', info.messageId);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Fast email sending with retry logic
const sendEmailFast = async (to, template, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`⚡ Attempt ${attempt}/${retries} - Sending email to ${to}`);
      const result = await sendEmail(to, template);
      console.log(`✅ Email sent successfully on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        console.error('❌ All retry attempts failed');
        throw new Error(`Failed to send email after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

module.exports = {
  transporter,
  sendEmail,
  sendEmailFast,
  verificationEmailTemplate,
  suspiciousLocationTemplate,
  verificationSuccessTemplate
};