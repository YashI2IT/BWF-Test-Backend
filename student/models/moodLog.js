// student/models/moodLog.js
const mongoose = require('mongoose');

// Each time a student taps Happy / Okay / Need Help on the dashboard, a log entry is created.
// One entry per student per day is enforced at the service layer (upsert on date).
// "Need Help" entries should surface in warden dashboards — that's a future concern,
// but the data needs to be captured correctly now.
const moodLogSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
    index: true
  },

  mood: {
    type: String,
    enum: ['happy', 'okay', 'need_help'],
    required: true
  },

  // "YYYY-MM-DD" — one record per student per day
  date: {
    type: String,
    required: true
  },

  last_modified: {
    type: Date,
    default: Date.now
  },

  context: {
    type: String,
    default: ""
  },

  is_synced: {
    type: Boolean,
    default: true
  },

  thought: {
    type: String,
    default: ""
  },

  reframe: {
    type: String,
    default: ""
  }

}, { timestamps: true });

// Compound unique index: one mood per student per day
moodLogSchema.index({ auth_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MoodLog', moodLogSchema);