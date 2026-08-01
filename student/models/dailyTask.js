// student/models/dailyTask.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
    index: true
  },

  date: {
    type: String, // YYYY-MM-DD
    required: true
  },

  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

taskSchema.index({ auth_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyTask", taskSchema);