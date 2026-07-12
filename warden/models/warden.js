const mongoose = require("mongoose");

const wardenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    hostelName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      // you can add required: true if every warden must belong to hostel
    },

    phone: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    DOB: {
      type: Date,
    },

    address: {
      type: String,
      trim: true,
    },

    qualification: {
      type: String,
      trim: true,
    },

    joiningDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive"],
      default: "Active",
    },

    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },

    profilePic: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Warden", wardenSchema);