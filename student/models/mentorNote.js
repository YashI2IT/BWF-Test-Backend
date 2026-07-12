const mongoose = require('mongoose');

// MentorNotes are messages sent by the assigned mentor/warden to a specific student.
// They appear as the "Note from Ms. Dana" card on the dashboard.
// A student can react with a "thanks" — that's the only student action here.
const mentorNoteSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
    index: true
  },

  mentorName: {
    type: String,
    required: true  // "Ms. Dana" — denormalized so dashboard can render without a join
  },

  message: {
    type: String,
    required: true
  },

  // student has tapped "Say thanks"
  thanked: {
    type: Boolean,
    default: false
  },

  last_modified: {
    type: Date,
    default: Date.now
  },

  is_synced: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('MentorNote', mentorNoteSchema);