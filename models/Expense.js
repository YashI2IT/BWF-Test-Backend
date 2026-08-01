// models/Expense.js
// Tracks all operational expenses per home with approval workflow.

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  category:    { type: String, enum: ['Food', 'Education', 'Medical', 'Cosmetics', 'Utilities', 'Maintenance', 'Events', 'Other'], required: true },
  amount:      { type: Number, required: true },
  date:        { type: Date, required: true },
  home:        { type: String, enum: ['Jammu', 'Anantnag', 'Kupwara', 'Beerwah', 'All'], required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  submittedBy: { type: String }, // auth_id of the person who logged it
  approvedBy:  { type: String }, // auth_id of admin who approved
  rejectedBy:  { type: String },
  rejectionReason: { type: String },
  notes:       { type: String },
  receipt:     { type: String } // URL — future use
}, { timestamps: true });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
