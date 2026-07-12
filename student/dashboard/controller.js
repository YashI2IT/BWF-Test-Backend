const MoodLog = require('../models/moodLog');
const MentorNote = require('../models/mentorNote');
const {
  getTodaySchedule,
  getRecentAssignments,
  getLatestMentorNote,
  getGlobalResources,
  getTodayString
} = require('./service');

// GET /api/dashboard/:auth_id
// Single endpoint — returns everything the dashboard page needs in one shot.
// Rationale: under limited connectivity, one round trip beats five.
// All sub-queries run in parallel via Promise.all.
async function getDashboard(req, res) {
    const auth_id = req.user.auth_id;

  try {
    const today = getTodayString();

    const [schedule, assignments, mentorNote, todayMood, resources] = await Promise.all([
      getTodaySchedule(auth_id),
      getRecentAssignments(auth_id),
      getLatestMentorNote(auth_id),
      MoodLog.findOne({ auth_id, date: today }).lean(),
      getGlobalResources()
    ]);

    return res.status(200).json({
      today,
      schedule,
      assignments,
      mentorNote,
      resources,
      todayMood: todayMood ? todayMood.mood : null
    });

  } catch (err) {
    console.error('DASHBOARD ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/dashboard/:auth_id/mood
// Student taps Happy / Okay / Need Help.
// Upserts so tapping again today updates instead of duplicating.
async function logMood(req, res) {
  const auth_id = req.user.auth_id;
  const { mood } = req.body;

  const validMoods = ['happy', 'okay', 'need_help'];
  if (!mood || !validMoods.includes(mood)) {
    return res.status(400).json({ message: 'Invalid mood. Must be happy, okay, or need_help' });
  }

  try {
    const today = getTodayString();

    const log = await MoodLog.findOneAndUpdate(
      { auth_id, date: today },
      { mood, last_modified: new Date() },
      { upsert: true, new: true }
    );

    return res.status(200).json({ mood: log.mood, date: log.date });

  } catch (err) {
    console.error('MOOD LOG ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/dashboard/:auth_id/mentor-note/:noteId/thanks
// Student taps "Say thanks" on the mentor note card.
async function thankMentor(req, res) {
  const { noteId } = req.params;
  const auth_id = req.user.auth_id;

  try {
    const note = await MentorNote.findOne({ _id: noteId, auth_id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.thanked = true;
    note.last_modified = new Date();
    await note.save();

    return res.status(200).json({ message: 'Thanks recorded' });

  } catch (err) {
    console.error('THANK MENTOR ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getDashboard,
  logMood,
  thankMentor
};