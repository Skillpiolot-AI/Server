const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  companiesWorked: [{
    type: String,
  }],
  experience: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  trackingId: {
    type: String,
    unique: true,
    required: true,
  },
});

// Generate a random 5-digit tracking ID
ApplicationSchema.pre('validate', async function(next) {
  if (!this.trackingId) {
    let trackingId;
    let isUnique = false;
    while (!isUnique) {
      trackingId = Math.floor(10000 + Math.random() * 90000).toString();
      const existingApp = await this.constructor.findOne({ trackingId });
      if (!existingApp) {
        isUnique = true;
      }
    }
    this.trackingId = trackingId;
  }
  next();
});

module.exports = mongoose.model('Application', ApplicationSchema);