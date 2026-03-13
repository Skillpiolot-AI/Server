// models/MentorService.js
// Represents an individual service offering created by a mentor
// Inspired by Topmate.io service types

const mongoose = require('mongoose');

const MentorServiceSchema = new mongoose.Schema(
  {
    // The mentor who owns this service
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Link to mentor's profile document
    mentorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorProfile',
      required: true,
      index: true,
    },

    // ─── Service Type ────────────────────────────────────────────────────────
    serviceType: {
      type: String,
      enum: [
        'one_on_one',       // 1:1 live video/audio session
        'quick_chat',       // Short 15–30 min call
        'mock_interview',   // Live mock interview session
        'career_guidance',  // Career strategy call
        'discovery_call',   // Free intro / discovery call
        'priority_dm',      // Async: paid messaging inbox (monthly)
        'resume_review',    // Async: user uploads doc, mentor reviews
        'portfolio_review', // Async: portfolio document / link review
        'ama',              // Async: Ask Me Anything – single Q&A
        'referral',         // Mentor refers user to a company they know
        'course',           // Digital: self-paced course (external link)
        'workshop',         // Group live event with capacity limit
        'coaching_series',  // Bundle: multi-session package
        'webinar',          // Group live education session
        'custom',           // Anything else the mentor defines
      ],
      required: true,
    },

    // ─── Display Info ────────────────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // Rich-text / markdown description (for detailed service page)
    detailedDescription: {
      type: String,
      maxlength: 5000,
    },

    // Cover image for this service card
    coverImage: {
      type: String,
      default: '',
    },

    // Emoji icon shown on the service card (optional customisation)
    emoji: {
      type: String,
      default: '',
      maxlength: 8,
    },

    // ─── Pricing ─────────────────────────────────────────────────────────────
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      default: 'INR',
    },

    isFree: {
      type: Boolean,
      default: false,
    },

    // ─── Duration / Format ───────────────────────────────────────────────────
    // For live sessions (one_on_one, mock_interview, etc.)
    duration: {
      type: Number, // minutes
      default: 60,
    },

    // For async services: expected response window
    responseTime: {
      type: String, // e.g. "within 24 hours", "within 48 hours"
      default: 'within 48 hours',
    },

    // For coaching_series: how many sessions in the bundle
    sessionCount: {
      type: Number,
      default: 1,
    },

    // For priority_dm: subscription period in months
    subscriptionMonths: {
      type: Number,
      default: 1,
    },

    // For workshops/webinars: max number of attendees
    capacity: {
      type: Number,
      default: null, // null = unlimited
    },

    // For workshops: scheduled date/time
    scheduledAt: {
      type: Date,
      default: null,
    },

    // For courses: external URL (Udemy, Gumroad, YouTube, etc.)
    courseUrl: {
      type: String,
      trim: true,
    },

    // For referrals: which companies the mentor can refer to
    referralCompanies: [
      {
        type: String,
        trim: true,
      },
    ],

    // ─── What's Included ─────────────────────────────────────────────────────
    // Bullet points shown on the service card / detail
    includes: [
      {
        type: String,
        trim: true,
      },
    ],

    // ─── Booking Limits ──────────────────────────────────────────────────────
    // Max bookings of this service per week (null = unlimited)
    weeklyLimit: {
      type: Number,
      default: null,
    },

    // Total bookings ever for this service
    totalBookings: {
      type: Number,
      default: 0,
    },

    // ─── Display & Status ────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // Display order on the mentor's public profile (lower = appears first)
    sortOrder: {
      type: Number,
      default: 0,
    },

    // Tag this service as "popular" / "featured" by the mentor
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
MentorServiceSchema.index({ mentorId: 1, isActive: 1 });
MentorServiceSchema.index({ mentorProfileId: 1, sortOrder: 1 });
MentorServiceSchema.index({ serviceType: 1 });

// ─── Virtual: Is this an async service? ──────────────────────────────────────
MentorServiceSchema.virtual('isAsync').get(function () {
  return ['priority_dm', 'resume_review', 'portfolio_review', 'ama', 'referral', 'course'].includes(
    this.serviceType
  );
});

// ─── Virtual: Is this a live/sync service? ───────────────────────────────────
MentorServiceSchema.virtual('isLive').get(function () {
  return [
    'one_on_one',
    'quick_chat',
    'mock_interview',
    'career_guidance',
    'discovery_call',
    'workshop',
    'webinar',
    'coaching_series',
  ].includes(this.serviceType);
});

// ─── Static: Get all active services for a mentor, sorted ────────────────────
MentorServiceSchema.statics.getForMentor = function (mentorId, includeInactive = false) {
  const query = { mentorId };
  if (!includeInactive) query.isActive = true;
  return this.find(query).sort({ sortOrder: 1, createdAt: 1 });
};

// ─── Static: Increment booking count ─────────────────────────────────────────
MentorServiceSchema.statics.incrementBooking = async function (serviceId) {
  return this.findByIdAndUpdate(serviceId, { $inc: { totalBookings: 1 } }, { new: true });
};

module.exports = mongoose.model('MentorService', MentorServiceSchema);
