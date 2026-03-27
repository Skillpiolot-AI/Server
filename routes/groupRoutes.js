const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const groupMessageController = require('../controllers/groupMessageController');
const { auth, optionalAuth } = require('../middleware/auth');
const { checkGroupPermission } = require('../middleware/groupAuth');
const rateLimit = require('express-rate-limit');

// Rate Limiter
const groupActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many actions, please try again later.',
});

const postMessageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10, // 10 messages per minute
  message: 'You are posting too fast.',
});

// GROUP MANAGEMENT
router.post('/', auth, groupActionLimiter, groupController.createGroup);
router.get('/', optionalAuth, groupActionLimiter, groupController.getGroups);
router.get('/my-groups', auth, groupActionLimiter, groupController.getMyGroups);
router.get('/:groupId', optionalAuth, groupActionLimiter, groupController.getGroupById);
router.post('/:groupId/join', auth, groupActionLimiter, groupController.joinGroup);
router.post('/:groupId/leave', auth, groupActionLimiter, groupController.leaveGroup);
router.get('/:groupId/members', auth, groupActionLimiter, groupController.getGroupMembers);
router.post('/requests/handle', auth, groupActionLimiter, groupController.handleJoinRequest);

// ADMIN/MODERATOR ACTIONS
router.post(
  '/:groupId/members/remove',
  auth,
  checkGroupPermission('banUser'),
  groupController.removeUser
);
router.post(
  '/:groupId/ban-user',
  auth,
  checkGroupPermission('banUser'),
  groupController.banUserDirect
);
router.post('/:groupId/mute-user', auth, checkGroupPermission('banUser'), groupController.muteUser);

// GROUP MESSAGING & CONTENT
router.post(
  '/:groupId/messages',
  auth,
  postMessageLimiter,
  checkGroupPermission('postContent'),
  groupMessageController.postMessage
);
router.get('/:groupId/messages', auth, checkGroupPermission(), groupMessageController.getMessages);
router.delete(
  '/:groupId/messages/:messageId',
  auth,
  checkGroupPermission(), // internal check if owner vs mod
  groupMessageController.deleteMessage
);
router.post(
  '/:groupId/messages/:messageId/pin-shoutout',
  auth,
  checkGroupPermission(), // internal checks handled inside controller
  groupMessageController.togglePinshoutout
);

// UPDATE GROUP (Admin only)
router.put(
  '/:groupId',
  auth,
  checkGroupPermission('updateGroupSettings'),
  groupController.updateGroup
);

// ─── SUBGROUPS ─────────────────────────────────────────────
const groupPostController = require('../controllers/groupPostController');
router.get('/:groupId/subgroups', optionalAuth, groupPostController.getSubGroups);
router.post('/:groupId/subgroups', auth, groupPostController.createSubGroup);

// ─── POST FEED ─────────────────────────────────────────────
router.get('/:groupId/feed', optionalAuth, groupPostController.getGroupFeed);
router.post('/:groupId/posts', auth, groupPostController.createPost);
router.get('/:groupId/posts/:postId', optionalAuth, groupPostController.getPost);
router.post('/:groupId/posts/:postId/vote', auth, groupPostController.votePost);
router.delete('/:groupId/posts/:postId', auth, groupPostController.deletePost);

// ─── COMMENTS ──────────────────────────────────────────────
router.get('/:groupId/posts/:postId/comments', optionalAuth, groupPostController.getComments);
router.post('/:groupId/posts/:postId/comments', auth, groupPostController.createComment);
router.post(
  '/:groupId/posts/:postId/comments/:commentId/vote',
  auth,
  groupPostController.voteComment
);
router.post(
  '/:groupId/posts/:postId/comments/:commentId/report',
  auth,
  groupPostController.reportComment
);
router.delete(
  '/:groupId/posts/:postId/comments/:commentId',
  auth,
  groupPostController.deleteComment
);

module.exports = router;
