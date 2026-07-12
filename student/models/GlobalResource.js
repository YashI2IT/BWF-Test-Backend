const mongoose = require('mongoose');

const globalResourceSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  }, // e.g., 'library', 'syllabus', 'contactMentor'
  value: { 
    type: String, 
    required: true 
  },
  last_modified: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('GlobalResource', globalResourceSchema);
