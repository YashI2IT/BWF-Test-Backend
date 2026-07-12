const mongoose = require('mongoose');

// Tracks per-student interaction with a notice: read and dismissed.
// Kept separate from Notice to avoid bloating notice documents.
// One document per (auth_id, notice_id) pair.
//
// This is intentionally lightweight — only two booleans + timestamps.
// The mobile app can batch-sync these in a single request after coming online.

const noticeInteractionSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
    index: true
  },

  noticeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notice',
    required: true
  },

  isRead: {
    type: Boolean,
    default: false
  },

  isDismissed: {
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

noticeInteractionSchema.index({ auth_id: 1, noticeId: 1 }, { unique: true });

module.exports = mongoose.model('NoticeInteraction', noticeInteractionSchema);