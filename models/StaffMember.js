// models/StaffMember.js
// Represents a BWF staff member (housemother, dean, counsellor, warden, volunteer).
// Tracks certifications, caseload, permissions, and employment period.

const mongoose = require('mongoose');

const certSchema = new mongoose.Schema({
  name:        { type: String, required: true }, // e.g. "Trauma-Sensitive Care"
  completedOn: { type: Date },
  expiresOn:   { type: Date }, // null = no expiry
  status:      { type: String, enum: ['valid', 'expiring_soon', 'expired', 'not_done'], default: 'not_done' }
}, { _id: false });

const staffSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String },
  phone:    { type: String },
  role:     { type: String, enum: ['housemother', 'dean', 'counsellor', 'warden', 'volunteer', 'admin_staff'], required: true },
  house:    { type: String, enum: ['Jammu', 'Anantnag', 'Kupwara', 'Beerwah', 'All', 'Outside'], required: true },
  type:     { type: String, enum: ['full-time', 'part-time', 'volunteer'], default: 'full-time' },
  caseload: { type: Number, default: 0 }, // number of students assigned
  status:   { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
  certifications: { type: [certSchema], default: [] },
  permissions: {
    viewStudents:    { type: Boolean, default: true },
    editStudents:    { type: Boolean, default: false },
    approveExpenses: { type: Boolean, default: false },
    manageMedia:     { type: Boolean, default: false },
    viewReports:     { type: Boolean, default: true }
  },
  joinedOn: { type: Date, default: Date.now },
  leftOn:   { type: Date }, // null if currently active
  notes:    { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StaffMember', staffSchema);
