// const Task = require('../models/Task');
// const DeviceSession = require('../models/DeviceSession');

// // Groups a flat list of tasks into the four sections the UI renders.
// // Doing this in the service layer keeps the controller clean and makes
// // it easy to reuse if a mobile endpoint needs the same structure.
// function groupTasksByStatus(tasks) {
//   return {
//     todo: tasks.filter(t => t.status === 'todo'),
//     student_submitted: tasks.filter(t => t.status === 'student_submitted'),
//     under_review: tasks.filter(t => t.status === 'under_review'),
//     verified: tasks.filter(t => t.status === 'verified')
//   };
// }

// // Returns today's tasks + device session for a student.
// async function getTodayCoursesData(auth_id, date) {
//   const [tasks, session] = await Promise.all([
//     Task.find({ auth_id, scheduledDate: date }).sort({ createdAt: 1 }).lean(),
//     DeviceSession.findOne({ auth_id, date }).lean()
//   ]);

//   return {
//     session,
//     grouped: groupTasksByStatus(tasks),
//     totalTasks: tasks.length,
//     completedTasks: tasks.filter(t => t.status === 'verified').length
//   };
// }

// module.exports = {
//   getTodayCoursesData,
//   groupTasksByStatus
// };