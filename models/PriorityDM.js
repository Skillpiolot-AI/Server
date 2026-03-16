/**
 * PriorityDM.js
 * Async messaging thread between a mentee and a mentor.
 * Each thread is tied to a PriorityDM service purchase.
 *
 * Thread lifecycle:
 *   open → mentee sends message → (mentor first-replies → timer starts → active) → expired/closed
 *   Timer does NOT start until mentor sends their first reply.
 */

const mongoose = require('mongoose');

// ─── Single message inside a thread ───────────────────────────────────────────
const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['mentee', 'mentor'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000,
  },
  attachments: [
    {
      url: String,
      filename: String,
      mimetype: String,
    },
  ],
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ─── Thread ────────────────────────────────────────────────────────────────────
const PriorityDMSchema = new mongoose.Schema(
  {
    // Participants
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorProfile',
    },

    // The service that was purchased
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorService',
    },

    // Thread metadata
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'Priority DM',
    },
    status: {
      type: String,
      enum: ['open', 'active', 'closed', 'expired'],
      default: 'open',
    },

    // Duration for this DM (in milliseconds), stored from service at creation
    serviceDurationMs: {
      type: Number,
      default: 0,
    },

    // Expiry: set ONLY when mentor sends first reply (timer starts then)
    expiresAt: {
      type: Date,
      default: null,
    },

    // Response commitment from mentor (from MentorService.responseTime)
    responseDeadline: {
      type: Date,
    },

    // Link to a previous thread between same mentee+mentor (for history)
    previousThreadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PriorityDM',
      default: null,
    },

    // Payment
    isPaid: {
      type: Boolean,
      default: false,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    couponCode: String,
    discountApplied: Number,

    // Messages array (embedded for simplicity — use ref if volume grows)
    messages: [MessageSchema],

    // Unread counts (cached for performance)
    unreadByMentor: {
      type: Number,
      default: 0,
    },
    unreadByMentee: {
      type: Number,
      default: 0,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    mentorRepliedAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
PriorityDMSchema.index({ mentorId: 1, status: 1, lastMessageAt: -1 });
PriorityDMSchema.index({ menteeId: 1, lastMessageAt: -1 });
PriorityDMSchema.index({ mentorId: 1, unreadByMentor: -1 });
PriorityDMSchema.index({ expiresAt: 1, status: 1 }); // for cron cleanup

// ─── Methods ──────────────────────────────────────────────────────────────────

/**
 * Add a message to the thread and update unread counts.
 * IMPORTANT: Timer starts on mentor's FIRST reply.
 */
PriorityDMSchema.methods.addMessage = function (senderId, senderRole, content, attachments = []) {
  this.messages.push({
    sender: senderId,
    senderRole,
    content,
    attachments,
  });

  this.lastMessageAt = new Date();

  // Update unread counts for the OTHER party
  if (senderRole === 'mentee') {
    this.unreadByMentor += 1;
  } else {
    this.unreadByMentee += 1;

    // On mentor's FIRST reply: start the timer, set expiresAt
    if (!this.mentorRepliedAt) {
      this.mentorRepliedAt = new Date();
      this.status = 'active';

      // Calculate expiry based on service duration
      if (this.serviceDurationMs > 0) {
        this.expiresAt = new Date(Date.now() + this.serviceDurationMs);
      }
    }
  }

  return this.save();
};

/**
 * Mark all messages as read by a given role
 */
PriorityDMSchema.methods.markReadBy = function (role) {
  const field = role === 'mentor' ? 'unreadByMentor' : 'unreadByMentee';
  this[field] = 0;

  const now = new Date();
  this.messages.forEach(m => {
    if (m.senderRole !== role && !m.isRead) {
      m.isRead = true;
      m.readAt = now;
    }
  });

  return this.save();
};

module.exports = mongoose.model('PriorityDM', PriorityDMSchema);
