const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    // Link to authenticated user (optional for backwards compatibility)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Keep userId for backwards compatibility with existing assessments
    userId: {
      type: String,
      index: true,
    },
    answers: {
      type: Map,
      of: Number,
      required: true,
    },
    results: {
      domainScores: {
        R: Number,
        I: Number,
        A: Number,
        S: Number,
        E: Number,
        C: Number,
      },
      percentages: {
        R: Number,
        I: Number,
        A: Number,
        S: Number,
        E: Number,
        C: Number,
      },
      hollandCode: String,
      topThreeDomains: [String],
      recommendedCareers: [
        {
          careerId: Number,
          name: String,
          cluster: String,
          matchScore: Number,
          salary_range: Object,
          future_growth: Object,
          career_type: String,
          minimum_expense: Number,
          icon: String,
          holland_codes: [String],
        },
      ],
    },
    // Track improvement from previous assessment
    previousAssessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
    },
    improvement: {
      hasImproved: Boolean,
      percentageChange: Number,
      dominantTraitChange: String,
    },
    shareableLink: String,
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for efficient user assessment queries
assessmentSchema.index({ user: 1, completedAt: -1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
