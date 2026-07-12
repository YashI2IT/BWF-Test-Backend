const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    author: { type: String, required: true },

    avatarId:  String,

    role: { type: String, enum: ['Student', 'Warden', 'Admin'], required: true },

    category: { type: String, enum: ['Win', 'Story', 'Gratitude', 'Highlight'], required: true },

    content: { type: String, required: true },

    likes: { type: Number, default: 0 },

    mediaUrl: { type: String },

    isVerified: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);