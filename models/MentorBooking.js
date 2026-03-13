// models/MentorBooking.js - Mentorship session booking model

const mongoose = require('mongoose');
const crypto = require('crypto');

const MentorBookingSchema = new mongoose.Schema({
  // Unique booking ID for tracking
  bookingId: {
    type: String,
    unique: true,
    default: function () {
      return 'BK-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    },
  },

  // User who booked
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Mentor being booked
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Mentor profile reference
  mentorProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorProfile',
    required: true,
  },

  // Session scheduling
  scheduledAt: {
    type: Date,
    required: true,
    index: true,
  },

  // Selected Service (Topmate-style specific service)
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorService'
  },
  
  // Applied Coupon (if any)
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorCoupon'
  },


  duration: {
    type: Number, // in minutes
    default: 60,
  },

  endTime: {
    type: Date,
  },

  // User's reason/remark for booking
  remark: {
    type: String,
    maxlength: 500,
    trim: true,
  },

  // Topics to discuss
  topics: [
    {
      type: String,
      trim: true,
    },
  ],

  // Status flow: pending -> confirmed -> in-progress -> completed
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
    index: true,
  },

  // Pricing
  isFree: {
    type: Boolean,
    default: false,
  },

  originalPrice: {
    type: Number,
    default: 0,
  },

  paidAmount: {
    type: Number,
    default: 0,
  },

  // Meeting link (sent by mentor)
  meetingLink: {
    type: String,
    trim: true,
  },

  meetingLinkSentAt: {
    type: Date,
  },

  meetingLinkToken: {
    type: String,
    index: true,
  },

  meetingLinkTokenExpiry: {
    type: Date,
  },

  // Reminders tracking
  reminders: {
    oneHour: { sent: { type: Boolean, default: false }, sentAt: Date },
    thirtyMin: { sent: { type: Boolean, default: false }, sentAt: Date },
    tenMin: { sent: { type: Boolean, default: false }, sentAt: Date },
    fiveMin: { sent: { type: Boolean, default: false }, sentAt: Date },
    twoMin: { sent: { type: Boolean, default: false }, sentAt: Date },
  },

  // Rating request tracking
  ratingRequest: {
    sent: { type: Boolean, default: false },
    sentAt: Date,
    expiresAt: Date, // 48 hours after sending
  },

  // Session completion
  startedAt: {
    type: Date,
  },

  completedAt: {
    type: Date,
  },

  completedBy: {
    type: String,
    enum: ['mentor', 'system', 'admin'],
  },

  // Meeting notes (optional, by mentor)
  mentorNotes: {
    type: String,
    maxlength: 1000,
  },

  // User rating & feedback
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    submittedAt: Date,
  },

  // Cancellation info
  cancelledAt: {
    type: Date,
  },

  cancelledBy: {
    type: String,
    enum: ['user', 'mentor', 'admin', 'system'],
  },

  cancellationReason: {
    type: String,
    maxlength: 300,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
MentorBookingSchema.index({ scheduledAt: 1, status: 1 });
MentorBookingSchema.index({ userId: 1, status: 1 });
MentorBookingSchema.index({ mentorId: 1, scheduledAt: 1 });
MentorBookingSchema.index({ 'reminders.oneHour.sent': 1, scheduledAt: 1 });
MentorBookingSchema.index({ 'ratingRequest.sent': 1, completedAt: 1 });

// Pre-save middleware
MentorBookingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Calculate end time
  if (this.scheduledAt && this.duration) {
    this.endTime = new Date(this.scheduledAt.getTime() + this.duration * 60000);
  }

  next();
});

// Generate meeting link token for mentor
MentorBookingSchema.methods.generateMeetingLinkToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.meetingLinkToken = token;
  this.meetingLinkTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min validity
  return token;
};

// Verify meeting link token
MentorBookingSchema.methods.verifyMeetingLinkToken = function (token) {
  return (
    this.meetingLinkToken === token &&
    this.meetingLinkTokenExpiry &&
    new Date() < this.meetingLinkTokenExpiry
  );
};

// Set meeting link
MentorBookingSchema.methods.setMeetingLink = function (link) {
  this.meetingLink = link;
  this.meetingLinkSentAt = new Date();
  this.meetingLinkToken = undefined;
  this.meetingLinkTokenExpiry = undefined;
  return this.save();
};

// Mark as complete
MentorBookingSchema.methods.markComplete = function (completedBy = 'mentor', notes = '') {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = completedBy;
  if (notes) this.mentorNotes = notes;
  return this.save();
};

// Add rating
MentorBookingSchema.methods.addRating = async function (score, comment) {
  this.rating = {
    score,
    comment,
    submittedAt: new Date(),
  };
  await this.save();

  // Update mentor profile average rating
  const MentorProfile = require('./MentorProfile');
  const profile = await MentorProfile.findById(this.mentorProfileId);
  if (profile) {
    await profile.addReview(this.userId, score, comment);
  }

  return this;
};

// Cancel booking
MentorBookingSchema.methods.cancel = function (cancelledBy, reason = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  if (reason) this.cancellationReason = reason;
  return this.save();
};

// Static: Get bookings needing reminders
MentorBookingSchema.statics.getBookingsNeedingReminders = async function () {
  const now = new Date();

  // Find confirmed bookings scheduled in future
  return this.find({
    status: 'confirmed',
    scheduledAt: { $gt: now },
  })
    .populate('userId', 'name email')
    .populate('mentorId', 'name email')
    .populate('mentorProfileId', 'displayName');
};

// Static: Get completed bookings needing rating request
MentorBookingSchema.statics.getBookingsNeedingRatingRequest = async function () {
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  return this.find({
    status: 'completed',
    'ratingRequest.sent': false,
    'rating.submittedAt': { $exists: false },
    completedAt: { $lte: now, $gte: fortyEightHoursAgo },
  })
    .populate('userId', 'name email')
    .populate('mentorId', 'name email')
    .populate('mentorProfileId', 'displayName');
};

// Static: Get user's bookings
MentorBookingSchema.statics.getUserBookings = function (userId, status = null) {
  const query = { userId };
  if (status) query.status = status;

  return this.find(query)
    .sort({ scheduledAt: -1 })
    .populate('mentorId', 'name email imageUrl')
    .populate('mentorProfileId', 'displayName tagline profileImage');
};

// Static: Get mentor's bookings
MentorBookingSchema.statics.getMentorBookings = function (mentorId, status = null) {
  const query = { mentorId };
  if (status) query.status = status;

  return this.find(query).sort({ scheduledAt: -1 }).populate('userId', 'name email imageUrl');
};

// Static: Check for conflicting bookings
MentorBookingSchema.statics.checkConflict = async function (mentorId, scheduledAt, duration) {
  const startTime = new Date(scheduledAt);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  const conflict = await this.findOne({
    mentorId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        scheduledAt: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  });

  return conflict;
};

module.exports = mongoose.model('MentorBooking', MentorBookingSchema);
