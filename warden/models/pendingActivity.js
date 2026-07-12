const mongoose = require("mongoose");

const pendingActivitySchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    requestedBy: {
      type: String,
      required: true,
    },

    requesterRole: {
      type: String,
      enum: ['student', 'staff', 'warden'],
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String, // Format: HH:mm
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ['Cultural', 'Sports', 'Technical', 'Academic', 'Social', 'Entertainment'],
      required: true,
    },

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },

    rejectionReason: {
      type: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },

    hostelName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingActivity", pendingActivitySchema);
