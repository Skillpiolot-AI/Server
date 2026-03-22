const mongoose = require('mongoose');

const GroupReportSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['Message', 'User', 'Group'],
      required: true,
    },
    reportedMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupMessage', // If reporting a message
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // If reporting a user directly
    },
    reason: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Dismissed', 'Action Taken'],
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actionTakenInfo: {
      type: String, // What action was done (e.g. banned user, removed post)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroupReport', GroupReportSchema);
