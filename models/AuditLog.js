// models/AuditLog.js
// Records every admin action (create/edit/delete) for accountability and traceability.

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId:    { type: String, required: true },
  adminName:  { type: String, required: true },
  action:     { type: String, required: true }, // e.g. ADD_STUDENT, EDIT_STAFF, APPROVE_EXPENSE
  targetType: { type: String, required: true }, // student | staff | expense | post | kpi
  targetId:   { type: String },
  targetName: { type: String },
  before:     { type: mongoose.Schema.Types.Mixed }, // snapshot before change
  after:      { type: mongoose.Schema.Types.Mixed }, // snapshot after change
  note:       { type: String },
  timestamp:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
