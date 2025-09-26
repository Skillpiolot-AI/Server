const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    
  },
  jobTitle: {
    type: String,
    
  },
  companiesJoined: [{
    type: String,
   
  }],
  experience: {
    type: Number,
    
    min: 1,
    max: 10,
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'User', 'Mentor'],
  },
  appointments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      required: true
    }
  }],
  newsletter: {
    type: Boolean,
    default: false,
  },
  subscription: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  notes: [{
    content: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', UserSchema);