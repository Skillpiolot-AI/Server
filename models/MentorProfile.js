const mongoose = require('mongoose');

// Review schema for mentor ratings
const MentorReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pricing plan schema
const PricingPlanSchema = new mongoose.Schema({
  duration: {
    type: String,
    enum: ['1 Month', '3 Months', '6 Months'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountPercent: {
    type: Number,
    default: 0,
  },
  features: [
    {
      type: String,
    },
  ],
});

// Availability slot schema
const AvailabilitySlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  startTime: {
    type: String, // Format: "09:00"
    required: true,
  },
  endTime: {
    type: String, // Format: "17:00"
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

// Main MentorProfile Schema
const MentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  },

  // Display Information
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  tagline: {
    type: String,
    maxlength: 200,
    trim: true,
  },
  bio: {
    type: String,
    maxlength: 1000,
    trim: true,
  },
  profileImage: {
    type: String,
    default: '',
  },

  // Location
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India',
    },
  },

  // Professional Info
  expertise: [
    {
      type: String,
      trim: true,
    },
  ], // Java, DSA, System Design, HLD, LLD, etc.

  targetingDomains: [
    {
      type: String,
      trim: true,
    },
  ], // Backend Developer, Frontend, Fullstack, etc.

  preferredMenteeType: [
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

  // Stats & Metrics
  totalPlacements: {
    type: Number,
    default: 0,
  },
  totalMentees: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  reviews: [MentorReviewSchema],

  // Session Configuration
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

  // Pricing
  pricingType: {
    type: String,
    enum: ['free', 'paid', 'freemium'],
    default: 'paid',
  },
  pricingPlans: [PricingPlanSchema],
  trialSession: {
    available: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
    },
    description: String,
  },

  // Sector Type
  sectorType: {
    type: String,
    enum: ['private', 'government', 'combined', 'startup', 'freelance'],
    default: 'private',
  },

  // Availability
  availabilitySlots: [AvailabilitySlotSchema],

  // Busy Dates - specific dates when mentor is unavailable
  busyDates: [
    {
      date: {
        type: Date,
        required: true,
      },
      reason: {
        type: String,
        maxlength: 200,
      },
    },
  ],

  // Referrals & Companies
  referralsInTopCompanies: {
    type: Boolean,
    default: false,
  },
  topCompanies: [
    {
      type: String,
    },
  ], // Google, Microsoft, Amazon, etc.

  // Curriculum
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

  // Social Links
  socialLinks: {
    linkedIn: String,
    twitter: String,
    github: String,
    medium: String,
    portfolio: String,
    youtube: String,
  },

  // Featured & Visibility
  featured: {
    type: Boolean,
    default: false,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  searchTags: [
    {
      type: String,
    },
  ],

  // Profile Change History for Admin Notification
  profileChangeHistory: [
    {
      changedAt: {
        type: Date,
        default: Date.now,
      },
      changes: [
        {
          field: String,
          oldValue: mongoose.Schema.Types.Mixed,
          newValue: mongoose.Schema.Types.Mixed,
        },
      ],
      sessionStats: {
        completed: Number,
        pending: Number,
        total: Number,
      },
      isReviewed: {
        type: Boolean,
        default: false,
      },
    },
  ],

  // Admin Review System (legacy - keeping for compatibility)
  isChangePending: {
    type: Boolean,
    default: false,
  },
  pendingChanges: {
    type: mongoose.Schema.Types.Mixed,
  },

  // Education & Certifications (from application)
  education: [
    {
      degree: String,
      field: String,
      institution: String,
      year: Number,
    },
  ],
  certifications: [
    {
      name: String,
      issuer: String,
      year: Number,
      credentialUrl: String,
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better search performance
MentorProfileSchema.index({ userId: 1 });
MentorProfileSchema.index({ expertise: 1 });
MentorProfileSchema.index({ targetingDomains: 1 });
MentorProfileSchema.index({ 'location.city': 1 });
MentorProfileSchema.index({ averageRating: -1 });
MentorProfileSchema.index({ totalPlacements: -1 });
MentorProfileSchema.index({ featured: 1, isVisible: 1 });
MentorProfileSchema.index({ searchTags: 1 });

// Pre-save middleware
MentorProfileSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Calculate average rating from reviews
  if (this.reviews && this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
    this.totalReviews = this.reviews.length;
  }

  next();
});

// Method to add review
MentorProfileSchema.methods.addReview = async function (userId, rating, comment) {
  // Check if user already reviewed
  const existingReview = this.reviews.find(r => r.userId.toString() === userId.toString());

  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.createdAt = new Date();
  } else {
    this.reviews.push({ userId, rating, comment });
  }

  return this.save();
};

// Static method to find mentors by expertise
MentorProfileSchema.statics.findByExpertise = function (expertise) {
  return this.find({
    expertise: { $in: expertise },
    isVisible: true,
  }).populate('userId', 'name email imageUrl');
};

// Static method to find featured mentors
MentorProfileSchema.statics.findFeatured = function (limit = 10) {
  return this.find({
    featured: true,
    isVisible: true,
  })
    .sort({ averageRating: -1, totalPlacements: -1 })
    .limit(limit)
    .populate('userId', 'name email imageUrl');
};

// Static method for advanced search
MentorProfileSchema.statics.search = function (filters) {
  const query = { isVisible: true };

  if (filters.expertise && filters.expertise.length > 0) {
    query.expertise = { $in: filters.expertise };
  }
  if (filters.targetingDomains && filters.targetingDomains.length > 0) {
    query.targetingDomains = { $in: filters.targetingDomains };
  }
  if (filters.menteeType) {
    query.preferredMenteeType = filters.menteeType;
  }
  if (filters.minRating) {
    query.averageRating = { $gte: filters.minRating };
  }
  if (filters.city) {
    query['location.city'] = new RegExp(filters.city, 'i');
  }
  if (filters.maxPrice) {
    query['pricingPlans.price'] = { $lte: filters.maxPrice };
  }

  return this.find(query)
    .sort({ featured: -1, averageRating: -1 })
    .populate('userId', 'name email imageUrl mentorBadge mentorStatus');
};

module.exports = mongoose.model('MentorProfile', MentorProfileSchema);
