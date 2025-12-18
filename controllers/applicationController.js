const Application = require('../models/Application');
const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const OTP = require('../models/OTP');
const EmailVerification = require('../models/EmailVerification');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Use nodemailer-based email helper
const { sendEmailFast } = require('../config/mailHelper');

// ==========================================
// APPLICANT ENDPOINTS
// ==========================================

/**
 * Submit a new mentor application
 * POST /api/applications/submit-application
 */
exports.submitApplication = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      jobTitle,
      currentCompany,
      companiesWorked,
      experience,
      profileImage,
      bio,
      tagline,
      expertise,
      targetingDomains,
      targetAudience,
      languages,
      location,
      sessionsPerWeek,
      sessionDuration,
      availabilitySlots,
      pricing,
      referralsInTopCompanies,
      topCompanyReferrals,
      education,
      certifications,
      socialLinks,
      curriculum,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !jobTitle || !experience) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'email', 'phone', 'jobTitle', 'experience'],
      });
    }

    // Check for duplicate pending applications
    const duplicate = await Application.checkDuplicate(email, phone);
    if (duplicate) {
      return res.status(400).json({
        error: 'You already have a pending application',
        trackingId: duplicate.trackingId,
        status: duplicate.status,
      });
    }

    // Check if email is already registered as a mentor
    const existingMentor = await User.findOne({
      email: email.toLowerCase(),
      role: 'Mentor',
    });
    if (existingMentor) {
      return res.status(400).json({
        error: 'This email is already registered as a mentor',
      });
    }

    // Create new application
    const newApplication = new Application({
      name,
      email: email.toLowerCase(),
      phone,
      jobTitle,
      currentCompany,
      companiesWorked: companiesWorked || [],
      experience,
      profileImage,
      bio,
      tagline,
      expertise: expertise || [],
      targetingDomains: targetingDomains || [],
      targetAudience: targetAudience || ['Fresher', 'Working Professional'],
      languages: languages || ['English'],
      location: location || {},
      sessionsPerWeek: sessionsPerWeek || 1,
      sessionDuration: sessionDuration || 60,
      availabilitySlots: availabilitySlots || [],
      pricing: pricing || {},
      referralsInTopCompanies: referralsInTopCompanies || false,
      topCompanyReferrals: topCompanyReferrals || [],
      education: education || [],
      certifications: certifications || [],
      socialLinks: socialLinks || {},
      curriculum: curriculum || { available: false },
    });

    const savedApplication = await newApplication.save();

    // Send confirmation email to applicant (async, non-blocking)
    sendEmailFast(email, {
      subject: '📋 Application Received - Skill-Pilot Mentorship',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3F3FF3 0%, #2F2FD3 100%); color: white; padding: 30px; text-align: center;">
            <h1>Application Received! 🎉</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2>Hello ${name}!</h2>
            <p>Thank you for applying to become a mentor on Skill-Pilot. We're excited to review your application!</p>
            <div style="background: #f8f9ff; border-left: 4px solid #3F3FF3; padding: 15px; margin: 20px 0;">
              <p><strong>📌 Tracking ID:</strong> ${savedApplication.trackingId}</p>
              <p style="margin: 0;">Save this ID to track your application status.</p>
            </div>
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Our team will review your application within 3-5 business days</li>
              <li>You'll receive an email once a decision is made</li>
              <li>If approved, you'll get credentials to complete your mentor profile</li>
            </ul>
            <p style="margin-top: 30px;">Best regards,<br><strong>The Skill-Pilot Team</strong></p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f5f5f5;">
            <p>&copy; 2025 Skill-Pilot Career Guidance. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Hello ${name}!\n\nYour mentor application has been received.\n\nTracking ID: ${savedApplication.trackingId}\n\nWe will review it and get back to you within 3-5 business days.\n\nBest regards,\nThe Skill-Pilot Team`,
    })
      .then(() => {
        console.log('✅ Application confirmation email sent');
      })
      .catch(emailError => {
        console.error('Failed to send confirmation email:', emailError);
      });

    res.status(201).json({
      message: 'Application submitted successfully',
      trackingId: savedApplication.trackingId,
      applicationId: savedApplication._id,
      status: savedApplication.status,
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      error: 'An error occurred while submitting the application',
      details: error.message,
    });
  }
};

/**
 * Track application by tracking ID
 * GET /api/applications/track/:trackingId
 */
exports.getApplicationByTrackingId = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const application = await Application.findOne({ trackingId }).select(
      'trackingId status submittedAt rejectionReason moreInfoRequest name email'
    );

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.status(200).json({
      trackingId: application.trackingId,
      name: application.name,
      status: application.status,
      submittedAt: application.submittedAt,
      rejectionReason: application.status === 'Rejected' ? application.rejectionReason : undefined,
      moreInfoRequest:
        application.status === 'More Info Requested'
          ? {
            requestDetails: application.moreInfoRequest?.requestDetails,
            requestedAt: application.moreInfoRequest?.requestedAt,
          }
          : undefined,
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'An error occurred while fetching the application' });
  }
};

/**
 * Respond to more info request
 * POST /api/applications/respond-info/:trackingId
 */
exports.respondToInfoRequest = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { response } = req.body;

    const application = await Application.findOne({
      trackingId,
      status: 'More Info Requested',
    });

    if (!application) {
      return res.status(404).json({
        error: 'Application not found or no info request pending',
      });
    }

    await application.respondToInfoRequest(response);

    res.status(200).json({
      message: 'Response submitted successfully',
      status: 'Under Review',
    });
  } catch (error) {
    console.error('Error responding to info request:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

/**
 * Get all applications (Admin only)
 * GET /api/applications/admin/applications
 */
exports.getApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'submittedAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [applications, total, stats] = await Promise.all([
      Application.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('reviewedBy', 'name email'),
      Application.countDocuments(query),
      Application.getStats(),
    ]);

    res.status(200).json({
      applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'An error occurred while fetching applications' });
  }
};

/**
 * Get single application details (Admin only)
 * GET /api/applications/admin/applications/:id
 */
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id)
      .populate('reviewedBy', 'name email')
      .populate('mentorUserId', 'name email mentorStatus mentorBadge');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.status(200).json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

/**
 * Approve application and create mentor account
 * PUT /api/applications/admin/applications/:id/approve
 */
exports.approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id || req.user?.id;
    const { adminNotes } = req.body;

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status === 'Approved') {
      return res.status(400).json({ error: 'Application is already approved' });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate unique username
    const baseUsername =
      application.name.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 1000);

    // Create User with Mentor role
    const newMentor = new User({
      username: baseUsername,
      name: application.name,
      email: application.email,
      password: hashedPassword,
      phoneNumber: application.phone,
      jobTitle: application.jobTitle,
      companiesJoined: application.companiesWorked,
      experience: application.experience,
      role: 'Mentor',
      imageUrl: application.profileImage,
      isVerified: true,
      isActive: true,
      mentorStatus: 'verified', // Verified upon admin approval
      mentorBadge: 'verified',
      applicationId: application._id,
      mentorVerification: {
        emailVerified: true,
        phoneVerified: true,
        documentVerified: true,
      },
    });

    const savedMentor = await newMentor.save();

    // Create MentorProfile
    const mentorProfile = new MentorProfile({
      userId: savedMentor._id,
      applicationId: application._id,
      displayName: application.name,
      tagline: application.tagline,
      bio: application.bio,
      profileImage: application.profileImage,
      location: application.location,
      expertise: application.expertise,
      targetingDomains: application.targetingDomains,
      preferredMenteeType: application.targetAudience,
      languages: application.languages,
      sessionsPerWeek: application.sessionsPerWeek,
      sessionDuration: application.sessionDuration,
      pricingPlans: [
        { duration: '1 Month', price: application.pricing?.monthlyPrice || 0 },
        { duration: '3 Months', price: application.pricing?.threeMonthPrice || 0 },
        { duration: '6 Months', price: application.pricing?.sixMonthPrice || 0 },
      ].filter(p => p.price > 0),
      trialSession: {
        available: application.pricing?.trialAvailable || false,
        price: application.pricing?.trialPrice || 0,
      },
      availabilitySlots: application.availabilitySlots,
      referralsInTopCompanies: application.referralsInTopCompanies,
      topCompanies: application.topCompanyReferrals,
      curriculum: application.curriculum,
      socialLinks: application.socialLinks,
      education: application.education,
      certifications: application.certifications,
      isVisible: true, // Visible immediately upon approval
      featured: false,
    });

    const savedProfile = await mentorProfile.save();

    // Update mentor with profile link
    savedMentor.mentorProfile = savedProfile._id;
    await savedMentor.save();

    // Update application
    application.status = 'Approved';
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    application.adminNotes = adminNotes;
    application.mentorUserId = savedMentor._id;
    application.mentorProfileId = savedProfile._id;
    await application.save();

    // Create verification token for email
    const emailToken = await EmailVerification.createVerificationToken(
      savedMentor._id,
      application.email,
      null,
      null
    );

    // Create OTP for phone verification
    const phoneOTP = await OTP.createOTP(application.email, 'two_factor', null, null);

    // Send approval email with credentials
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailToken.token}`;

    // Send approval email with credentials (async, non-blocking)
    sendEmailFast(application.email, {
      subject: '🎉 Mentor Application Approved - Skill-Pilot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center;">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2>Hello ${application.name}!</h2>
            <p>Your mentor application has been <strong style="color: #28a745;">APPROVED</strong>! Welcome to the Skill-Pilot mentor community.</p>
            
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;">✅ You are now a Skill-Pilot Mentor!</p>
            </div>
            
            <p><strong>Your Login Credentials:</strong></p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Username:</strong> ${baseUsername}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            
            <p><strong>Complete Your Verification:</strong></p>
            <ol>
              <li>Verify your email by clicking the button below</li>
              <li>Use this OTP to verify your phone: <strong style="color: #3F3FF3; font-size: 18px;">${phoneOTP.otp}</strong></li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="display: inline-block; padding: 14px 32px; background: #3F3FF3; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">✅ Verify Email</a>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p><strong>⚠️ Important:</strong></p>
              <ul style="margin: 5px 0;">
                <li>Change your temporary password after first login</li>
                <li>Complete both email and phone verification</li>
                <li>Your profile will be visible after verification</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">Welcome aboard!<br><strong>The Skill-Pilot Team</strong></p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f5f5f5;">
            <p>&copy; 2025 Skill-Pilot Career Guidance. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Congratulations ${application.name}!\n\nYour mentor application has been APPROVED!\n\nUsername: ${baseUsername}\nTemporary Password: ${tempPassword}\n\nVerify your email: ${verificationLink}\nPhone OTP: ${phoneOTP.otp}\n\nBest regards,\nThe Skill-Pilot Team`,
    })
      .then(() => {
        console.log('✅ Approval email sent');
      })
      .catch(emailError => {
        console.error('Failed to send approval email:', emailError);
      });

    res.status(200).json({
      message: 'Application approved and mentor account created',
      mentorId: savedMentor._id,
      mentorProfileId: savedProfile._id,
      application: {
        id: application._id,
        status: application.status,
        reviewedAt: application.reviewedAt,
      },
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({
      error: 'An error occurred while approving the application',
      details: error.message,
    });
  }
};

/**
 * Reject application
 * PUT /api/applications/admin/applications/:id/reject
 */
exports.rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id || req.user?.id;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status === 'Approved') {
      return res.status(400).json({ error: 'Cannot reject an approved application' });
    }

    application.status = 'Rejected';
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    application.rejectionReason = rejectionReason;
    application.adminNotes = adminNotes;
    await application.save();

    // Send rejection email (async, non-blocking)
    sendEmailFast(application.email, {
      subject: '📋 Application Update - Skill-Pilot Mentorship',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; padding: 30px; text-align: center;">
            <h1>Application Update</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2>Hello ${application.name},</h2>
            <p>Thank you for your interest in becoming a mentor on Skill-Pilot.</p>
            <p>After careful review, we regret to inform you that your application was not approved at this time.</p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0;">
              <p><strong>Reason:</strong></p>
              <p style="margin: 0;">${rejectionReason}</p>
            </div>
            
            <p>You are welcome to reapply after addressing the feedback provided. If you have any questions, please don't hesitate to reach out.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The Skill-Pilot Team</strong></p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f5f5f5;">
            <p>&copy; 2025 Skill-Pilot Career Guidance. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Hello ${application.name},\n\nYour mentor application was not approved at this time.\n\nReason: ${rejectionReason}\n\nYou may reapply after addressing the feedback.\n\nBest regards,\nThe Skill-Pilot Team`,
    })
      .then(() => {
        console.log('✅ Rejection email sent');
      })
      .catch(emailError => {
        console.error('Failed to send rejection email:', emailError);
      });

    res.status(200).json({
      message: 'Application rejected',
      application: {
        id: application._id,
        status: application.status,
        rejectionReason: application.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

/**
 * Request more info from applicant
 * PUT /api/applications/admin/applications/:id/request-info
 */
exports.requestMoreInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id || req.user?.id;
    const { requestDetails } = req.body;

    if (!requestDetails) {
      return res.status(400).json({ error: 'Request details are required' });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await application.requestMoreInfo(adminId, requestDetails);

    // Send email requesting more info (async, non-blocking)
    sendEmailFast(application.email, {
      subject: '📝 Additional Information Needed - Skill-Pilot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3F3FF3 0%, #2F2FD3 100%); color: white; padding: 30px; text-align: center;">
            <h1>Additional Info Required</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2>Hello ${application.name},</h2>
            <p>We are reviewing your mentor application and need some additional information to proceed.</p>
            
            <div style="background: #f8f9ff; border-left: 4px solid #3F3FF3; padding: 15px; margin: 20px 0;">
              <p><strong>📌 Tracking ID:</strong> ${application.trackingId}</p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p><strong>Request Details:</strong></p>
              <p style="margin: 0;">${requestDetails}</p>
            </div>
            
            <p>Please respond to this request by visiting your application tracking page.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The Skill-Pilot Team</strong></p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f5f5f5;">
            <p>&copy; 2025 Skill-Pilot Career Guidance. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Hello ${application.name},\n\nWe need additional information for your application (${application.trackingId}).\n\nRequest: ${requestDetails}\n\nBest regards,\nThe Skill-Pilot Team`,
    })
      .then(() => {
        console.log('✅ Info request email sent');
      })
      .catch(emailError => {
        console.error('Failed to send info request email:', emailError);
      });

    res.status(200).json({
      message: 'More info requested from applicant',
      status: 'More Info Requested',
    });
  } catch (error) {
    console.error('Error requesting more info:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

/**
 * Update application status (generic)
 * PUT /api/applications/:id/status
 */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Under Review', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Redirect to specific handlers for Approved/Rejected
    if (status === 'Approved') {
      return exports.approveApplication(req, res);
    }
    if (status === 'Rejected') {
      return exports.rejectApplication(req, res);
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.status(200).json({
      message: 'Application status updated successfully',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'An error occurred while updating application status' });
  }
};

// ==========================================
// MENTOR VERIFICATION ENDPOINTS
// ==========================================

/**
 * Send verification email to mentor
 * POST /api/applications/send-verification-email
 */
exports.sendVerificationEmail = async (req, res) => {
  try {
    const { mentorId } = req.body;

    const mentor = await User.findOne({ _id: mentorId, role: 'Mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    if (mentor.mentorVerification?.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Create new verification token
    const token = await EmailVerification.createVerificationToken(
      mentor._id,
      mentor.email,
      null,
      null
    );

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-mentor-email?token=${token.token}`;

    // Send verification email
    try {
      await sendEmailFast(mentor.email, {
        subject: '✉️ Verify Your Email - Skill-Pilot Mentor',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3F3FF3 0%, #2F2FD3 100%); color: white; padding: 30px; text-align: center;">
              <h1>Email Verification</h1>
            </div>
            <div style="padding: 30px; background: #fff;">
              <h2>Hello ${mentor.name}!</h2>
              <p>Please verify your email address to complete your mentor registration.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="display: inline-block; padding: 14px 32px; background: #3F3FF3; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">✅ Verify My Email</a>
              </div>
              <p style="margin-top: 30px;">Best regards,<br><strong>The Skill-Pilot Team</strong></p>
            </div>
          </div>
        `,
        text: `Hello ${mentor.name},\n\nPlease verify your email: ${verificationLink}\n\nBest regards,\nThe Skill-Pilot Team`,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.status(200).json({
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

/**
 * Verify mentor email
 * GET /api/applications/verify-email/:token
 */
exports.verifyMentorEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const verification = await EmailVerification.findOne({ token });
    if (!verification) {
      return res.status(404).json({ error: 'Invalid or expired verification token' });
    }

    const result = await verification.verify();
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // Update mentor verification status
    const mentor = await User.findById(verification.userId);
    if (mentor) {
      mentor.mentorVerification.emailVerified = true;
      mentor.mentorVerification.emailVerifiedAt = new Date();

      // Check if fully verified (both email and phone)
      if (mentor.mentorVerification.phoneVerified) {
        mentor.mentorStatus = 'verified';
        mentor.mentorBadge = 'verified';

        // Make mentor profile visible
        if (mentor.mentorProfile) {
          await MentorProfile.findByIdAndUpdate(mentor.mentorProfile, { isVisible: true });
        }
      }

      await mentor.save();
    }

    res.status(200).json({
      message: 'Email verified successfully',
      isFullyVerified: mentor?.mentorStatus === 'verified',
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

/**
 * Send phone verification OTP
 * POST /api/applications/send-phone-otp
 */
exports.sendPhoneOTP = async (req, res) => {
  try {
    const { mentorId } = req.body;

    const mentor = await User.findOne({ _id: mentorId, role: 'Mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    if (mentor.mentorVerification?.phoneVerified) {
      return res.status(400).json({ error: 'Phone is already verified' });
    }

    // Create OTP
    const otpDoc = await OTP.createOTP(mentor.email, 'two_factor', null, null);

    // In production, integrate with SMS gateway (Twilio, MSG91, etc.)
    // For now, we'll send via email
    try {
      await sendEmailFast(mentor.email, {
        subject: '🔐 Phone Verification OTP - Skill-Pilot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3F3FF3 0%, #2F2FD3 100%); color: white; padding: 30px; text-align: center;">
              <h1>Phone Verification OTP</h1>
            </div>
            <div style="padding: 30px; background: #fff;">
              <h2>Hello ${mentor.name}!</h2>
              <p>Use this OTP to verify your phone number: <strong>${mentor.phoneNumber}</strong></p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3F3FF3; text-align: center; padding: 20px; background: #f8f9ff; border-radius: 8px; margin: 20px 0;">
                ${otpDoc.otp}
              </div>
              <p style="color: #666;">This OTP will expire in 10 minutes.</p>
              <p style="margin-top: 30px;">Best regards,<br><strong>The Skill-Pilot Team</strong></p>
            </div>
          </div>
        `,
        text: `Hello ${mentor.name},\n\nYour phone verification OTP is: ${otpDoc.otp}\n\nThis OTP will expire in 10 minutes.\n\nBest regards,\nThe Skill-Pilot Team`,
      });
    } catch (emailError) {
      console.error('Failed to send OTP:', emailError);
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.status(200).json({
      message: 'OTP sent successfully',
      phone: mentor.phoneNumber?.replace(/(\d{2})(\d+)(\d{2})/, '$1****$3'),
    });
  } catch (error) {
    console.error('Error sending phone OTP:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

/**
 * Verify phone OTP
 * POST /api/applications/verify-phone-otp
 */
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { mentorId, otp } = req.body;

    const mentor = await User.findOne({ _id: mentorId, role: 'Mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Find valid OTP
    const otpDoc = await OTP.findValidOTP(mentor.email, 'two_factor');
    if (!otpDoc) {
      return res.status(400).json({ error: 'No valid OTP found. Please request a new one.' });
    }

    // Verify OTP
    const result = await otpDoc.verifyOTP(otp);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // Update mentor verification status
    mentor.mentorVerification.phoneVerified = true;
    mentor.mentorVerification.phoneVerifiedAt = new Date();

    // Check if fully verified
    if (mentor.mentorVerification.emailVerified) {
      mentor.mentorStatus = 'verified';
      mentor.mentorBadge = 'verified';

      // Make mentor profile visible
      if (mentor.mentorProfile) {
        await MentorProfile.findByIdAndUpdate(mentor.mentorProfile, { isVisible: true });
      }
    }

    await mentor.save();

    res.status(200).json({
      message: 'Phone verified successfully',
      isFullyVerified: mentor.mentorStatus === 'verified',
    });
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

/**
 * Get mentor verification status
 * GET /api/applications/verification-status/:mentorId
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const { mentorId } = req.params;

    const mentor = await User.findOne({ _id: mentorId, role: 'Mentor' }).select(
      'name email mentorStatus mentorBadge mentorVerification'
    );

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    res.status(200).json({
      mentorId: mentor._id,
      name: mentor.name,
      status: mentor.mentorStatus,
      badge: mentor.mentorBadge,
      verification: {
        email: {
          verified: mentor.mentorVerification?.emailVerified || false,
          verifiedAt: mentor.mentorVerification?.emailVerifiedAt,
        },
        phone: {
          verified: mentor.mentorVerification?.phoneVerified || false,
          verifiedAt: mentor.mentorVerification?.phoneVerifiedAt,
        },
        document: {
          verified: mentor.mentorVerification?.documentVerified || false,
          verifiedAt: mentor.mentorVerification?.documentVerifiedAt,
        },
      },
      isFullyVerified: mentor.mentorStatus === 'verified',
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

/**
 * Get application statistics (Admin dashboard)
 * GET /api/applications/admin/stats
 */
exports.getApplicationStats = async (req, res) => {
  try {
    const stats = await Application.getStats();

    // Get mentor verification stats
    const mentorStats = await User.aggregate([
      { $match: { role: 'Mentor' } },
      {
        $group: {
          _id: '$mentorStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const mentorStatusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      temp: 0,
      verified: 0,
    };
    mentorStats.forEach(s => {
      if (s._id) mentorStatusCounts[s._id] = s.count;
    });

    res.status(200).json({
      applications: stats,
      mentors: mentorStatusCounts,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};
