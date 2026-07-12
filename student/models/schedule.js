const mongoose = require('mongoose');

// A schedule entry represents a single class/session on a specific date for a student.
// sessions are created by wardens/admins and linked to students via auth_id.
const scheduleSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true  // e.g. "Math", "Vocational Training", "Life Skills Workshop"
  },

  sessionType: {
    type: String,
    enum: ['class', 'workshop', 'training', 'other'],
    default: 'class'
  },

  // ISO date string for the day this session falls on (YYYY-MM-DD)
  date: {
    type: String,
    required: true,
    index: true
  },

  startTime: {
    type: String,
    required: true  // "10:00 AM" — stored as string to avoid timezone hell on low-connectivity devices
  },

  // optional join link for online sessions
  joinLink: {
    type: String,
    default: null
  },

  // last_modified helps the mobile app resolve conflicts during offline sync
  last_modified: {
    type: Date,
    default: Date.now
  },

  is_synced: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);