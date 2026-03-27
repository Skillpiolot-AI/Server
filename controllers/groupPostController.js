const GroupPost = require('../models/GroupPost');
const GroupComment = require('../models/GroupComment');
const SubGroup = require('../models/SubGroup');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const xss = require('xss');

// ─── SUBGROUPS ────────────────────────────────────────────

// GET /groups/:groupId/subgroups
exports.getSubGroups = async (req, res) => {
  try {
    const subgroups = await SubGroup.find({ parentGroup: req.params.groupId })
      .populate('owner', 'name avatar')
      .sort({ membersCount: -1 })
      .limit(20);
    res.json({ subgroups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /groups/:groupId/subgroups
exports.createSubGroup = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const exists = await SubGroup.findOne({
      parentGroup: req.params.groupId,
      slug: slug.toLowerCase(),
    });
    if (exists) return res.status(400).json({ error: 'A subgroup with this slug already exists' });

    const sg = await SubGroup.create({
      name: xss(name),
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      description: xss(description || ''),
      parentGroup: req.params.groupId,
      owner: req.user._id,
    });
    res.status(201).json({ subGroup: sg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POSTS ────────────────────────────────────────────────

// GET /groups/:groupId/feed?sort=hot&page=1&limit=15&subGroup=
exports.getGroupFeed = async (req, res) => {
  try {
    const { sort = 'hot', page = 1, limit = 15, subGroup } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { group: req.params.groupId, isDeleted: false };
    if (subGroup) query.subGroup = subGroup;

    let sortOption = {};
    if (sort === 'new') sortOption = { createdAt: -1 };
    else if (sort === 'top') sortOption = { score: -1 };
    else sortOption = { isPinned: -1, score: -1, createdAt: -1 }; // hot (approximate)

    const [posts, total] = await Promise.all([
      GroupPost.find(query)
        .populate('author', 'name avatar')
        .populate('subGroup', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      GroupPost.countDocuments(query),
    ]);

    res.json({ posts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /groups/:groupId/posts
exports.createPost = async (req, res) => {
  try {
    const { title, body, type, url, subGroup, flair } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    // Verify membership
    const isMember = await GroupMember.findOne({ group: req.params.groupId, user: req.user._id });
    if (!isMember) return res.status(403).json({ error: 'You must be a member to post' });

    const post = await GroupPost.create({
      title: xss(title.trim()),
      body: xss(body || ''),
      type: type || 'text',
      url: url || '',
      author: req.user._id,
      group: req.params.groupId,
      subGroup: subGroup || null,
      flair: flair || '',
    });

    await post.populate('author', 'name avatar');
    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /groups/:groupId/posts/:postId
exports.getPost = async (req, res) => {
  try {
    const post = await GroupPost.findById(req.params.postId)
      .populate('author', 'name avatar')
      .populate('subGroup', 'name slug');
    if (!post || post.isDeleted) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /groups/:groupId/posts/:postId/vote  { vote: 1 | -1 | 0 }
exports.votePost = async (req, res) => {
  try {
    const { vote } = req.body; // 1 = upvote, -1 = downvote, 0 = remove vote
    const post = await GroupPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = req.user._id;
    // Remove existing votes
    post.upvotes = post.upvotes.filter(u => u.toString() !== userId.toString());
    post.downvotes = post.downvotes.filter(u => u.toString() !== userId.toString());

    if (vote === 1) post.upvotes.push(userId);
    else if (vote === -1) post.downvotes.push(userId);

    post.score = post.upvotes.length - post.downvotes.length;
    await post.save();
    res.json({ score: post.score, upvotes: post.upvotes.length, downvotes: post.downvotes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /groups/:groupId/posts/:postId
exports.deletePost = async (req, res) => {
  try {
    const post = await GroupPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const isAuthor = post.author.toString() === req.user._id.toString();
    if (!isAuthor) return res.status(403).json({ error: 'Not authorized' });
    post.isDeleted = true;
    await post.save();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── COMMENTS ─────────────────────────────────────────────

// GET /groups/:groupId/posts/:postId/comments
exports.getComments = async (req, res) => {
  try {
    const comments = await GroupComment.find({
      post: req.params.postId,
      parent: null,
      isDeleted: false,
    })
      .populate('author', 'name avatar')
      .sort({ score: -1, createdAt: -1 })
      .limit(50);

    // Fetch top-level replies for each root comment (2 levels shown initially)
    const commentIds = comments.map(c => c._id);
    const replies = await GroupComment.find({
      post: req.params.postId,
      parent: { $in: commentIds },
    })
      .populate('author', 'name avatar')
      .sort({ score: -1, createdAt: -1 });

    res.json({ comments, replies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /groups/:groupId/posts/:postId/comments  { body, parentId? }
exports.createComment = async (req, res) => {
  try {
    const { body, parentId } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Comment body is required' });

    let depth = 0;
    if (parentId) {
      const parent = await GroupComment.findById(parentId);
      if (!parent) return res.status(404).json({ error: 'Parent comment not found' });
      depth = Math.min(parent.depth + 1, 6);
    }

    const comment = await GroupComment.create({
      body: xss(body.trim()),
      author: req.user._id,
      post: req.params.postId,
      parent: parentId || null,
      depth,
    });

    // Increment commentsCount on post
    await GroupPost.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: 1 } });
    if (parentId) {
      await GroupComment.findByIdAndUpdate(parentId, { $inc: { repliesCount: 1 } });
    }

    await comment.populate('author', 'name avatar');
    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /groups/:groupId/posts/:postId/comments/:commentId/vote  { vote: 1|0 }
exports.voteComment = async (req, res) => {
  try {
    const { vote } = req.body;
    const comment = await GroupComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const uid = req.user._id.toString();
    comment.upvotes = comment.upvotes.filter(u => u.toString() !== uid);
    if (vote === 1) comment.upvotes.push(req.user._id);
    comment.score = comment.upvotes.length;
    await comment.save();
    res.json({ score: comment.score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /groups/:groupId/posts/:postId/comments/:commentId/report  { reason }
exports.reportComment = async (req, res) => {
  try {
    const { reason } = req.body;
    await GroupComment.findByIdAndUpdate(req.params.commentId, {
      $push: { reports: { user: req.user._id, reason: reason || 'No reason given' } },
    });
    res.json({ message: 'Comment reported' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /groups/:groupId/posts/:postId/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const comment = await GroupComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    comment.isDeleted = true;
    comment.body = '[deleted]';
    await comment.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
