// models/SystemSettings.js - Platform-wide admin settings

const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  // Setting key (unique identifier)
  key: {
    type: String,
    required: true,
  },

  // Global free mentorship toggle
  globalFreeMentorship: {
    enabled: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date, // Optional - if set, free mentorship auto-disables after this
    },
    enabledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    enabledAt: {
      type: Date,
    },
    reason: {
      type: String,
      maxlength: 200,
    },
  },

  // Booking settings
  bookingSettings: {
    // Minimum hours before a session can be booked
    minBookingAdvanceHours: {
      type: Number,
      default: 24,
    },
    // Maximum days in advance a booking can be made
    maxBookingAdvanceDays: {
      type: Number,
      default: 30,
    },
    // Allow cancellation before X hours
    cancellationWindowHours: {
      type: Number,
      default: 12,
    },
    // Auto-confirm bookings (vs manual mentor approval)
    autoConfirmBookings: {
      type: Boolean,
      default: true,
    },
  },

  // Reminder settings (in minutes before session)
  reminderIntervals: {
    type: [Number],
    default: [60, 30, 10, 5, 2], // 1hr, 30min, 10min, 5min, 2min
  },

  // Rating settings
  ratingSettings: {
    // Hours after session completion to send rating request
    requestAfterHours: {
      type: Number,
      default: 1, // 1 hour after completion
    },
    // Hours to submit rating before it expires
    expiryHours: {
      type: Number,
      default: 48,
    },
  },

  // Platform fees (if applicable)
  platformFees: {
    percentage: {
      type: Number,
      default: 0,
    },
    fixedAmount: {
      type: Number,
      default: 0,
    },
  },

  // Last updated
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Pre-save middleware
SystemSettingsSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Explicit unique index
SystemSettingsSchema.index({ key: 1 }, { unique: true });

// Static: Get or create default settings
SystemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: 'main' });

  if (!settings) {
    settings = await this.create({
      key: 'main',
      globalFreeMentorship: { enabled: false },
      bookingSettings: {},
      reminderIntervals: [60, 30, 10, 5, 2],
      ratingSettings: {},
    });
  }

  return settings;
};

// Static: Toggle free mentorship
SystemSettingsSchema.statics.toggleFreeMentorship = async function (
  enabled,
  adminId,
  reason = '',
  endDate = null
) {
  const settings = await this.getSettings();

  settings.globalFreeMentorship = {
    enabled,
    startDate: enabled ? new Date() : settings.globalFreeMentorship.startDate,
    endDate: endDate ? new Date(endDate) : null,
    enabledBy: adminId,
    enabledAt: new Date(),
    reason,
  };

  settings.updatedBy = adminId;
  return settings.save();
};

// Static: Check if free mentorship is active
SystemSettingsSchema.statics.isFreeMentorshipActive = async function () {
  const settings = await this.getSettings();

  if (!settings.globalFreeMentorship.enabled) {
    return false;
  }

  // Check if end date has passed
  if (settings.globalFreeMentorship.endDate) {
    if (new Date() > settings.globalFreeMentorship.endDate) {
      // Auto-disable if end date passed
      settings.globalFreeMentorship.enabled = false;
      await settings.save();
      return false;
    }
  }

  return true;
};

// Static: Update booking settings
SystemSettingsSchema.statics.updateBookingSettings = async function (newSettings, adminId) {
  const settings = await this.getSettings();

  Object.assign(settings.bookingSettings, newSettings);
  settings.updatedBy = adminId;

  return settings.save();
};

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
