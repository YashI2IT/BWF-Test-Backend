const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema({
  auth_id: {
    type: String,
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true
  },

  body: {
    type: String,
    required: true
  },

  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Journal", journalSchema);