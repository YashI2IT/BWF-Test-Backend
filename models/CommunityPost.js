const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },

    author: { type: String, required: true },

    avatarId:  String,
    
    customAvatarUrl: String,

    role: { type: String, enum: ['Student', 'Warden', 'Admin', 'Teacher'], required: true },

    category: { type: String, enum: ['Win', 'Story', 'Gratitude', 'Highlight'], required: true },

    content: { type: String, required: true },

    likes: { type: Number, default: 0 },
    
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],

    mediaUrl: { type: String },

    isVerified: { type: Boolean, default: false },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    type: { type: String, enum: ['text', 'poll'], default: 'text' },

    pollOptions: [{
        text: String,
        votes: { type: Number, default: 0 }
    }],

    voters: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
        optionIndex: Number
    }],

    pinned: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);