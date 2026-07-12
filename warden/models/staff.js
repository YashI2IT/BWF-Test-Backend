const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    phone: {
      type: String,
    },
    relation: {
      type: String,
    },
  },
  { _id: false }
);

const staffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      unique: true,
      sparse: true,
    },
    auth_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    registeredByWarden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warden",
    },
    role: {
      type: String,
      enum: ["staff"],
      default: "staff",
      required: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
      set: (value) => {
        if (!value) return value;
        return String(value)
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase());
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    DOB: {
      type: Date,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    hostelName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
    },
    department: {
      type: String,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Volunteer"],
      default: "Full-time",
    },
    shift: {
      type: String,
      enum: ["Morning", "Evening", "Night", "Rotational"],
      default: "Morning",
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    salary: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive"],
      default: "Active",
    },
    adhaarCard: {
      type: String,
      trim: true,
    },
    panCard: {
      type: String,
      trim: true,
    },
    emergencyContact: emergencyContactSchema,
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
