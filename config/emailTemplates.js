/**
 * ✈️ SKILL-PILOT EMAIL TEMPLATES
 * Complete email template system with all user management scenarios
 */

const FRONTEND_URL = process.env.FRONTEND_URL ;
const LOGO = "✈️ SKILL-PILOT";
const TAGLINE = "Navigate Your Career Journey";
const SUPPORT_EMAIL = "support@skillpilot.com";
const COMPANY_NAME = "Skill-Pilot Career Guidance";

// ============================================================================
// COLOR SYSTEM & DESIGN TOKENS
// ============================================================================

const colors = {
  primary: "#667eea",
  primaryDark: "#1e3c72",
  primaryLight: "#764ba2",
  accent: "#f093fb",
  accentRed: "#f5576c",
  success: "#10b981",
  successDark: "#059669",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  error: "#dc2626",
  errorLight: "#fef2f2",
  text: "#1a1a1a",
  textMuted: "#64748b",
  textDark: "#1e3c72",
  white: "#ffffff",
  lightBg: "#f8f9ff",
  borderLight: "#e0e7ff",
};

const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 50%, ${colors.accent} 100%)`,
  header: `linear-gradient(135deg, ${colors.primaryDark} 0%, #2a5298 50%, #7e22ce 100%)`,
  success: `linear-gradient(135deg, ${colors.success} 0%, ${colors.successDark} 100%)`,
  warning: `linear-gradient(135deg, ${colors.warningLight} 0%, #fde68a 100%)`,
  error: `linear-gradient(135deg, ${colors.errorLight} 0%, #fee2e2 100%)`,
};

// ============================================================================
// GLOBAL STYLES
// ============================================================================

const getAllStyles = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    line-height: 1.6; 
    color: ${colors.text}; 
    background: ${gradients.primary};
  }
  .email-wrapper { 
    width: 100%; 
    padding: 40px 20px; 
    background: ${gradients.primary};
  }
  .container { 
    max-width: 650px; 
    margin: 0 auto; 
    background-color: ${colors.white}; 
    box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
    border-radius: 20px; 
    overflow: hidden;
  }
  .header { 
    background: ${gradients.header};
    color: ${colors.white}; 
    padding: 50px 30px; 
    text-align: center;
  }
  .logo-text {
    font-size: 48px;
    font-weight: 900;
    background: linear-gradient(135deg, ${colors.white} 0%, #a8d0ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 2px;
  }
  .tagline {
    font-size: 16px;
    opacity: 0.95;
    font-weight: 300;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-top: 10px;
  }
  .content { 
    padding: 50px 40px; 
    background: linear-gradient(to bottom, ${colors.white} 0%, ${colors.lightBg} 100%);
  }
  .btn {
    display: inline-block;
    padding: 20px 50px;
    color: ${colors.white};
    text-decoration: none;
    border-radius: 50px;
    font-weight: 800;
    font-size: 18px;
    margin: 35px 0;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .btn-primary { background: ${gradients.primary}; }
  .btn-success { background: ${gradients.success}; }
  .badge {
    display: inline-block;
    padding: 15px 35px;
    color: ${colors.white};
    border-radius: 50px;
    font-weight: 800;
    font-size: 18px;
    margin: 25px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentRed} 100%);
  }
  .card {
    background: ${colors.white};
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    padding: 40px;
    margin: 40px 0;
    border: 3px solid transparent;
    background-image: 
      linear-gradient(${colors.white}, ${colors.white}),
      ${gradients.primary};
    background-origin: border-box;
    background-clip: padding-box, border-box;
  }
  .credential-row {
    background: linear-gradient(135deg, ${colors.lightBg} 0%, ${colors.borderLight} 100%);
    padding: 20px 25px;
    margin: 18px 0;
    border-left: 6px solid ${colors.primary};
    border-radius: 12px;
  }
  .credential-label {
    color: #4a5568;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .credential-value {
    color: ${colors.textDark};
    font-weight: 700;
    font-size: 18px;
  }
  .password-value {
    color: ${colors.error};
    font-weight: 900;
    font-family: 'Courier New', monospace;
    font-size: 22px;
    letter-spacing: 2px;
    background: ${colors.errorLight};
    padding: 15px;
    border-radius: 8px;
    display: inline-block;
    margin-top: 10px;
  }
  .alert {
    padding: 20px 25px;
    margin: 30px 0;
    border-radius: 12px;
    border-left: 6px solid;
  }
  .alert-warning { background: ${gradients.warning}; border-left-color: ${colors.warning}; }
  .alert-error { background: ${gradients.error}; border-left-color: ${colors.error}; }
  .alert-info { background: #dbeafe; border-left-color: #3b82f6; }
  .alert-success { background: #f0fdf4; border-left-color: ${colors.success}; }
  .footer { 
    background: ${gradients.header};
    text-align: center; 
    padding: 40px 30px; 
    color: #e0e7ff;
  }
  .footer-logo {
    font-size: 28px;
    font-weight: 900;
    background: linear-gradient(135deg, ${colors.white} 0%, #a8d0ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 15px;
    letter-spacing: 2px;
  }
  @media only screen and (max-width: 600px) {
    .content { padding: 30px 20px; }
    .card { padding: 25px; }
  }
`;

// ============================================================================
// COMPONENT BUILDERS
// ============================================================================

const Header = () => `
  <div class="header">
    <div class="logo-text">${LOGO}</div>
    <p class="tagline">${TAGLINE}</p>
  </div>
`;

const Footer = () => `
  <div class="footer">
    <div class="footer-logo">${LOGO}</div>
    <p><strong>${TAGLINE}</strong></p>
    <p style="margin: 15px 0;">Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #a8d0ff;">${SUPPORT_EMAIL}</a></p>
    <p style="font-style: italic; opacity: 0.8;">"Empowering careers, one skill at a time"</p>
    <p style="margin-top: 20px;">&copy; 2025 ${COMPANY_NAME}. All rights reserved.</p>
  </div>
`;

const createEmailTemplate = (subject, htmlContent, textContent) => ({
  subject,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${getAllStyles()}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          ${htmlContent}
        </div>
      </div>
    </body>
    </html>
  `,
  text: textContent,
});

// ============================================================================
// ADMIN CREATED USER TEMPLATES
// ============================================================================

const adminCreatedWelcome = (name, username, email, password, role) => {
  const htmlContent = `
    ${Header()}
    <div class="content">
      <div style="background: ${gradients.primary}; color: white; padding: 40px; text-align: center; margin: -20px -10px 40px -10px; border-radius: 16px;">
        <h2 style="font-size: 36px; margin-bottom: 15px; font-weight: 800;">Welcome Aboard, ${name}! 🎉</h2>
        <p style="font-size: 18px; opacity: 0.95;">Your account has been personally created by our admin team</p>
      </div>

      <p style="font-size: 18px; margin-bottom: 25px; text-align: center;">
        We're thrilled to have you join <strong>Skill-Pilot</strong>!
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <span class="badge">🎯 ${role.toUpperCase()} ACCESS</span>
      </div>

      <div class="card">
        <h3 style="color: ${colors.primary}; margin-bottom: 25px; text-align: center; font-size: 26px;">🔑 Your Access Credentials</h3>
        
        <div class="credential-row">
          <div class="credential-label">👤 Username</div>
          <div class="credential-value">${username}</div>
        </div>
        
        <div class="credential-row">
          <div class="credential-label">📧 Email Address</div>
          <div class="credential-value">${email}</div>
        </div>
        
        <div class="credential-row">
          <div class="credential-label">🔐 Temporary Password</div>
          <div class="password-value">${password}</div>
        </div>
      </div>

      <div class="alert alert-warning">
        <strong style="color: #92400e;">⚠️ SECURITY FIRST!</strong>
        <p style="color: #78350f; margin: 5px 0 0 0;">For your protection, please change this temporary password immediately after your first login.</p>
      </div>

      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/login" class="btn btn-primary">🚀 Launch Dashboard</a>
      </div>

      <p style="margin-top: 35px; color: #64748b;">
        We're excited to see you achieve great things with Skill-Pilot!
      </p>
      
      <p style="margin-top: 20px;">
        Ready for takeoff,<br>
        <strong style="color: ${colors.textDark};">The Skill-Pilot Team ✈️</strong>
      </p>
    </div>
    ${Footer()}
  `;

  const textContent = `
    ✈️ SKILL-PILOT - Welcome Aboard!
    
    Hello ${name},
    
    Your account has been created with ${role} access.
    
    YOUR LOGIN CREDENTIALS
    Username: ${username}
    Email: ${email}
    Temporary Password: ${password}
    
    ⚠️ IMPORTANT: Please change your password immediately after first login.
    
    Login now: ${FRONTEND_URL}/login
    
    Best regards,
    The Skill-Pilot Team ✈️
  `;

  return createEmailTemplate(
    `✨ Welcome Aboard Skill-Pilot - Your ${role} Journey Begins!`,
    htmlContent,
    textContent
  );
};

const adminCreatedVerification = (name, username, email, password, role, verificationLink) => {
  const htmlContent = `
    ${Header()}
    <div class="content">
      <p style="font-size: 20px; font-weight: 600; color: ${colors.textDark};">Hello <strong>${name}</strong>,</p>
      
      <p style="font-size: 17px; margin: 20px 0;">
        Great news! An administrator has created a <strong>Skill-Pilot</strong> account for you with special access privileges.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span class="badge">🎯 ${role.toUpperCase()} ACCESS</span>
      </div>

      <div class="card">
        <h3 style="color: ${colors.primary}; margin-bottom: 25px; text-align: center; font-size: 26px;">🔑 Your Access Credentials</h3>
        
        <div class="credential-row">
          <div class="credential-label">👤 Username</div>
          <div class="credential-value">${username}</div>
        </div>
        
        <div class="credential-row">
          <div class="credential-label">📧 Email Address</div>
          <div class="credential-value">${email}</div>
        </div>
        
        <div class="credential-row">
          <div class="credential-label">🔐 Temporary Password</div>
          <div class="password-value">${password}</div>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border: 3px solid ${colors.success}; padding: 35px; text-align: center; margin: 30px 0; border-radius: 20px;">
        <h2 style="color: #047857; margin: 0 0 20px 0; font-size: 28px;">✅ Verify Your Email</h2>
        <p style="color: #065f46; margin-bottom: 25px;">
          To activate your Skill-Pilot account and start your journey, please verify your email address:
        </p>
        <a href="${verificationLink}" class="btn btn-success">🚀 Verify & Activate Account</a>
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">⏰ This link expires in 24 hours</p>
      </div>

      <div class="alert alert-warning">
        <strong style="color: #92400e;">⚠️ SECURITY REMINDER</strong>
        <p style="color: #78350f; margin: 5px 0 0 0;">After verification and your first login, immediately change your temporary password.</p>
      </div>

      <div class="alert alert-error">
        <p style="color: #7f1d1d; margin: 0;">
          <strong>⚠️ Didn't request this account?</strong><br>
          If you didn't expect this account creation, please contact our support team immediately.
        </p>
      </div>
      
      <p style="margin-top: 30px;">
        Ready to navigate success,<br>
        <strong style="color: ${colors.textDark};">The Skill-Pilot Team ✈️</strong>
      </p>
    </div>
    ${Footer()}
  `;

  const textContent = `
    ✈️ SKILL-PILOT - Verify Your Account
    
    Hello ${name},
    
    An administrator has created a Skill-Pilot account for you with ${role} access.
    
    YOUR LOGIN CREDENTIALS
    Username: ${username}
    Email: ${email}
    Temporary Password: ${password}
    
    VERIFY YOUR EMAIL
    To activate your account, verify your email:
    ${verificationLink}
    
    ⏰ This link expires in 24 hours.
    
    ⚠️ SECURITY REMINDER:
    Change your temporary password immediately after verification and first login.
    
    Best regards,
    The Skill-Pilot Team ✈️
  `;

  return createEmailTemplate(
    `🔐 Verify Your Skill-Pilot Account - ${role} Access Awaits!`,
    htmlContent,
    textContent
  );
};

// ============================================================================
// OTHER NOTIFICATION TEMPLATES
// ============================================================================

const accountDeletedEmail = (name, reason = null) => {
  const htmlContent = `
    ${Header()}
    <div class="content">
      <div class="alert alert-error">
        <h2 style="color: #dc2626; margin: 0 0 15px 0;">⚠️ Account Deleted</h2>
        <p style="color: #7f1d1d; margin: 0;">Your ${COMPANY_NAME} account has been permanently deleted.</p>
      </div>

      <p>Dear ${name},</p>
      <p>We're writing to inform you that your account with ${COMPANY_NAME} has been deleted by our administrative team.</p>

      ${reason ? `
        <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 12px; margin: 25px 0;">
          <p style="margin: 0; font-weight: 600; color: #991b1b; margin-bottom: 8px;">Reason for deletion:</p>
          <p style="margin: 0; color: #7f1d1d;">${reason}</p>
        </div>
      ` : ''}

      <div class="alert alert-info">
        <p style="color: #1e40af; margin: 0;">
          <strong>Think this was a mistake?</strong><br>
          If you believe your account was deleted in error, please contact our support team at 
          <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a>
        </p>
      </div>

      <p style="margin-top: 30px;">Thank you for being part of our journey,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
    ${Footer()}
  `;

  const textContent = `Account Deletion Notice\n\nDear ${name},\n\nYour account with ${COMPANY_NAME} has been deleted.\n\n${reason ? `Reason: ${reason}\n\n` : ''}Contact us at ${SUPPORT_EMAIL} if this was a mistake.\n\nThank you,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Account Deletion Notice - ${COMPANY_NAME}`, htmlContent, textContent);
};

const accountUnverifiedEmail = (name, username, verificationLink) => {
  const htmlContent = `
    ${Header()}
    <div class="content">
      <div class="alert alert-warning">
        <h2 style="color: #f59e0b; margin: 0 0 15px 0;">⚠️ Verification Required</h2>
        <p style="color: #78350f; margin: 0;">Your account has been marked as unverified and requires email verification.</p>
      </div>

      <p>Hello ${name},</p>
      <p>Your ${COMPANY_NAME} account (<strong>${username}</strong>) requires email verification before you can access our services.</p>

      <div style="background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border: 3px solid ${colors.success}; padding: 35px; text-align: center; margin: 30px 0; border-radius: 20px;">
        <h2 style="color: #047857;">✅ Verify Your Email</h2>
        <p style="color: #065f46; margin-bottom: 25px;">Click the button below to verify your email address and activate your account:</p>
        <a href="${verificationLink}" class="btn btn-success">🚀 Verify My Account</a>
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">⏰ This link expires in 24 hours</p>
      </div>

      <p style="margin-top: 25px;">Best regards,<br><strong>${COMPANY_NAME} Team ✈️</strong></p>
    </div>
    ${Footer()}
  `;

  const textContent = `Account Verification Required\n\nHello ${name},\n\nYour ${COMPANY_NAME} account (${username}) requires email verification.\n\nVerify your account: ${verificationLink}\n\nThis link expires in 24 hours.\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`🔐 Account Verification Required - ${COMPANY_NAME}`, htmlContent, textContent);
};

const roleChangedEmail = (name, oldRole, newRole) => {
  const htmlContent = `
    ${Header()}
    <div class="content">
      <div class="alert alert-success">
        <h2 style="color: ${colors.success}; margin: 0 0 15px 0;">🎉 Role Updated</h2>
        <p style="color: #065f46; margin: 0;">Your account role has been updated successfully!</p>
      </div>

      <p>Hello ${name},</p>
      <p>Great news! Your role in ${COMPANY_NAME} has been updated by our administrative team.</p>

      <div style="background: ${colors.lightBg}; border: 3px solid ${colors.primary}; padding: 30px; border-radius: 20px; margin: 30px 0; text-align: center;">
        <h3 style="color: ${colors.textDark}; margin-bottom: 25px;">Your Role Change</h3>
        <div style="margin: 25px 0;">
          <div style="display: inline-block; background: #fee2e2; color: #991b1b; padding: 12px 24px; border-radius: 25px; font-weight: 700; margin: 0 10px;">
            ${oldRole}
          </div>
          <span style="font-size: 32px; color: ${colors.primary};">→</span>
          <div style="display: inline-block; background: ${gradients.primary}; color: white; padding: 12px 24px; border-radius: 25px; font-weight: 700; margin: 0 10px;">
            ${newRole}
          </div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/login" class="btn btn-primary">Access Your Dashboard</a>
      </div>

      <p style="margin-top: 30px;">Best regards,<br><strong>${COMPANY_NAME} Team ✈️</strong></p>
    </div>
    ${Footer()}
  `;

  const textContent = `Role Updated\n\nHello ${name},\n\nYour role in ${COMPANY_NAME} has been updated!\n\nPrevious Role: ${oldRole}\nNew Role: ${newRole}\n\nAccess your dashboard: ${FRONTEND_URL}/login\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Role Updated: ${newRole} Access Granted - ${COMPANY_NAME}`, htmlContent, textContent);
};

const accountDeactivatedEmail = (name, reason = null) => {
  const htmlContent = `
    ${Header()}
    <div class="content">
      <div class="alert alert-warning">
        <h2 style="color: #f59e0b; margin: 0 0 15px 0;">⚠️ Account Deactivated</h2>
        <p style="color: #78350f; margin: 0;">Your account has been temporarily deactivated.</p>
      </div>

      <p>Dear ${name},</p>
      <p>Your ${COMPANY_NAME} account has been deactivated by our administrative team.</p>

      ${reason ? `
        <div style="background: #fef3c7; border: 2px solid #fde68a; padding: 20px; border-radius: 12px; margin: 25px 0;">
          <p style="margin: 0; font-weight: 600; color: #92400e; margin-bottom: 8px;">Reason:</p>
          <p style="margin: 0; color: #78350f;">${reason}</p>
        </div>
      ` : ''}

      <div class="alert alert-info">
        <p style="color: #1e40af; margin: 0;">
          <strong>Need to Reactivate?</strong><br>
          Contact our support team at <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a> to request account reactivation.
        </p>
      </div>

      <p style="margin-top: 30px;">Thank you for your understanding,<br><strong>${COMPANY_NAME} Team</strong></p>
    </div>
    ${Footer()}
  `;

  const textContent = `Account Deactivated\n\nDear ${name},\n\nYour ${COMPANY_NAME} account has been deactivated.\n\n${reason ? `Reason: ${reason}\n\n` : ''}Contact support to reactivate: ${SUPPORT_EMAIL}\n\nThank you,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`Account Deactivated - ${COMPANY_NAME}`, htmlContent, textContent);
};

const accountReactivatedEmail = (name) => {
  const htmlContent = `
    ${Header()}
    <div class="content">
      <div class="alert alert-success">
        <h2 style="color: ${colors.success}; margin: 0 0 15px 0;">🎉 Welcome Back!</h2>
        <p style="color: #065f46; margin: 0;">Your account has been successfully reactivated!</p>
      </div>

      <p>Hello ${name},</p>
      <p>Great news! Your ${COMPANY_NAME} account has been reactivated and you can now access all our services again.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}/login" class="btn btn-success">🚀 Access Your Dashboard</a>
      </div>

      <p style="margin-top: 30px;">Best regards,<br><strong>${COMPANY_NAME} Team ✈️</strong></p>
    </div>
    ${Footer()}
  `;

  const textContent = `Welcome Back!\n\nHello ${name},\n\nYour ${COMPANY_NAME} account has been reactivated!\n\nLogin now: ${FRONTEND_URL}/login\n\nBest regards,\n${COMPANY_NAME} Team`;

  return createEmailTemplate(`✅ Account Reactivated - Welcome Back to ${COMPANY_NAME}!`, htmlContent, textContent);
};

const tempPasswordReminderEmail = (name, daysRemaining) => {
  const htmlContent = `
    ${Header()}
    <div class="content">
      <div class="alert alert-warning">
        <h2 style="color: #f59e0b; margin: 0 0 15px 0;">🔐 Security Reminder</h2>
        <p style="color: #78350f; margin: 0;">You're still using a temporary password. Please change it for security.</p>
      </div>

      <p>Hello ${name},</p>
      <p>This is a friendly reminder that your ${COMPANY_NAME} account is still using a temporary password assigned by our team.</p>

      <div style="background: ${gradients.warning}; border: 3px solid ${colors.warning}; padding: 30px; border-radius: 20px; margin: 30px 0; text-align: center;">
        <h2 style="color: #92400e;">⚠️ Action Required</h2>
        <p style="color: #78350f;">For your account security, please change your temporary password as soon as possible.</p>
        <div style="background: white; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0;"><strong>Days since account creation:</strong> ${daysRemaining} days</p>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/login" class="btn btn-primary">🔒 Change Password Now</a>
      </div>

      <p style="margin-top: 30px;">Stay secure,<br><strong>${COMPANY_NAME} Security Team</strong></p>
    </div>
    ${Footer()}
  `;

  const textContent = `Security Reminder\n\nHello ${name},\n\nYou're still using a temporary password for your ${COMPANY_NAME} account.\n\nDays since account creation: ${daysRemaining} days\n\nChange password: ${FRONTEND_URL}/login\n\nStay secure,\n${COMPANY_NAME} Security Team`;

  return createEmailTemplate(`⚠️ Reminder: Change Your Temporary Password - ${COMPANY_NAME}`, htmlContent, textContent);
};

// ============================================================================
// EXPORTS
// ============================================================================

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
  
  // Utility exports
  colors,
  gradients,
  getAllStyles,
  Header,
  Footer,
  createEmailTemplate,
  FRONTEND_URL,
  LOGO,
  TAGLINE,
  SUPPORT_EMAIL,
  COMPANY_NAME
};