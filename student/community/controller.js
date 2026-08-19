const CommunityPost = require("../../models/CommunityPost");
const User = require("../../models/User");
const Post = require("../../warden/models/post");
const Student = require("../models/student");
const { getUnifiedCommunityPosts } = require("../../utils/communityFeed");

async function getCommunityPosts (req, res) {
    try {
        const userId = req.user.id;
        const allPosts = await getUnifiedCommunityPosts(userId);
        return res.status(200).json(allPosts);
    } catch (error) {
        console.error("Error fetching community posts:", error);
        return res.status(500).json({error: "An error occurred while fetching community posts."});
    }
}

async function createPost(req, res) {
  try {

    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { category, content, type, pollOptions } = req.body;

    let parsedPollOptions = [];
    if (type === 'poll' && pollOptions) {
        try {
            const options = JSON.parse(pollOptions);
            parsedPollOptions = options.map(opt => ({ text: opt, votes: 0 }));
        } catch (e) {
            console.error("Failed to parse pollOptions:", e);
        }
    }

    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const isVerified = req.user.role !== 'student'; // Teachers, Wardens, Admins are auto-verified
    const roleCapitalized = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);

    let avatarId = user.avatarId || 'default';
    let customAvatarUrl = null;

    if (req.user.role === 'student') {
        const student = await Student.findOne({ auth_id: userId }).lean();
        if (student) {
            avatarId = student.avatarId || avatarId;
            customAvatarUrl = student.customAvatarUrl || null;
        }
    }

    await CommunityPost.create({
      userId: user._id,
      author: user.name,
      avatarId: avatarId,
      customAvatarUrl: customAvatarUrl,
      role: roleCapitalized,
      category,
      content,
      mediaUrl,
      isVerified,
      status: isVerified ? 'approved' : 'pending',
      type: type || 'text',
      pollOptions: parsedPollOptions
    });

    return res.status(201).json({
      success: true,
      message: "Pending review"
    });

  } catch (err) {
    console.error("CREATE POST ERROR:", err);
    require('fs').appendFileSync('debug.log', new Date().toISOString() + ' - CREATE POST ERROR: ' + (err.stack || err) + '\n');
    res.status(500).json({ message: "Server error", details: err.message });
  }
}

async function votePoll(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const postId = req.params.id;
    const { optionIndex } = req.body;

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Check if user already voted
    const existingVoteIndex = post.voters.findIndex(v => v.userId.toString() === userId.toString());
    
    if (existingVoteIndex !== -1) {
       const oldOptionIndex = post.voters[existingVoteIndex].optionIndex;
       // Prevent voting for same twice
       if (oldOptionIndex === optionIndex) {
           return res.status(400).json({ message: "Already voted for this option" });
       }
       // Remove old vote
       if (post.pollOptions[oldOptionIndex] && post.pollOptions[oldOptionIndex].votes > 0) {
           post.pollOptions[oldOptionIndex].votes -= 1;
       }
       post.voters[existingVoteIndex].optionIndex = optionIndex;
    } else {
       post.voters.push({ userId, optionIndex });
    }
    
    if (post.pollOptions[optionIndex]) {
       post.pollOptions[optionIndex].votes += 1;
    }

    await post.save();
    return res.json({ success: true, post });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function toggleLike(req, res) {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    const post = await CommunityPost.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likedBy.includes(userId);

    if (alreadyLiked) {
      post.likedBy.pull(userId);
      post.likes -= 1;
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }

    await post.save();

    return res.json({ likes: post.likes });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getCommunityPosts, createPost, toggleLike, votePoll };