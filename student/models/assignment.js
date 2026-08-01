// student/models/assignment.js
const mongoose = require('mongoose');

// Assignments are created by wardens/teachers and assigned to students.
// They appear on the dashboard as "Recent Assignments".
const assignmentSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true  // e.g. "Science Project", "English Essay"
  },

  subject: {
    type: String,
    required: true
  },

  // dueDate stored as string "YYYY-MM-DD" — avoids timezone issues on mobile offline
  dueDate: {
    type: String,
    required: true
  },

  // how urgent it looks on the dashboard dot: red = overdue/tomorrow, green = more time
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },

  last_modified: {
    type: Date,
    default: Date.now
  },

  is_synced: {
    type: Boolean,
    default: true
  },

  fileUrl: {
    type: String,
    default: null
  },

  fileType: {
    type: String,
    enum: ["image", "video", "pdf", null],
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);