const mongoose = require('mongoose');
const Post = require('../models/post');
const PendingPost = require('../models/pendingPost');
const Warden = require('../models/warden');
const Student = require('../../student/models/student');
const User = require('../../models/User');

async function getPendingPosts(req, res) {
  try {
    const userId = req.user.id;
    const warden = await Warden.findOne({ userId });
    if (!warden) return res.status(404).json({ message: "Warden not found" });

    // Show all moderation entries (Pending, Rejected, Forwarded, Approved)
    const posts = await PendingPost.find({
      hostelName: warden.hostelName
    })
      .populate("creatorId", "name role")
      .populate("approvedBy", "name")
      .populate("rejectedBy", "name")
      .populate("forwardedBy", "name")
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

    // 1. Update the record in PendingPost
    const pendingPost = await PendingPost.findOneAndUpdate(
      { _id: postId, hostelName: warden.hostelName },
      { 
        status: 'Approved',
        approvedBy: wardenUserId,
        rejectedBy: null,
        forwardedBy: null
      },
      { new: true }
    ).populate("creatorId", "name role");

    if (!pendingPost) return res.status(404).json({ message: "Pending post not found" });

    // 2. Create/Sync to the live Post collection
    const latestPost = await Post.findOne().sort({ id: -1 });
    const newLiveId = (latestPost?.id || 0) + 1;

    await Post.create({
      id: newLiveId,
      author: pendingPost.author,
      content: pendingPost.content,
      date: pendingPost.date,
      time: pendingPost.time,
      status: 'Approved', // Live posts are always approved
      type: pendingPost.type,
      tags: pendingPost.tags,
      pollOptions: pendingPost.pollOptions,
      creatorId: pendingPost.creatorId._id || pendingPost.creatorId,
      creatorRole: pendingPost.creatorRole,
      hostelName: pendingPost.hostelName
    });

    return res.status(200).json({ message: "Post approved and published", post: pendingPost });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectPost(req, res) {
  try {
    const wardenUserId = req.user.id;
    const { postId } = req.params;
    const { reason } = req.body;

    const warden = await Warden.findOne({ userId: wardenUserId });
    if (!warden) return res.status(404).json({ message: "Warden not found" });

    const post = await PendingPost.findOneAndUpdate(
      { _id: postId, hostelName: warden.hostelName },
      { 
        status: 'Rejected',
        rejectionReason: reason || 'Rejected by warden',
        rejectedBy: wardenUserId,
        approvedBy: null,
        forwardedBy: null
      },
      { new: true }
    ).populate("creatorId", "name role");

    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.status(200).json({ message: "Post rejected", post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function forwardToAdmin(req, res) {
  try {
    const wardenUserId = req.user.id;
    const { postId } = req.params;
    const { reason } = req.body;

    const warden = await Warden.findOne({ userId: wardenUserId });
    if (!warden) return res.status(404).json({ message: "Warden not found" });

    const post = await PendingPost.findOneAndUpdate(
      { _id: postId, hostelName: warden.hostelName },
      { 
        status: 'Forwarded',
        forwardReason: reason || 'Forwarded to admin for review',
        forwardedBy: wardenUserId,
        approvedBy: null,
        rejectedBy: null
      },
      { new: true }
    ).populate("creatorId", "name role");

    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.status(200).json({ message: "Post forwarded to admin", post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function testCreatePost(req, res) {
  try {
    const { studentId } = req.params;
    const { content, type, pollOptions, tags } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const user = await User.findById(student.userId);
    if (!user) return res.status(404).json({ message: "User record not found" });

    const latestPost = await PendingPost.findOne().sort({ id: -1 });
    const newId = (latestPost?.id || 0) + 1;

    const now = new Date();
    const post = await PendingPost.create({
      id: newId,
      author: student.name,
      content,
      date: now,
      time: now.toTimeString().slice(0, 5),
      status: 'Pending',
      type: type || 'text',
      pollOptions: pollOptions || [],
      tags: tags || [],
      creatorId: user._id,
      creatorRole: 'student',
      hostelName: student.hostelName
    });

    return res.status(201).json({ message: "Post created in Pending collection", post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deletePendingPost(req, res) {
  try {
    const wardenUserId = req.user.id;
    const { postId } = req.params;

    const warden = await Warden.findOne({ userId: wardenUserId });
    if (!warden) return res.status(404).json({ message: "Warden not found" });

    const post = await PendingPost.findOneAndDelete({
      _id: postId,
      hostelName: warden.hostelName,
      status: { $in: ['Approved', 'Rejected'] } // Only allowed to delete processed ones
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found or cannot be deleted" });
    }

    return res.status(200).json({ message: "Moderation record deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getPendingPosts,
  approvePost,
  rejectPost,
  forwardToAdmin,
  testCreatePost,
  deletePendingPost
};
