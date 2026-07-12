const Post = require('../../warden/models/post');
const User = require('../../models/User');
const Teacher = require('../models/teacher');
const { uploadToCloudinary } = require('../../utils/cloudinary');

const postToResponse = (post, userId) => {
  const object = post.toObject ? post.toObject() : post;
  const voter = object.voters?.find(v => String(v.userId) === String(userId));
  return {
    ...object,
    canManage: String(object.creatorId) === String(userId),
    userVote: voter ? voter.optionIndex : null,
  };
};

const normalizeTags = (tags = []) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .slice(0, 10);
};

const normalizePollOptions = (type, pollOptions = [], previousOptions = []) => {
  if (type !== "poll") return [];
  if (!Array.isArray(pollOptions)) return [];

  const previousVotes = new Map(
    previousOptions.map((option) => [String(option.text).trim().toLowerCase(), option.votes || 0])
  );

  const options = pollOptions
    .map((option) => {
      const text = typeof option === "string" ? option : option?.text;
      const normalizedText = String(text || "").trim();
      return normalizedText
        ? {
          text: normalizedText,
          votes: previousVotes.get(normalizedText.toLowerCase()) || 0,
        }
        : null;
    })
    .filter(Boolean)
    .slice(0, 4);

  return options;
};

async function getPosts(req, res) {
  try {
    const userId = req.user.id;
    const { pinned } = req.query;

    const query = {};
    if (pinned === "true") {
      query.pinned = true;
    }
    // Note: Teacher gets all posts globally since they don't have a specific hostel.

    const posts = await Post.find(query)
      .populate("hostelName")
      .sort({ date: -1, time: -1, createdAt: -1 })
      .select("-__v");

    return res.status(200).json(posts.map((post) => postToResponse(post, userId)));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createPost(req, res) {
  try {
    const userId = req.user.id;
    let { content, type, tags, pollOptions } = req.body;

    // Parse stringified arrays if sent via FormData
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch (e) { tags = []; }
    }
    if (typeof pollOptions === 'string') {
      try { pollOptions = JSON.parse(pollOptions); } catch (e) { pollOptions = []; }
    }

    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const options = normalizePollOptions(type, pollOptions);
    if (type === "poll" && options.length < 2) {
      return res.status(400).json({ message: "Poll requires at least 2 valid options" });
    }

    const lastPost = await Post.findOne().sort({ id: -1 });
    const nextId = lastPost && !isNaN(lastPost.id) ? lastPost.id + 1 : 1;

    const user = await User.findById(userId);
    const teacher = await Teacher.findOne({ auth_id: user?.auth_id });

    let mediaUrl = null;
    let mediaType = null;
    
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        mediaUrl = result.url;
        mediaType = result.type === 'video' ? 'video' : 'image';
        // if user selected text/poll but uploaded a file, we might want to change type to image/video, or leave it as text with media attached.
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ message: "Failed to upload media" });
      }
    }

    const post = await Post.create({
      id: nextId,
      author: user?.name || "Teacher",
      profilePic: teacher?.profilePic || null,
      content: content.trim(),
      date: new Date(),
      time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      status: "Approved", // Teacher posts are auto-approved
      type: type || "text",
      mediaUrl,
      mediaType,
      tags: normalizeTags(tags),
      pollOptions: options,
      creatorId: userId,
      creatorRole: "teacher",
    });

    return res.status(201).json({ message: "Post published", post: postToResponse(post, userId) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updatePost(req, res) {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { content, type, tags, pollOptions } = req.body;

    const post = await Post.findOne({ _id: postId, creatorId: userId });
    if (!post) {
      return res.status(404).json({ message: "Post not found or unauthorized" });
    }

    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const options = normalizePollOptions(type, pollOptions, post.pollOptions);
    if (type === "poll" && options.length < 2) {
      return res.status(400).json({ message: "Poll requires at least 2 valid options" });
    }

    post.content = content.trim();
    post.type = type || "text";
    post.tags = normalizeTags(tags);
    post.pollOptions = options;
    post.date = new Date();
    post.time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

    await post.save();
    return res.status(200).json(postToResponse(post, userId));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deletePost(req, res) {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const post = await Post.findOneAndDelete({ _id: postId, creatorId: userId });
    if (!post) {
      return res.status(404).json({ message: "Post not found or unauthorized" });
    }

    return res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function voteOnPost(req, res) {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { optionIndex } = req.body;

    if (optionIndex === undefined || typeof optionIndex !== "number") {
      return res.status(400).json({ message: "Valid optionIndex is required" });
    }

    const post = await Post.findById(postId);
    if (!post || post.type !== "poll") {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (optionIndex < 0 || optionIndex >= post.pollOptions.length) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    const existingVoteIndex = post.voters.findIndex(v => String(v.userId) === String(userId));
    if (existingVoteIndex !== -1) {
      const oldOptionIndex = post.voters[existingVoteIndex].optionIndex;
      if (oldOptionIndex === optionIndex) {
        return res.status(200).json({ message: "Vote unchanged", post: postToResponse(post, userId) });
      }
      post.pollOptions[oldOptionIndex].votes = Math.max(0, post.pollOptions[oldOptionIndex].votes - 1);
      post.voters[existingVoteIndex].optionIndex = optionIndex;
    } else {
      post.voters.push({ userId, optionIndex });
    }

    post.pollOptions[optionIndex].votes += 1;
    await post.save();

    return res.status(200).json({ message: "Vote recorded", post: postToResponse(post, userId) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function togglePinPost(req, res) {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { pinned } = req.body;

    const post = await Post.findOneAndUpdate(
      { _id: postId, creatorId: userId },
      { pinned: Boolean(pinned) },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found or unauthorized" });
    }

    return res.status(200).json(postToResponse(post, userId));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  voteOnPost,
  togglePinPost
};
