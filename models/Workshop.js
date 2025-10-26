const mongoose = require('mongoose');

// const workshopSchema = new mongoose.Schema({
//   title: String,
//   banner: String,
//   date: Date,
//   time: String,
//   location: String,
//   ageGroup: String,
//   language: String,
//   venueAddress: String
// });

const workshopSchema = new mongoose.Schema({
  title: String,
  banner: String, // This will now store the URL
  date: Date,
  time: String,
  location: String,
  ageGroup: String,
  language: String,
  venueAddress: String
});

module.exports = mongoose.model('Workshop', workshopSchema);