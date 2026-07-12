const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  auth_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  bio: {
    type: String,
    required: false
  },
  profilePic: {
    type: String,
    required: false
  },
  programName: {
    type: String,
    required: false
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'private', 'students_only'],
    default: 'public'
  },
  gender: { type: String, required: false },
  dob: { type: String, required: false },
  address: { type: String, required: false },
  hostel: { type: String, required: false },
  hostelLocation: { type: String, required: false },
  qualification: { type: String, required: false },
  joiningDate: { type: String, required: false },
  status: { type: String, default: 'Active' },
  emergencyName: { type: String, required: false },
  emergencyPhone: { type: String, required: false },
  emergencyRelation: { type: String, required: false },
  widgetSettings: {
    stats: { type: Boolean, default: true },
    schedule: { type: Boolean, default: true },
    tasks: { type: Boolean, default: true },
    progress: { type: Boolean, default: true }
  }
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
