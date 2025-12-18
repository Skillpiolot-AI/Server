const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },


  // ============ PERSONAL INFORMATION ============
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  country: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    maxlength: 500,
  },

  // ============ 10TH GRADE DETAILS ============
  tenthGrade: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    board: {
      type: String,
      enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Other'],
    },
    year: {
      type: Number,
      min: 1990,
      max: 2100,
    },
    school: {
      type: String,
      trim: true,
    },
    // Legacy subject-specific fields
    maths: { type: Number, min: 0, max: 100 },
    science: { type: Number, min: 0, max: 100 },
    english: { type: Number, min: 0, max: 100 },
  },

  // ============ 12TH GRADE DETAILS ============
  twelfthGrade: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    board: {
      type: String,
      enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Other'],
    },
    stream: {
      type: String,
      enum: ['Science', 'Commerce', 'Arts', 'Other'],
    },
    year: {
      type: Number,
      min: 1990,
      max: 2100,
    },
    school: {
      type: String,
      trim: true,
    },
    // Legacy subject-specific fields
    maths: { type: Number, min: 0, max: 100 },
    physics: { type: Number, min: 0, max: 100 },
    chemistry: { type: Number, min: 0, max: 100 },
  },

  // ============ UNDERGRADUATE DETAILS ============
  undergraduate: {
    status: {
      type: String,
      enum: ['not_started', 'pursuing', 'completed'],
      default: 'not_started',
    },
    courseName: {
      type: String,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    collegeName: {
      type: String,
      trim: true,
    },
    university: {
      type: String,
      trim: true,
    },
    startYear: {
      type: Number,
      min: 1990,
      max: 2100,
    },
    passoutYear: {
      type: Number,
      min: 1990,
      max: 2100,
    },
    expectedPassoutYear: {
      type: Number,
      min: 1990,
      max: 2100,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
  },

  // ============ GRADUATION/POST-GRADUATION DETAILS ============
  graduation: {
    status: {
      type: String,
      enum: ['not_applicable', 'not_started', 'pursuing', 'completed'],
      default: 'not_applicable',
    },
    courseName: {
      type: String,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    collegeName: {
      type: String,
      trim: true,
    },
    university: {
      type: String,
      trim: true,
    },
    startYear: {
      type: Number,
      min: 1990,
      max: 2100,
    },
    passoutYear: {
      type: Number,
      min: 1990,
      max: 2100,
    },
    expectedPassoutYear: {
      type: Number,
      min: 1990,
      max: 2100,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
  },

  // ============ WORK EXPERIENCE ============
  experience: [
    {
      company: {
        type: String,
        trim: true,
      },
      role: {
        type: String,
        trim: true,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      isCurrent: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
        maxlength: 1000,
      },
      location: {
        type: String,
        trim: true,
      },
    },
  ],

  // ============ SOCIAL LINKS ============
  socialLinks: {
    github: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    portfolio: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
    customLinks: [
      {
        name: {
          type: String,
          trim: true,
        },
        url: {
          type: String,
          trim: true,
        },
      },
    ],
  },

  // ============ PREDICTED JOB ROLES ============
  jobRolesPredicted: [
    {
      type: String,
    },
  ],

  // ============ PROJECTS ============
  projects: [
    {
      title: String,
      description: String,
      technologies: [String],
      projectUrl: String,
      githubUrl: String,
      status: {
        type: String,
        enum: ['Completed', 'In Progress', 'Planned'],
      },
      startDate: Date,
      endDate: Date,
    },
  ],

  // ============ CERTIFICATIONS ============
  certifications: [
    {
      title: String,
      issuer: String,
      credentialId: String,
      credentialUrl: String,
      issueDate: Date,
      expiryDate: Date,
      status: {
        type: String,
        enum: ['Achieved', 'In Progress', 'Planned'],
      },
    },
  ],

  // ============ GOALS ============
  goals: [
    {
      title: String,
      description: String,
      targetDate: Date,
      status: {
        type: String,
        enum: ['In Progress', 'Ongoing', 'Not Started', 'Completed'],
      },
    },
  ],

  // ============ SKILLS ============
  skills: [
    {
      name: String,
      level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    },
  ],

  // ============ TIMESTAMPS ============
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to update timestamps
ProfileSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
ProfileSchema.index({ user: 1 }, { unique: true });


module.exports = mongoose.model('Profile', ProfileSchema);
