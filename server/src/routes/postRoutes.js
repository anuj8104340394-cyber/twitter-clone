const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPostById,
  createPost,
  editPost,
  deletePost,
  toggleLike,
  getFollowingPosts,
  getPostsByHashtag,
  getComplaints,
  updateComplaintStatus
} = require('../controllers/postController');
const {
  getComments,
  createComment
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Posts
router.get('/', optionalAuth, getPosts);
router.get('/following', protect, getFollowingPosts);
router.get('/complaints', optionalAuth, getComplaints);
router.get('/tag/:tag', optionalAuth, getPostsByHashtag);
router.post('/', protect, upload.single('image'), createPost);
router.get('/:id', optionalAuth, getPostById);
router.put('/:id', protect, editPost);
router.patch('/:id/status', protect, updateComplaintStatus);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, toggleLike);

// Post Comments
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, createComment);

module.exports = router;
