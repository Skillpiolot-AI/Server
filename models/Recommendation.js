const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  tenthPercentage: {
    type: String,
    required: true,
    enum: ['More than 50', 'More than 60', 'More than 70', 'More than 80', 'More than 90']
  },
  afterTenthStream: {
    type: String,
    required: true,
    enum: ['Science', 'Commerce', 'Arts']
  },
  twelfthPercentage: {
    type: String,
    required: true,
    enum: ['More than 50', 'More than 60', 'More than 70', 'More than 80', 'More than 90']
  },
  jobPreference: {
    type: String,
    required: true,
    enum: ['Government', 'Private']
  },
  interest: {
    type: String,
    required: true
  },
  strength: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  averageSalary: {
    type: Number,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  topCompanies: [{
    type: String,
    required: true
  }],
  skills: [{
    type: String,
    required: true
  }],
  requiredEducation: {
    type: [{
      college: {
        type: String,
        required: true
      },
      fees: {
        type: Number,
        required: true
      },
      duration: {
        type: String,
        required: true
      }
    }],},
  salaryTrends: [{
    year: {
      type: Number,
      required: true
    },
    salary: {
      type: Number,
      required: true
    }
  }],
  hiringTrends: [{
    year: {
      type: Number,
      required: true
    },
    hired: {
      type: Number,
      required: true
    }
  }],
  workEnvironment: {
    type: String,
    required: true,
    enum: ['Offline', 'Online', 'Hybrid']
  },
  challenges: [{
    type: String,
    required: true
  }],
  rewards: [{
    type: String,
    required: true
  }]
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', recommendationSchema);