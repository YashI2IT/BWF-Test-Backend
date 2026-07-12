const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

const pendingPostSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    author: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Forwarded'],
      default: 'Pending',
    },
    type: {
      type: String,
      enum: ['text', 'poll'],
      default: 'text',
    },
    tags: [{
      type: String,
    }],
    pollOptions: [pollOptionSchema],
    rejectionReason: {
      type: String,
    },
    forwardReason: {
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
    forwardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    creatorRole: {
      type: String,
      required: true,
    },
    hostelName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingPost", pendingPostSchema);
