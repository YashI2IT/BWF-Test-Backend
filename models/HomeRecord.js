// models/HomeRecord.js
// Tracks all mandated registers/files per BWF home per JJ Model Rules (Rule 21 & 22)
// Ministry of Women and Child Development compliance.

const mongoose = require('mongoose');

// Sub-schema for individual entries within a register
const entrySchema = new mongoose.Schema({
  date:        { type: Date, default: Date.now },
  enteredBy:   { type: String },              // auth_id of staff who made entry
  childId:     { type: String },              // student _id or studentId (if child-linked)
  childName:   { type: String },
  content:     { type: String, required: true }, // main entry content / notes
  referenceNo: { type: String },              // CWC order no., case no., etc.
  attachmentUrl: { type: String },            // future: uploaded doc URL
  status:      { type: String, enum: ['active', 'archived', 'flagged'], default: 'active' },
}, { _id: true, timestamps: true });

const homeRecordSchema = new mongoose.Schema({
  // Which home and which register/file type
  home: {
    type: String,
    enum: ['Jammu', 'Anantnag', 'Kupwara', 'Beerwah'],
    required: true,
  },

  category: {
    type: String,
    enum: [
      // Child Case Files (per-child)
      'SIR',                    // Social Investigation Report
      'ICP',                    // Individual Care Plan
      'medical_records',        // Medical history per child
      'education_records',      // Academic progress per child
      'counseling_notes',       // Counseling / rehabilitation notes
      'restoration_report',     // Restoration & follow-up
      // Admission & Discharge
      'admission_register',     // Admissions log
      'discharge_register',     // Discharge / Restoration register
      // CWC & Legal
      'cwc_order_file',         // CWC Orders
      'production_register',    // Production before CWC/courts
      'case_followup_file',     // Case follow-up records
      'court_documents',        // Court-related documents
      // Health
      'medical_register',       // General medical register
      'immunization_records',   // Vaccination records
      'sick_register',          // Sick children log
      'referral_records',       // Referrals to hospitals
      // Nutrition & Daily Care
      'diet_register',          // Daily diet/menu log
      'stock_register',         // Food & essentials stock
      'daily_routine_register', // Daily routine log
      // Education & Activities
      'education_register',     // School enrolment / progress
      'vocational_training',    // Vocational / skill training
      'attendance_register',    // Attendance log
      'activity_file',          // Activity / skill development file
      // Staff & Administration
      'staff_attendance',       // Staff attendance register
      'staff_personal_files',   // Individual staff files
      'duty_roster',            // Staff duty roster
      'leave_records',          // Staff leave register
      // Financial
      'cash_book',              // Daily cash transactions
      'ledger',                 // Financial ledger
      'budget_expenditure',     // Budget & expenditure file
      'donation_register',      // Donations received log
      // Inspection & Monitoring
      'inspection_register',    // Inspection visits log
      'visitors_book',          // Visitor register
      'complaint_register',     // Suggestion / complaint register
      'social_audit_report',    // Social audit reports
      // Miscellaneous / Legal
      'ngo_registration',       // NGO registration & licenses
      'miscellaneous',          // Other files
    ],
    required: true,
  },

  // Human-readable label
  title: { type: String, required: true },

  // JJ Act rule reference
  ruleReference: { type: String, default: 'JJ Model Rules 2016, Rule 21 & 22' },

  // Is this a per-child file or a shared register?
  fileType: {
    type: String,
    enum: ['per_child', 'shared_register'],
    required: true,
  },

  // For per-child files: link to the child
  childId:   { type: String },   // Student _id
  childName: { type: String },

  // Register status
  status: {
    type: String,
    enum: ['active', 'closed', 'archived', 'missing'],
    default: 'active',
  },

  // Who maintains / is responsible for this record
  maintainedBy: { type: String }, // staff name or role

  // Last physical inspection date
  lastInspectedOn: { type: Date },
  inspectedBy:     { type: String },

  // Notes
  notes: { type: String },

  // Entries log (for registers that accept entries)
  entries: { type: [entrySchema], default: [] },

  // Admin who created/updated this record in the system
  createdBy:  { type: String },
  updatedBy:  { type: String },

}, { timestamps: true });

// Indexes for fast filtering
homeRecordSchema.index({ home: 1, category: 1 });
homeRecordSchema.index({ home: 1, childId: 1 });

module.exports = mongoose.model('HomeRecord', homeRecordSchema);
