// models/CalendarEvent.js
const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  date:        { type: Date, required: true },
  endDate:     { type: Date },           // for multi-day events
  type:        { type: String, enum: ['birthday', 'holiday', 'ngo', 'custom', 'academic'], required: true },
  description: { type: String, default: '' },
  home:        { type: String },         // null = all homes
  linkedId:    { type: String },         // student or staff _id for birthdays
  linkedRole:  { type: String, enum: ['student', 'staff'] },
  color:       { type: String, default: '#8c6d4f' },
  createdBy:   { type: String },
  isRecurring: { type: Boolean, default: false }, // for birthdays (yearly)
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
