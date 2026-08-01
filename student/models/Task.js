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
    type: String
  },
  assignedTo: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileType: {
    type: String
  },
  status: {
    type: String,
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
