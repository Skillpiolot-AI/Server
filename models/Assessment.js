const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  answers: {
    type: Map,
    of: Number,
    required: true
  },
  results: {
    domainScores: {
      R: Number,
      I: Number,
      A: Number,
      S: Number,
      E: Number,
      C: Number
    },
    percentages: {
      R: Number,
      I: Number,
      A: Number,
      S: Number,
      E: Number,
      C: Number
    },
    hollandCode: String,
    topThreeDomains: [String],
    recommendedCareers: [{
      careerId: Number,
      name: String,
      cluster: String,
      matchScore: Number,
      salary_range: Object,
      future_growth: Object,
      career_type: String,
      minimum_expense: Number,
      icon: String,
      holland_codes: [String] // Added this to store career's Holland codes
    }]
  },
  shareableLink: String,
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
