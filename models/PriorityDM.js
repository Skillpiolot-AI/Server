/**
 * PriorityDM.js
 * Async messaging thread between a mentee and a mentor.
 * Each thread is tied to a PriorityDM service purchase.
 *
 * Thread lifecycle:
 *   open → (mentor replies) → active → (response_time exceeded or manually closed) → closed
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

    // Response commitment from mentor (from MentorService.responseTime)
    responseDeadline: {
      type: Date,
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

// ─── Methods ──────────────────────────────────────────────────────────────────

/**
 * Add a message to the thread and update unread counts
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
    if (this.status === 'open') this.status = 'active'; // first message activates thread
  } else {
    this.unreadByMentee += 1;
    if (!this.mentorRepliedAt) {
      this.mentorRepliedAt = new Date();
      this.status = 'active';
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
