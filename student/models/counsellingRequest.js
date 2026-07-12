// student/models/counsellingRequest.js
const mongoose = require("mongoose");

const counsellingSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
    index: true
  },

  message: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("CounsellingRequest", counsellingSchema);