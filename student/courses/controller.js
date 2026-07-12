// const Task = require('../models/Task');
// const DeviceSession = require('../models/DeviceSession');
// const { getTodayCoursesData } = require('./service');

// function getTodayString() {
//   return new Date().toISOString().split('T')[0];
// }

// // GET /api/courses/:auth_id
// // Returns today's task breakdown + device session in one shot.
// async function getTodayCourses(req, res) {
//   const { auth_id } = req.params;
//   const date = req.query.date || getTodayString(); // allow date override for testing

//   try {
//     const data = await getTodayCoursesData(auth_id, date);
//     return res.status(200).json({ date, ...data });

//   } catch (err) {
//     console.error('COURSES FETCH ERROR:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// }

// // POST /api/courses/:auth_id/tasks/:taskId/submit
// // Student taps "I'm Done!" — moves status from todo → student_submitted.
// // Only allowed if the task is currently in "todo" state.
// async function submitTask(req, res) {
//   const { auth_id, taskId } = req.params;

//   try {
//     const task = await Task.findOne({ _id: taskId, auth_id });

//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     if (task.status !== 'todo') {
//       return res.status(400).json({
//         message: `Cannot submit a task that is already in "${task.status}" state`
//       });
//     }

//     task.status = 'student_submitted';
//     task.submittedAt = new Date();
//     task.last_modified = new Date();
//     await task.save();

//     return res.status(200).json({
//       taskId: task._id,
//       status: task.status,
//       submittedAt: task.submittedAt
//     });

//   } catch (err) {
//     console.error('TASK SUBMIT ERROR:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// }

// // PUT /api/courses/tasks/:taskId/review  [warden/admin only]
// // Teacher picks up the submission → moves student_submitted → under_review.
// async function markUnderReview(req, res) {
//   const { taskId } = req.params;

//   try {
//     const task = await Task.findById(taskId);

//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     if (task.status !== 'student_submitted') {
//       return res.status(400).json({
//         message: `Task must be in "student_submitted" state to start review`
//       });
//     }

//     task.status = 'under_review';
//     task.reviewStartedAt = new Date();
//     task.last_modified = new Date();
//     await task.save();

//     return res.status(200).json({
//       taskId: task._id,
//       status: task.status,
//       reviewStartedAt: task.reviewStartedAt
//     });

//   } catch (err) {
//     console.error('TASK REVIEW ERROR:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// }

// // PUT /api/courses/tasks/:taskId/verify  [warden/admin only]
// // Teacher approves → under_review → verified.
// async function verifyTask(req, res) {
//   const { taskId } = req.params;

//   try {
//     const task = await Task.findById(taskId);

//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     if (task.status !== 'under_review') {
//       return res.status(400).json({
//         message: `Task must be "under_review" to verify`
//       });
//     }

//     task.status = 'verified';
//     task.verifiedAt = new Date();
//     task.rejectionNote = null;
//     task.last_modified = new Date();
//     await task.save();

//     return res.status(200).json({
//       taskId: task._id,
//       status: task.status,
//       verifiedAt: task.verifiedAt
//     });

//   } catch (err) {
//     console.error('TASK VERIFY ERROR:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// }

// // PUT /api/courses/tasks/:taskId/reject  [warden/admin only]
// // Teacher rejects → back to todo with a rejection note.
// async function rejectTask(req, res) {
//   const { taskId } = req.params;
//   const { rejectionNote } = req.body;

//   if (!rejectionNote || rejectionNote.trim().length === 0) {
//     return res.status(400).json({ message: 'Rejection note is required' });
//   }

//   try {
//     const task = await Task.findById(taskId);

//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     if (task.status !== 'under_review') {
//       return res.status(400).json({
//         message: `Task must be "under_review" to reject`
//       });
//     }

//     task.status = 'todo';
//     task.rejectionNote = rejectionNote.trim();
//     task.submittedAt = null;
//     task.reviewStartedAt = null;
//     task.last_modified = new Date();
//     await task.save();

//     return res.status(200).json({
//       taskId: task._id,
//       status: task.status,
//       rejectionNote: task.rejectionNote
//     });

//   } catch (err) {
//     console.error('TASK REJECT ERROR:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// }

// // POST /api/courses/:auth_id/session/increment  
// // Increments completedSessions by 1 for today. Upserts if no session exists yet.
// // Called when a student marks a focus session as done.
// async function incrementSession(req, res) {
//   const { auth_id } = req.params;
//   const date = getTodayString();

//   try {
//     // First ensure a session record exists for today
//     let session = await DeviceSession.findOne({ auth_id, date });

//     if (!session) {
//       session = await DeviceSession.create({ auth_id, date, totalSessions: 4, completedSessions: 0 });
//     }

//     if (session.completedSessions >= session.totalSessions) {
//       return res.status(400).json({ message: 'All sessions already completed for today' });
//     }

//     session.completedSessions += 1;
//     session.last_modified = new Date();
//     await session.save();

//     return res.status(200).json({
//       date,
//       completedSessions: session.completedSessions,
//       totalSessions: session.totalSessions
//     });

//   } catch (err) {
//     console.error('SESSION INCREMENT ERROR:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// }

// module.exports = {
//   getTodayCourses,
//   submitTask,
//   markUnderReview,
//   verifyTask,
//   rejectTask,
//   incrementSession
// };