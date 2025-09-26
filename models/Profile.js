const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tenthGrade: {
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    maths: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    science: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    english: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  twelfthGrade: {
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    maths: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    physics: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    chemistry: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  jobRolesPredicted: [{
    type: String
  }],
  projects: [{
    title: String,
    description: String,
    technologies: [String],
    status: {
      type: String,
      enum: ['Completed', 'In Progress', 'Planned']
    }
  }],
  certifications: [{
    title: String,
    issuer: String,
    status: {
      type: String,
      enum: ['Achieved', 'In Progress', 'Planned']
    }
  }],
  goals: [{
    title: String,
    description: String,
    status: {
      type: String,
      enum: ['In Progress', 'Ongoing', 'Not Started', 'Completed']
    }
  }]
});

module.exports = mongoose.model('Profile', ProfileSchema);