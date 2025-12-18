const mongoose = require('mongoose');

// Education schema
const EducationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: true,
  },
  field: String,
  institution: {
    type: String,
    required: true,
  },
  year: Number,
});

// Certification schema
const CertificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  issuer: String,
  year: Number,
  credentialUrl: String,
});

// Availability slot schema
const AvailabilitySlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  startTime: String, // Format: "09:00"
  endTime: String, // Format: "17:00"
});

// Main Application Schema - Enhanced for Mentor Applications
const ApplicationSchema = new mongoose.Schema({
  // ===== BASIC INFO =====
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },

  // ===== PROFESSIONAL INFO =====
  jobTitle: {
    type: String,
    required: true,
  },
  currentCompany: {
    type: String,
  },
  companiesWorked: [
    {
      type: String,
    },
  ],
  experience: {
    type: Number,
    required: true,
    min: 1,
    max: 30,
  },

  // ===== PROFILE INFO =====
  profileImage: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    maxlength: 1000,
  },
  tagline: {
    type: String,
    maxlength: 200,
  },

  // ===== EXPERTISE & SKILLS =====
  expertise: [
    {
      type: String,
      trim: true,
    },
  ], // Java, Python, System Design, DSA, etc.

  targetingDomains: [
    {
      type: String,
      trim: true,
    },
  ], // Backend Developer, Frontend, DevOps, etc.

  targetAudience: [
    {
      type: String,
      enum: ['Fresher', 'Working Professional', 'Student', 'Career Switch'],
    },
  ],

  languages: [
    {
      type: String,
    },
  ], // English, Hindi, Telugu, etc.

  // ===== LOCATION =====
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India',
    },
  },

  // ===== SESSION CONFIGURATION =====
  sessionsPerWeek: {
    type: Number,
    min: 1,
    max: 10,
    default: 1,
  },
  sessionDuration: {
    type: Number, // in minutes
    default: 60,
  },
  availabilitySlots: [AvailabilitySlotSchema],

  // ===== PRICING =====
  pricingType: {
    type: String,
    enum: ['free', 'paid', 'freemium'],
    default: 'paid',
  },
  pricing: {
    monthlyPrice: {
      type: Number,
      default: 0,
    },
    threeMonthPrice: {
      type: Number,
      default: 0,
    },
    sixMonthPrice: {
      type: Number,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    trialAvailable: {
      type: Boolean,
      default: false,
    },
    trialPrice: {
      type: Number,
      default: 0,
    },
  },

  // ===== SECTOR TYPE =====
  sectorType: {
    type: String,
    enum: ['private', 'government', 'combined', 'startup', 'freelance'],
    default: 'private',
  },

  // ===== REFERRALS & COMPANIES =====
  referralsInTopCompanies: {
    type: Boolean,
    default: false,
  },
  topCompanyReferrals: [
    {
      type: String,
    },
  ], // Google, Microsoft, Amazon, etc.

  // ===== EDUCATION & CERTIFICATIONS =====
  education: [EducationSchema],
  certifications: [CertificationSchema],

  // ===== SOCIAL LINKS =====
  socialLinks: {
    linkedIn: String,
    twitter: String,
    github: String,
    medium: String,
    portfolio: String,
    youtube: String,
  },

  // ===== CURRICULUM =====
  curriculum: {
    available: {
      type: Boolean,
      default: false,
    },
    description: String,
    topics: [
      {
        type: String,
      },
    ],
  },

  // ===== APPLICATION STATUS =====
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'More Info Requested'],
    default: 'Pending',
  },

  // ===== TRACKING =====
  trackingId: {
    type: String,
    unique: true,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },

  // ===== ADMIN ACTIONS =====
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  adminNotes: {
    type: String,
  },
  rejectionReason: {
    type: String,
  },
  moreInfoRequest: {
    requestedAt: Date,
    requestDetails: String,
    responseReceived: {
      type: Boolean,
      default: false,
    },
    response: String,
    respondedAt: Date,
  },

  // ===== MENTOR ACCOUNT LINK =====
  mentorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  mentorProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorProfile',
  },

  // ===== TIMESTAMPS =====
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ===== INDEXES =====
ApplicationSchema.index({ email: 1 });
ApplicationSchema.index({ phone: 1 });
ApplicationSchema.index({ trackingId: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ submittedAt: -1 });
ApplicationSchema.index({ reviewedAt: -1 });

// ===== PRE-VALIDATE: Generate Tracking ID =====
ApplicationSchema.pre('validate', async function (next) {
  if (!this.trackingId) {
    let trackingId;
    let isUnique = false;
    while (!isUnique) {
      // Generate 8-character alphanumeric tracking ID
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      trackingId = 'MNT-';
      for (let i = 0; i < 6; i++) {
        trackingId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existingApp = await this.constructor.findOne({ trackingId });
      if (!existingApp) {
        isUnique = true;
      }
    }
    this.trackingId = trackingId;
  }
  next();
});

// ===== PRE-SAVE: Update timestamp =====
ApplicationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// ===== STATIC METHODS =====

// Find pending applications
ApplicationSchema.statics.findPending = function () {
  return this.find({ status: 'Pending' }).sort({ submittedAt: 1 });
};

// Find applications by status
ApplicationSchema.statics.findByStatus = function (status) {
  return this.find({ status }).sort({ submittedAt: -1 });
};

// Get application statistics
ApplicationSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    Pending: 0,
    'Under Review': 0,
    Approved: 0,
    Rejected: 0,
    'More Info Requested': 0,
  };

  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  return result;
};

// Check for duplicate applications
ApplicationSchema.statics.checkDuplicate = async function (email, phone) {
  const existing = await this.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }],
    status: { $in: ['Pending', 'Under Review', 'More Info Requested'] },
  });
  return existing;
};

// ===== INSTANCE METHODS =====

// Approve application
ApplicationSchema.methods.approve = async function (adminId) {
  this.status = 'Approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  return this.save();
};

// Reject application
ApplicationSchema.methods.reject = async function (adminId, reason) {
  this.status = 'Rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Request more info
ApplicationSchema.methods.requestMoreInfo = async function (adminId, details) {
  this.status = 'More Info Requested';
  this.moreInfoRequest = {
    requestedAt: new Date(),
    requestDetails: details,
    responseReceived: false,
  };
  this.reviewedBy = adminId;
  return this.save();
};

// Respond to more info request
ApplicationSchema.methods.respondToInfoRequest = async function (response) {
  this.moreInfoRequest.responseReceived = true;
  this.moreInfoRequest.response = response;
  this.moreInfoRequest.respondedAt = new Date();
  this.status = 'Under Review';
  return this.save();
};

module.exports = mongoose.model('Application', ApplicationSchema);
