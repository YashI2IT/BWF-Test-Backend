const Schedule = require('../models/schedule');
const TeacherSchedule = require('../../teacher/models/schedule');
const Assignment = require('../models/assignment');
const MentorNote = require('../models/mentorNote');
const GlobalResource = require('../models/GlobalResource');
const Student = require('../models/student');
const DailyTask = require('../models/dailyTask');

// Returns "YYYY-MM-DD" for today in local server time.
// Used consistently across dashboard queries so everything is date-aligned.
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Today's schedule sorted by start time.
// Limited to 10 — the dashboard card doesn't paginate.
async function getTodaySchedule(auth_id) {
  const today = getTodayString();
  
  // Get student-specific schedules
  const studentSchedules = await Schedule.find({ auth_id, date: today }).lean();
  
  // Get global teacher schedules for today
  const teacherSchedules = await TeacherSchedule.find({ date: today }).lean();
  
  // Combine, sort by start time, and take top 10
  const combined = [...studentSchedules, ...teacherSchedules].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  }).slice(0, 10);
  
  return combined;
}

// Recent assignments — up to 5, sorted by due date ascending so most urgent is first.
// The dashboard only shows 2, but sending 5 gives the frontend flexibility.
async function getRecentAssignments(auth_id) {
  return Assignment.find({ auth_id })
    .sort({ dueDate: 1 })
    .limit(5)
    .lean();
}

// Most recent mentor note for this student.
async function getLatestMentorNote(auth_id) {
  return MentorNote.findOne({ auth_id })
    .sort({ createdAt: -1 })
    .lean();
}

// Fetch all global resources and transform into a single object
async function getGlobalResources() {
  const resources = await GlobalResource.find({}).lean();
  const resourceMap = {
    library: "#",
    syllabus: "#",
    contactMentor: "#"
  };

  resources.forEach(res => {
    resourceMap[res.key] = res.value;
  });

  return resourceMap;
}

// Deterministic daily inspiration — no per-student state, offline-safe.
// Rotates through the active quote pool using day-of-year.
/*
async function getDailyInspiration() {
  // const quotes = await Inspiration.find({ isActive: true }).lean();
  // if (!quotes.length) return null;
  
  const mockQuotes = [
    { quote: "You are braver than you believe.", footer: "BWF" }
  ];

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return mockQuotes[dayOfYear % mockQuotes.length];
}
  */

// Fetch student gamification stats
async function getStudentGamification(auth_id) {
  const student = await Student.findOne({ auth_id }).lean();
  if (!student) return { streak: 0, level: 1, xp: 0, coins: 0 };
  return student.gamification || { streak: 0, level: 1, xp: 0, coins: 0 };
}

// Fetch daily quests progress
async function getDailyQuestsProgress(auth_id) {
  const today = getTodayString();
  const tasks = await DailyTask.find({ auth_id, date: today }).lean();
  
  // If no tasks exist for today, use 3 as a baseline for the UI
  const total = Math.max(tasks.length, 3);
  const completed = tasks.filter(t => t.completed).length;
  
  return { completed, total };
}

module.exports = {
  getTodaySchedule,
  getRecentAssignments,
  getLatestMentorNote,
  getGlobalResources,
  getTodayString,
  getStudentGamification,
  getDailyQuestsProgress
};