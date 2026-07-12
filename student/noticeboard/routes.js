// student/noticeboard/routes.js
const express = require('express');
const router = express.Router();
const {
  getNotices,
  markRead,
  markAllRead,
  dismissNotice,
  getUnreadBadge
} = require('./controller');
const { authenticateToken, authorizeRoles } = require("../../auth/middleware");

// All routes require auth. Students only see their own notice state.

router.get(
  '/me',
  authenticateToken,
  authorizeRoles('student', 'admin'),
  getNotices
);

router.get(
  '/me/unread-count',
  authenticateToken,
  authorizeRoles('student', 'admin'),
  getUnreadBadge
);

router.post(
  '/me/notices/:noticeId/read',
  authenticateToken,
  authorizeRoles('student'),
  markRead
);

router.post(
  '/me/read-all',
  authenticateToken,
  authorizeRoles('student'),
  markAllRead
);

// DELETE maps to the X button — dismisses a notice from the student's view
router.delete(
  '/me/notices/:noticeId',
  authenticateToken,
  authorizeRoles('student'),
  dismissNotice
);

module.exports = router;