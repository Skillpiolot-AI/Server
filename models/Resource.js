// // models/Resource.js
// const mongoose = require('mongoose');

// const ResourceSchema = new mongoose.Schema({
//   imageLink: { type: String, required: true },
//   bookTitle: { type: String, required: true },
//   publishedDate: { type: Date, required: true },
//   publisherName: { type: String, required: true },
//   pdfFile: { type: String, required: true },
//   description: { type: String, required: true },
//   manufactureCompanyName: { type: String, required: true },
// }, { timestamps: true });

// module.exports = mongoose.model('Resource', ResourceSchema);

const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  imageLink: { type: String, required: true },
  bookTitle: { type: String, required: true },
  publishedDate: { type: Date, required: true },
  publisherName: { type: String, required: true },
  pdfLink: { type: String, required: true }, // Changed from pdfFile to pdfLink
  description: { type: String, required: true },
  manufactureCompanyName: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Resource', ResourceSchema);
