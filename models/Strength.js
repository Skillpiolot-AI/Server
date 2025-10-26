const mongoose = require('mongoose');

const strengthSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Strength', strengthSchema);
