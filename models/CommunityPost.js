const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },

    author: { type: String, required: true },

    avatarId:  String,

    role: { type: String, enum: ['Student', 'Warden', 'Admin', 'Teacher'], required: true },

    category: { type: String, enum: ['Win', 'Story', 'Gratitude', 'Highlight'], required: true },

    content: { type: String, required: true },

    likes: { type: Number, default: 0 },
    
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],

    mediaUrl: { type: String },

    isVerified: { type: Boolean, default: false },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);