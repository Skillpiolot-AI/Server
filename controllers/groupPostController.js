const GroupPost = require('../models/GroupPost');
const GroupComment = require('../models/GroupComment');
const SubGroup = require('../models/SubGroup');
const SubGroupRequest = require('../models/SubGroupRequest');
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
// If group requires approval → create a SubGroupRequest instead
exports.createSubGroup = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const group = await Group.findById(req.params.groupId).select('settings owner');
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const cleanSlug = slug.toLowerCase().replace(/\s+/g, '-');

    // Check if slug already taken for approved subgroups
    const exists = await SubGroup.findOne({ parentGroup: req.params.groupId, slug: cleanSlug });
    if (exists) return res.status(400).json({ error: 'A subgroup with this slug already exists' });

    const isOwner = group.owner.toString() === req.user._id.toString();

    if (group.settings?.subgroupCreationRequiresApproval && !isOwner) {
      // Create a pending request instead
      const alreadyPending = await SubGroupRequest.findOne({
        group: req.params.groupId,
        user: req.user._id,
        slug: cleanSlug,
        status: 'Pending',
      });
      if (alreadyPending)
        return res.status(400).json({ error: 'You already have a pending request for this slug' });

      const request = await SubGroupRequest.create({
        group: req.params.groupId,
        user: req.user._id,
        name: xss(name),
        slug: cleanSlug,
        description: xss(description || ''),
      });
      return res.status(201).json({ requiresApproval: true, request });
    }

    // No approval needed → create directly
    const sg = await SubGroup.create({
      name: xss(name),
      slug: cleanSlug,
      description: xss(description || ''),
      parentGroup: req.params.groupId,
      owner: req.user._id,
    });
    res.status(201).json({ requiresApproval: false, subGroup: sg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /groups/:groupId/subgroups/requests (admin only — checked in route)
exports.getSubgroupRequests = async (req, res) => {
  try {
    const requests = await SubGroupRequest.find({ group: req.params.groupId, status: 'Pending' })
      .populate('user', 'name avatar email')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /groups/:groupId/subgroups/requests/:reqId/handle  { action: 'approve' | 'reject', rejectionReason? }
exports.handleSubgroupRequest = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const request = await SubGroupRequest.findById(req.params.reqId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.group.toString() !== req.params.groupId)
      return res.status(403).json({ error: 'Not authorized' });

    if (action === 'approve') {
      // Create actual subgroup
      const exists = await SubGroup.findOne({
        parentGroup: req.params.groupId,
        slug: request.slug,
      });
      if (exists) {
        request.status = 'Rejected';
        request.rejectionReason = 'Slug already taken';
        await request.save();
        return res.status(400).json({ error: 'A subgroup with this slug was already created' });
      }
      await SubGroup.create({
        name: request.name,
        slug: request.slug,
        description: request.description,
        parentGroup: request.group,
        owner: request.user,
      });
      request.status = 'Approved';
    } else {
      request.status = 'Rejected';
      request.rejectionReason = rejectionReason || '';
    }

    request.handledBy = req.user._id;
    request.handledAt = new Date();
    await request.save();

    res.json({ message: `Request ${request.status}`, request });
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
    else sortOption = { isPinned: -1, score: -1, createdAt: -1 }; // hot

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

// POST /groups/:groupId/posts — body-only (no title)
exports.createPost = async (req, res) => {
  try {
    const { body, subGroup, flair } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Post body is required' });

    // Verify membership
    const isMember = await GroupMember.findOne({ group: req.params.groupId, user: req.user._id });
    if (!isMember) return res.status(403).json({ error: 'You must be a member to post' });

    const post = await GroupPost.create({
      body: xss(body.trim()),
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
    const { vote } = req.body;
    const post = await GroupPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = req.user._id;
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
