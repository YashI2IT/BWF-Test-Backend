// models/Post.js
// Community posts submitted by students, pending admin review before publishing.

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  studentId:   { type: String, required: true },
  studentName: { type: String, required: true },
  home:        { type: String, enum: ['Jammu', 'Anantnag', 'Kupwara', 'Beerwah'], required: true },
  mediaType:   { type: String, enum: ['image', 'video', 'text'], default: 'image' },
  mediaUrl:    { type: String }, // future use — file storage URL
  caption:     { type: String },
  platform:    { type: String, enum: ['internal', 'instagram', 'facebook', 'website'], default: 'internal' },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:  { type: String }, // admin auth_id
  reviewedOn:  { type: Date },
  rejectionReason: { type: String },
  submittedOn: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AdminPost', postSchema);
