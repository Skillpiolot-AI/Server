const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // ✅ must be true for SSL
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
        console.error('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Email templates
const emailTemplates = {
    // OTP Email Template
    otpEmail: (name, otp, expiryMinutes = 10) => ({
        subject: 'Password Reset OTP - Spark Career Guidance',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3F3FF3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .otp-box { background-color: white; border: 2px dashed #3F3FF3; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3F3FF3; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3F3FF3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset your password for your Spark Career Guidance account.</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for ${expiryMinutes} minutes</p>
            </div>
            
            <p>Enter this code on the password reset page to continue. If you didn't request this, please ignore this email.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br>Spark Career Guidance Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `Hello ${name},\n\nYour OTP for password reset is: ${otp}\n\nThis code will expire in ${expiryMinutes} minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nSpark Career Guidance Team`
    }),

    // Password Reset Success Email
    passwordResetSuccess: (name) => ({
        subject: 'Password Successfully Reset - Spark Career Guidance',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Successful</h1>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            <p>Hello ${name},</p>
            <p>Your password has been successfully reset. You can now log in with your new password.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p style="margin-top: 30px;">Best regards,<br>Spark Career Guidance Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `Hello ${name},\n\nYour password has been successfully reset. You can now log in with your new password.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nSpark Career Guidance Team`
    }),

    // Welcome Email
    welcomeEmail: (name, username) => ({
        subject: 'Welcome to Spark Career Guidance!',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3F3FF3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .features { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .feature-item { margin: 15px 0; padding-left: 25px; position: relative; }
          .feature-item:before { content: "✓"; position: absolute; left: 0; color: #3F3FF3; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Spark!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Welcome to Spark Career Guidance Portal! We're excited to have you on board.</p>
            <p>Your username: <strong>${username}</strong></p>
            
            <div class="features">
              <h3>What you can do:</h3>
              <div class="feature-item">Access personalized career assessments</div>
              <div class="feature-item">Connect with industry mentors</div>
              <div class="feature-item">Explore exclusive job listings</div>
              <div class="feature-item">Access continuous learning resources</div>
            </div>
            
            <p>Get started by logging in and completing your profile!</p>
            <p style="margin-top: 30px;">Best regards,<br>Spark Career Guidance Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Spark Career Guidance. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `Hello ${name},\n\nWelcome to Spark Career Guidance Portal!\n\nYour username: ${username}\n\nGet started by logging in and completing your profile!\n\nBest regards,\nSpark Career Guidance Team`
    })
};

// Function to send email
const sendEmail = async (to, template) => {
    try {
        const mailOptions = {
            from: '"OTP-Verification" <no-reply@pratimesh.com>',
            to: to,
            subject: template.subject,
            text: template.text,
            html: template.html
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info)
        };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    transporter,
    emailTemplates,
    sendEmail
};
