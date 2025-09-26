// const mongoose = require('mongoose');

// const MentorAppointmentSchema = new mongoose.Schema({
//   mentorId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   requestedDate: {
//     type: Date,
//     required: true
//   },
//   scheduledDate: {
//     type: Date
//   },
//   meetLink: {
//     type: String
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'scheduled', 'completed', 'cancelled'],
//     default: 'pending'
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('MentorAppointment', MentorAppointmentSchema);


const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  communicationSkills: Number,
  clarityOfGuidance: Number,
  learningOutcomes: Number,
  frequencyAndQualityOfMeetings: Number,
  remarks: String
});

const MentorAppointmentSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedDate: {
    type: Date,
    required: true
  },
  scheduledDate: {
    type: Date
  },
  meetLink: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  rating: RatingSchema
}, {
  timestamps: true
});

module.exports = mongoose.model('MentorAppointment', MentorAppointmentSchema);