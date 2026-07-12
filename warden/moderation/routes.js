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

router.put(
  '/:postId/forward',
  authenticateToken,
  authorizeRoles('warden'),
  moderationController.forwardToAdmin
);

// Test route to create a pending post as a student
router.post(
  '/test/:studentId',
  authenticateToken,
  authorizeRoles('warden'),
  moderationController.testCreatePost
);

router.delete(
  '/:postId',
  authenticateToken,
  authorizeRoles('warden'),
  moderationController.deletePendingPost
);

module.exports = router;
