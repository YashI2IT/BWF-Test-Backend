const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    auth_id: {
      type: String,
      required: true
    },

    message: {
      type: String,
      trim: true,
      minlength: 10,
      maxLength: 1000,
      required: true
    },

    anonymous: {
      type: Boolean,
      default: false
    },

    category: {
      type: String,
      enum: ["Hostel & Facilities", "Academic Pressure", "Peer Conflict", "Safety/Personal", "Other"],
      default: "other"
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    status: {
      type: String,
      enum: ["open", "resolved", "escalated"],
      default: "open"
    },

    type: {
      type: String,
      enum: ["complaint", "activity"],
      default: "complaint"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);