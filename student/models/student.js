const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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


  DOB: {
    type: Date,
    required: true
  },

  bio: {
    type: String,
    required: false
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false
  },

  email: {
    type: String,
    required: false
  },

  contactNumber: {
    type: String,
    required: false
  },

  address: {
    type: String,
    required: false
  },

  hostelName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: false
  },

  mentorName: {
    type: String,
    required: false
  },

  class: {
    type: String,
    required: false
  },

  classInfo: {
    type: String,
    enum: [
      '1st Grade',
      '2nd Grade',
      '3rd Grade',
      '4th Grade',
      '5th Grade',
      '6th Grade',
      '7th Grade',
      '8th Grade',
      '9th Grade',
      '10th Grade',
      '11th Grade',
      '12th Grade'
    ],
    required: false
  },

  schoolName: {
    type: String,
    required: false
  },

  adhaarCard: {
    type: String,
    required: false
  },

  panCard: {
    type: String,
    required: false
  },

  interests: {
    type: [String],
    default: []
  },

  customAvatarUrl: {
    type: String,
    required: false
  },

  avatarId: {
    type: String,
    default: null
  },

  trustedPerson: {
    name: { type: String, required: false },
    phone: { type: String, required: false },
    relation: { type: String, required: false }
  }

}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
