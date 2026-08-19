const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
