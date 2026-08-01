const mongoose = require('mongoose');
const CommunityPost = require('../../models/CommunityPost');
const Warden = require('../models/warden');
const User = require('../../models/User');

async function getPendingPosts(req, res) {
  try {
    const userId = req.user.id;
    const warden = await Warden.findOne({ userId });
    if (!warden) return res.status(404).json({ message: "Warden not found" });

    // Show all unverified CommunityPosts
    const posts = await CommunityPost.find({ isVerified: false })
      .populate("userId", "name role")
      .sort({ createdAt: -1 });

    return res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function approvePost(req, res) {
  try {
    const wardenUserId = req.user.id;
    const { postId } = req.params;

    const warden = await Warden.findOne({ userId: wardenUserId });
    if (!warden) return res.status(404).json({ message: "Warden not found" });

    const post = await CommunityPost.findOneAndUpdate(
      { _id: postId, isVerified: false },
      { isVerified: true },
      { returnDocument: 'after' }
    );

    if (!post) return res.status(404).json({ message: "Pending post not found" });

    return res.status(200).json({ message: "Post approved and published", post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectPost(req, res) {
  try {
    const wardenUserId = req.user.id;
    const { postId } = req.params;

    const warden = await Warden.findOne({ userId: wardenUserId });
    if (!warden) return res.status(404).json({ message: "Warden not found" });

    // Since it's rejected, we can simply delete the unverified post
    const post = await CommunityPost.findOneAndDelete({ _id: postId, isVerified: false });

    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.status(200).json({ message: "Post rejected and deleted", post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getPendingPosts,
  approvePost,
  rejectPost
};
