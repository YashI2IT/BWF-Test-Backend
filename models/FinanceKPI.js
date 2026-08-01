// models/FinanceKPI.js
// Monthly financial KPIs per home for budget variance, fundraising ROI, and impact tracking.

const mongoose = require('mongoose');

const financeKPISchema = new mongoose.Schema({
  year:              { type: Number, required: true },
  month:             { type: Number, required: true, min: 1, max: 12 },
  home:              { type: String, enum: ['Jammu', 'Anantnag', 'Kupwara', 'Beerwah', 'All'], required: true },
  budget:            { type: Number, default: 0 },  // planned budget for the month
  actualExpenses:    { type: Number, default: 0 },  // what was actually spent
  donations:         { type: Number, default: 0 },  // donations received this month
  fundraisingCost:   { type: Number, default: 0 },  // cost of fundraising activities
  beneficiariesServed: { type: Number, default: 0 } // students served (for Impact per Dollar)
}, { timestamps: true });

// Compound unique index — one record per home per month per year
financeKPISchema.index({ year: 1, month: 1, home: 1 }, { unique: true });

module.exports = mongoose.model('FinanceKPI', financeKPISchema);
