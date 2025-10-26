const mongoose = require('mongoose');

// const PostSchema = new mongoose.Schema({
//   content: {
//     type: String,
//     required: true,
//     maxlength: 280 // Twitter-like character limit
//   },
//   author: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   likes: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }],
//   comments: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Comment' // You might want to create a Comment model as well
//   }],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Post', PostSchema);


// const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 280
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 280 // Twitter-like character limit
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [CommentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', PostSchema);