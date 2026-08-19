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

const postSchema = new mongoose.Schema(
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
      type: String, // Format: HH:mm
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
    mediaUrl: {
      type: String,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'pdf'],
    },
    tags: [{
      type: String,
    }],
    pollOptions: [pollOptionSchema],
    voters: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
      },
      optionIndex: {
        type: Number,
        required: true,
      },
    }],
    rejectionReason: {
      type: String,
    },
    forwardReason: {
      type: String,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    }],
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
      // Supporting all possible creators
    },
    hostelName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
