const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  dueDate: {
    type: String, // YYYY-MM-DD
    required: true
  },
  assignedTo: {
    type: String, // auth_id of student
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: false
  },
  fileUrl: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'verified'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
