const express = require('express');
const router = express.Router();
const moderationController = require('./controller');
const { authenticateToken, authorizeRoles } = require('../../auth/middleware'); // Adjust path if needed

// All moderation routes are protected for wardens
router.get(
  '/pending',
  authenticateToken,
  authorizeRoles('warden'),
  moderationController.getPendingPosts
);

router.put(
  '/:postId/approve',
  authenticateToken,
  authorizeRoles('warden'),
  moderationController.approvePost
);

router.put(
  '/:postId/reject',
  authenticateToken,
  authorizeRoles('warden'),
  moderationController.rejectPost
);

// Removed forwardToAdmin, testCreatePost, and deletePendingPost routes

module.exports = router;
