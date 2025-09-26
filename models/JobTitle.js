const mongoose = require('mongoose');

const jobTitleSchema = new mongoose.Schema({
  title: { type: String, required: true },
});

module.exports = mongoose.model('JobTitle', jobTitleSchema);