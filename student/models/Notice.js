const mongoose = require('mongoose');

// A Notice is an announcement created by admin/warden and broadcast to students.
// The Notice Board supports categories, read state per student, and dismissal.
//
// Read state and dismissed state are tracked in a separate lightweight collection
// (NoticeInteraction) rather than embedding arrays here. Reason: embedding
// an array of 100s of student IDs per notice would bloat documents and hurt
// low-bandwidth syncs significantly.

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  body: {
    type: String,
    required: true
  },

  imageUrl: {
    type: String,
    required: false
  },

  category: {
    type: String,
    enum: ['academic', 'events', 'welfare', 'general'],
    required: true,
    index: true
  },

  // ISO date string for display — "18 Mar 2026"
  publishedDate: {
    type: String,
    required: true
  },

  // Optional deadline for notices (e.g. "Submit by 20 Mar")
  deadline: {
    type: Date,
    required: false
  },

  // Role of the person who created the notice
  authorRole: {
    type: String,
    enum: ['admin', 'warden', 'teacher'],
    default: 'admin'
  },

  // Name of the person who created the notice
  authorName: {
    type: String,
    required: false
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
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

module.exports = mongoose.model('Notice', noticeSchema);