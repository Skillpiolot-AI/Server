// const express = require('express');
// const router = express.Router();
// const Post = require('../models/Post'); // You'll need to create this model
// const { verifyToken } = require('../middleware/auth');


// const express = require('express');
// const router = express.Router();
// const Post = require('../models/Post');
// const { verifyToken } = require('../middleware/auth');

// // // Create a new post
// router.post('/posts', verifyToken, async (req, res) => {
//   try {
//     const newPost = new Post({
//       content: req.body.content,
//       author: req.user._id
//     });
//     await newPost.save();
//     res.status(201).json(newPost);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // Get all posts
// router.get('/posts', verifyToken, async (req, res) => {
//   try {
//     const posts = await Post.find()
//       .sort({ createdAt: -1 })
//       .populate('author', 'name imageUrl')
//       .exec();
//     res.json(posts);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Toggle like on a post
// router.post('/posts/:id/like', verifyToken, async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const userLikedIndex = post.likes.indexOf(req.user._id);
//     if (userLikedIndex > -1) {
//       // User has already liked, so unlike
//       post.likes.splice(userLikedIndex, 1);
//     } else {
//       // User hasn't liked, so add like
//       post.likes.push(req.user._id);
//     }

//     await post.save();
//     res.json(post);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // module.exports = router;



// router.post('/', verifyToken, async (req, res) => {
//   try {
//     const newPost = new Post({
//       content: req.body.content,
//       author: req.user._id,
//     });
//     await newPost.save();
//     const populatedPost = await Post.findById(newPost._id).populate('author', 'name imageUrl');
//     res.status(201).json(populatedPost);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// router.get('/', async (req, res) => {
//   try {
//     const posts = await Post.find()
//       .sort({ createdAt: -1 })
//       .populate('author', 'name imageUrl')
//       .populate('comments.author', 'name imageUrl');
//     res.json(posts);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// router.post('/:id/like', verifyToken, async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const userLikedIndex = post.likes.indexOf(req.user._id);
//     if (userLikedIndex > -1) {
//       post.likes.splice(userLikedIndex, 1);
//     } else {
//       post.likes.push(req.user._id);
//     }

//     await post.save();
//     res.json(post);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// router.post('/:id/comments', verifyToken, async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const newComment = {
//       content: req.body.content,
//       author: req.user._id,
//     };

//     post.comments.push(newComment);
//     await post.save();

//     const updatedPost = await Post.findById(req.params.id)
//       .populate('author', 'name imageUrl')
//       .populate('comments.author', 'name imageUrl');

//     res.status(201).json(updatedPost);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');

// Get all posts (public access)
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name imageUrl')
      .populate('comments.author', 'name imageUrl');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new post (requires authentication)
router.post('/posts', verifyToken, async (req, res) => {
  try {
    const newPost = new Post({
      content: req.body.content,
      author: req.user._id,
    });
    await newPost.save();
    const populatedPost = await Post.findById(newPost._id).populate('author', 'name imageUrl');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle like on a post (requires authentication)
router.post('/posts/:id/like', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userLikedIndex = post.likes.indexOf(req.user._id);
    if (userLikedIndex > -1) {
      post.likes.splice(userLikedIndex, 1);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get comments for a post (public access)
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.author', 'name imageUrl');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a comment to a post (requires authentication)
router.post('/posts/:id/comments', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      content: req.body.content,
      author: req.user._id,
    };

    post.comments.push(newComment);
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name imageUrl')
      .populate('comments.author', 'name imageUrl');

    res.status(201).json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.get('/users/random', async (req, res) => {
  try {
    const randomUsers = await User.aggregate([
      { $sample: { size: 5 } },
      { $project: { name: 1, username: 1, imageUrl: 1, followers: 1 } }
    ]);
    res.json(randomUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('followers', 'name username imageUrl')
      .populate('following', 'name username imageUrl');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle follow user
router.post('/users/:userId/follow', verifyToken, async (req, res) => {
  if (req.user._id === req.params.userId) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== userToFollow._id.toString());
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUser._id.toString());
    } else {
      // Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's posts
router.get('/users/:userId/posts', async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name username imageUrl')
      .populate('comments.author', 'name username imageUrl');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;