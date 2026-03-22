const mongoose = require('mongoose');

const GroupJoinRequestSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    message: {
      type: String, // Optional message from user
      maxlength: 500,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    handledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

GroupJoinRequestSchema.index({ group: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('GroupJoinRequest', GroupJoinRequestSchema);
