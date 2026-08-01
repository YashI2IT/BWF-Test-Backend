// models/Feedback.js
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  submittedBy:  { type: String, required: true },   // name
  submittedById:{ type: String },                    // student/staff id
  role:         { type: String, enum: ['student', 'staff', 'warden'], required: true },
  home:         { type: String },
  category:     { type: String, enum: ['academics', 'facilities', 'food', 'staff', 'general', 'other'], default: 'general' },
  message:      { type: String, required: true },
  rating:       { type: Number, min: 1, max: 5 },
  anonymous:    { type: Boolean, default: false },
  status:       { type: String, enum: ['new', 'reviewed', 'actioned'], default: 'new' },
  reviewedBy:   { type: String },
  reviewNote:   { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
