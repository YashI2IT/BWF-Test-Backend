const mongoose = require('mongoose');

const teacherScheduleSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['in_person', 'online'],
    default: 'in_person'
  },
  date: {
    type: String,
    required: true, // Format: YYYY-MM-DD
    index: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  joinLink: {
    type: String,
    default: null
  },
  attachments: [{
    name: String,
    url: String,
    type: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    avatar: String,
    text: {
      type: String,
      required: true
    },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('TeacherSchedule', teacherScheduleSchema);
