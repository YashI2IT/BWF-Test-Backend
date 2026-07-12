// const express = require('express');
// const router = express.Router();
// const {
//   getTodayCourses,
//   submitTask,
//   markUnderReview,
//   verifyTask,
//   rejectTask,
//   incrementSession
// } = require('./controller');
// const { authenticateToken, authorizeRoles, authorizeSelfOrAdmin } = require('../../auth/middleware');

// // ── Student routes ─────────────────────────────────────────────────────────

// // Get today's full course view (tasks grouped by status + session progress)
// router.get(
//   '/:auth_id',
//   authenticateToken,
//   authorizeRoles('student', 'admin'),
//   authorizeSelfOrAdmin,
//   getTodayCourses
// );

// // Student submits a task ("I'm Done!")
// router.post(
//   '/:auth_id/tasks/:taskId/submit',
//   authenticateToken,
//   authorizeRoles('student'),
//   authorizeSelfOrAdmin,
//   submitTask
// );

// // Increment today's device session counter
// router.post(
//   '/:auth_id/session/increment',
//   authenticateToken,
//   authorizeRoles('student'),
//   authorizeSelfOrAdmin,
//   incrementSession
// );

// // ── Warden / Admin routes ──────────────────────────────────────────────────
// // These don't need authorizeSelfOrAdmin — wardens act on any student's tasks

// // Warden picks up submission for review
// router.put(
//   '/tasks/:taskId/review',
//   authenticateToken,
//   authorizeRoles('warden', 'admin'),
//   markUnderReview
// );

// // Warden approves task
// router.put(
//   '/tasks/:taskId/verify',
//   authenticateToken,
//   authorizeRoles('warden', 'admin'),
//   verifyTask
// );

// // Warden rejects task with feedback
// router.put(
//   '/tasks/:taskId/reject',
//   authenticateToken,
//   authorizeRoles('warden', 'admin'),
//   rejectTask
// );

// module.exports = router;