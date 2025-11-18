const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  domain: {
    type: String,
    required: true,
    enum: ['R', 'I', 'A', 'S', 'E', 'C']
  },
  text: { type: String, required: true },
  order: { type: Number, required: true }
}, { timestamps: true });

questionSchema.index({ domain: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
