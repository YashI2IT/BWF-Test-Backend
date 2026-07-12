const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../auth/middleware');

const {
  createStudent,
  getStudents,
  updateStudent,
  updateStudentCredentials,
  deleteStudent,
  createStaff,
  getStaff,
  updateStaff,
  updateStaffCredentials,
  deleteStaff,
  getPosts,
  createPost,
  updatePost,
  updatePostPin,
  deletePost,
  votePost,
  getWardenProfile,
  updateWardenProfile,
  getComplaints,
  getComplaintHistory,
  approveComplaint,
  rejectComplaint,
  deleteComplaint,
  deleteComplaintHistory,
  testCreateComplaint,
  getActivities,
  getPendingActivities,
  approveActivity,
  rejectActivity,
  deleteActivity,
  deletePendingActivity,
  testCreateActivity,
} = require('./controller');

// ===== WARDEN PROFILE =====
router.get(
  '/profile',
  authenticateToken,
  authorizeRoles('warden'),
  getWardenProfile
);

router.put(
  '/profile',
  authenticateToken,
  authorizeRoles('warden'),
  updateWardenProfile
);

// ===== STUDENTS =====

// CREATE
router.post(
  '/students',
  authenticateToken,
  authorizeRoles('warden'),
  createStudent
);

// GET ALL
router.get(
  '/students',
  authenticateToken,
  authorizeRoles('warden'),
  getStudents
);

// UPDATE
router.put(
  '/students/:studentId',
  authenticateToken,
  authorizeRoles('warden', 'admin'),
  updateStudent
);

// UPDATE LOGIN CREDENTIALS
router.put(
  '/students/:studentId/credentials',
  authenticateToken,
  authorizeRoles('warden', 'admin'),
  updateStudentCredentials
);

// DELETE
router.delete(
  '/students/:studentId',
  authenticateToken,
  authorizeRoles('warden'),
  deleteStudent
);

// ===== STAFF =====

// CREATE
router.post(
  '/staff',
  authenticateToken,
  authorizeRoles('warden'),
  createStaff
);

// GET ALL
router.get(
  '/staff',
  authenticateToken,
  authorizeRoles('warden'),
  getStaff
);

// UPDATE
router.put(
  '/staff/:staffId',
  authenticateToken,
  authorizeRoles('warden'),
  updateStaff
);

// UPDATE LOGIN CREDENTIALS
router.put(
  '/staff/:staffId/credentials',
  authenticateToken,
  authorizeRoles('warden'),
  updateStaffCredentials
);

// DELETE
router.delete(
  '/staff/:staffId',
  authenticateToken,
  authorizeRoles('warden'),
  deleteStaff
);

// ===== COMMUNITY POSTS =====

// GET ALL / PINNED
router.get(
  '/posts',
  authenticateToken,
  authorizeRoles('warden'),
  getPosts
);

// CREATE
router.post(
  '/posts',
  authenticateToken,
  authorizeRoles('warden'),
  createPost
);

// UPDATE OWN
router.put(
  '/posts/:postId',
  authenticateToken,
  authorizeRoles('warden'),
  updatePost
);

// PIN / UNPIN OWN
router.put(
  '/posts/:postId/pin',
  authenticateToken,
  authorizeRoles('warden'),
  updatePostPin
);

// DELETE OWN
router.delete(
  '/posts/:postId',
  authenticateToken,
  authorizeRoles('warden'),
  deletePost
);

// VOTE ON POLL
router.post(
  '/posts/:postId/vote',
  authenticateToken,
  authorizeRoles('warden'),
  votePost
);

// ===== COMPLAINTS =====
// GET COMPLAINTS
router.get(
  '/complaints',
  authenticateToken,
  authorizeRoles('warden'),
  getComplaints
);

// APPROVE COMPLAINT
router.put(
  '/complaints/:complaintId/approve',
  authenticateToken,
  authorizeRoles('warden'),
  approveComplaint
);

// REJECT COMPLAINT
router.put(
  '/complaints/:complaintId/reject',
  authenticateToken,
  authorizeRoles('warden'),
  rejectComplaint
);

// DELETE CLOSED COMPLAINT
router.delete(
  '/complaints/:complaintId',
  authenticateToken,
  authorizeRoles('warden'),
  deleteComplaint
);

// TEST CREATE COMPLAINT
router.post(
  '/complaints/test/:studentId',
  authenticateToken,
  authorizeRoles('warden'),
  testCreateComplaint
);

// COMPLAINT HISTORY
router.get(
  '/complaints/history',
  authenticateToken,
  authorizeRoles('warden'),
  getComplaintHistory
);

router.delete(
  '/complaints/history/:historyId',
  authenticateToken,
  authorizeRoles('warden'),
  deleteComplaintHistory
);

// ===== ACTIVITIES =====
// GET ALL
router.get(
  '/activities',
  authenticateToken,
  authorizeRoles('warden'),
  getActivities
);

// GET PENDING
router.get(
  '/activities/pending',
  authenticateToken,
  authorizeRoles('warden'),
  getPendingActivities
);

// APPROVE
router.put(
  '/activities/:activityId/approve',
  authenticateToken,
  authorizeRoles('warden'),
  approveActivity
);

// REJECT
router.put(
  '/activities/:activityId/reject',
  authenticateToken,
  authorizeRoles('warden'),
  rejectActivity
);

// DELETE
router.delete(
  '/activities/:activityId',
  authenticateToken,
  authorizeRoles('warden'),
  deleteActivity
);

// DELETE PENDING
router.delete(
  '/activities/pending/:activityId',
  authenticateToken,
  authorizeRoles('warden'),
  deletePendingActivity
);

// TEST CREATE ACTIVITY
router.post(
  '/activities/test/:requesterId',
  authenticateToken,
  authorizeRoles('warden'),
  testCreateActivity
);

// MODERATION ROUTES
const moderationRoutes = require('./moderation/routes');
router.use('/moderation', moderationRoutes);

module.exports = router;
