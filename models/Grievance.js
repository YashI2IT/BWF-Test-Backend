// models/Grievance.js
const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  submittedBy:   { type: String, required: true },
  submittedById: { type: String },
  role:          { type: String, enum: ['student', 'staff', 'warden'], required: true },
  home:          { type: String },
  type:          { type: String, enum: ['sos', 'help'], required: true },
  subject:       { type: String, required: true },
  message:       { type: String, required: true },
  priority:      { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  status:        { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  resolvedBy:    { type: String },
  resolvedNote:  { type: String },
  resolvedAt:    { type: Date },
  emailSent:     { type: Boolean, default: false },
}, { timestamps: true });

// SoS is always critical priority
grievanceSchema.pre('save', function (next) {
  if (this.type === 'sos') this.priority = 'critical';
  next();
});

module.exports = mongoose.model('Grievance', grievanceSchema);
