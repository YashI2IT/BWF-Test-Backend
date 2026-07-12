// student/models/student_assignment.js
const mongoose = require('mongoose');

// StudentAssignment represents the relationship between a student and an assignment.
// It tracks the student's progress on that assignment, including submission status and any feedback.

const studentAssignmentSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
    index: true
  },

  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true
  },

  status: {
    type: String,
    enum: ["not_submitted", "pending", "approved", "rejected"],
    default: "not_submitted"
  },

  submissionText: {
    type: String,
    default: ""
  },

  submittedDate: String,

  fileUrl: String,
  fileType: String,

  rejectionNote: String

}, { timestamps: true });

module.exports = mongoose.model('StudentAssignment', studentAssignmentSchema);