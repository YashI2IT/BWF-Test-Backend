const mongoose = require("mongoose");

const complaintTimelineSchema = new mongoose.Schema({
  reportedDate: {
    type: Date,
    required: true,
  },
  reportedTime: {
    type: String,
    required: true,
  },
  resolvedDate: {
    type: Date,
  },
  resolvedTime: {
    type: String,
  },
  resolvedReason: {
    type: String,
  },
  escalatedDate: {
    type: Date,
  },
  escalatedTime: {
    type: String,
  },
  escalatedReason: {
    type: String,
  },
});

const complaintHistorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    reporter: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['student', 'staff'],
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

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },

    status: {
      type: String,
      enum: ['OPEN', 'RESOLVED', 'ESCALATED'],
      default: 'OPEN',
    },

    timeline: {
      type: complaintTimelineSchema,
      required: true,
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

module.exports = mongoose.model("ComplaintHistory", complaintHistorySchema);
