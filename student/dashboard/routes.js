// student/dashboard/routes.js
const express = require('express');
const router = express.Router();
const { getDashboard, logMood, thankMentor } = require('./controller');
const { authenticateToken, authorizeRoles, authorizeSelfOrAdmin } = require('../../auth/middleware');

// All dashboard routes require a valid token and student/admin role.
// authorizeSelfOrAdmin ensures a student can only see their own dashboard.

router.get(
  '/me',
  authenticateToken,
  authorizeRoles('student', 'admin'),
  authorizeSelfOrAdmin,
  getDashboard
);

router.post(
  '/me/mood',
  authenticateToken,
  authorizeRoles('student'),
  authorizeSelfOrAdmin,
  logMood
);

router.post(
  '/me/mentor-note/:noteId/thanks',
  authenticateToken,
  authorizeRoles('student'),
  authorizeSelfOrAdmin,
  thankMentor
);

module.exports = router;