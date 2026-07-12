const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { authenticateToken } = require('../auth/middleware');

const {
  getTeacherProfile,
  updateTeacherProfile,
  updateTeacherPassword,
  getTeacherDashboard,
  assignMentor,
  addAssignment,
  addSchedule,
  pushMentorNote,
  updateMentorNote,
  deleteMentorNote,
  updateResource,
  getStudentOverview,
  getAssignmentProgress,
  getSubmissions,
  reviewSubmission,
  getMentorNotes,
  getStudents
} = require('./controllers');

const communityController = require('./controllers/community');

const noticesController = require('./controllers/notices');
const complaintsController = require('./controllers/complaints');
const { getTasks, createTask, updateTask, deleteTask, verifyTask } = require('./controllers/tasks');
const scheduleController = require('./controllers/schedule');

// Apply authentication middleware to all teacher routes
router.use(authenticateToken);

// Dashboard & Profile
router.get('/profile', getTeacherProfile);
router.patch('/profile', updateTeacherProfile);
router.patch('/profile/password', updateTeacherPassword);
router.get('/dashboard', getTeacherDashboard);

router.get('/students', getStudents);
router.put('/students/:studentAuthId/mentor', assignMentor);
router.post('/students/:studentAuthId/assignments', upload.single('file'), addAssignment);
router.post('/students/:studentAuthId/schedule', addSchedule);
router.post('/students/:studentAuthId/mentor-note', pushMentorNote);
router.put('/mentor-notes/:noteId', updateMentorNote);
router.delete('/mentor-notes/:noteId', deleteMentorNote);

router.get('/mentor-notes', getMentorNotes);

router.put('/resources/:key', updateResource);

router.get('/students/:studentAuthId/overview', getStudentOverview);
router.get('/students/:studentAuthId/assignment-progress', getAssignmentProgress);

router.get('/submissions', getSubmissions);
router.patch('/submissions/:submissionId/review', reviewSubmission);

// Community Posts
router.get('/posts', communityController.getPosts);
router.post('/posts', upload.single('media'), communityController.createPost);
router.put('/posts/:postId', communityController.updatePost);
router.delete('/posts/:postId', communityController.deletePost);
router.post('/posts/:postId/vote', communityController.voteOnPost);
router.put('/posts/:postId/pin', communityController.togglePinPost);

// Notices
router.get('/notices', noticesController.getNotices);
router.post('/notices', upload.single('image'), noticesController.createNotice);
router.put('/notices/:noticeId', upload.single('image'), noticesController.updateNotice);
router.delete('/notices/:noticeId', noticesController.deleteNotice);

// Complaints
router.get('/complaints', complaintsController.getComplaints);
router.get('/complaints/history', complaintsController.getHistory);
router.put('/complaints/:id/approve', complaintsController.approveComplaint);
router.put('/complaints/:id/reject', complaintsController.rejectComplaint);
router.delete('/complaints/:id', complaintsController.deleteComplaint);
router.delete('/complaints/history/:id', complaintsController.deleteComplaint);

// Custom Tasks (Activities)
router.get('/tasks', getTasks);
router.post('/tasks', upload.single('file'), createTask);
router.put('/tasks/:taskId', upload.single('file'), updateTask);
router.delete('/tasks/:taskId', deleteTask);
router.put('/tasks/:taskId/verify', verifyTask);

// Schedule (Timetable)
router.get('/schedule', scheduleController.getSchedule);
router.post('/schedule', upload.array('attachments', 5), scheduleController.createSchedule);
router.post('/schedule/:id/comments', scheduleController.addComment);
router.put('/schedule/:id', scheduleController.updateSchedule);
router.delete('/schedule/:id', scheduleController.deleteSchedule);

module.exports = router;
