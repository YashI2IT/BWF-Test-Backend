const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../auth/middleware');
const upload = require('../student/community/middleware');
const multer = require('multer');
const memoryUpload = multer({ storage: multer.memoryStorage() });

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
  toggleLike,
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
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getHostels,
} = require('./controller');

const noticesController = require('./noticesController');
const { getDashboardStats } = require('./dashboardController');

// ===== WARDEN DASHBOARD =====
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRoles('warden'),
  getDashboardStats
);

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

// ===== HOSTELS =====
router.get(
  '/hostels',
  authenticateToken,
  authorizeRoles('warden'),
  getHostels
);

// ===== NOTICES =====

// GET ALL NOTICES
router.get('/notices', authenticateToken, authorizeRoles('warden'), noticesController.getNotices);

// CREATE NOTICE (requires multer upload)
router.post(
  '/notices',
  authenticateToken,
  authorizeRoles('warden'),
  memoryUpload.single('image'),
  noticesController.createNotice
);

// UPDATE NOTICE
router.put(
  '/notices/:noticeId',
  authenticateToken,
  authorizeRoles('warden'),
  memoryUpload.single('image'),
  noticesController.updateNotice
);

// DELETE NOTICE
router.delete(
  '/notices/:noticeId',
  authenticateToken,
  authorizeRoles('warden'),
  noticesController.deleteNotice
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
  (req, res, next) => {
    upload.single('media')(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        try { require('fs').appendFileSync('debug.log', 'Multer Error: ' + (err.stack || err) + '\n'); } catch(e) {}
        return res.status(500).json({ message: "Upload error: " + err.message });
      }
      next();
    });
  },
  createPost
);

// UPDATE OWN
router.put(
  '/posts/:postId',
  authenticateToken,
  authorizeRoles('warden'),
  upload.single('media'),
  (err, req, res, next) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size is 50MB.' });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  },
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

// TOGGLE LIKE
router.post(
  '/posts/:postId/like',
  authenticateToken,
  authorizeRoles('warden'),
  toggleLike
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

// ===== EXPENSES =====
router.get(
  '/expenses',
  authenticateToken,
  authorizeRoles('warden'),
  getExpenses
);

router.post(
  '/expenses',
  authenticateToken,
  authorizeRoles('warden'),
  addExpense
);

router.put(
  '/expenses/:id',
  authenticateToken,
  authorizeRoles('warden'),
  updateExpense
);

router.delete(
  '/expenses/:id',
  authenticateToken,
  authorizeRoles('warden'),
  deleteExpense
);

module.exports = router;
