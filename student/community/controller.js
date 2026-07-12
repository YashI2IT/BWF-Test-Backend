const CommunityPost = require("../../models/CommunityPost");
const Student = require("../models/student");

async function getCommunityPosts (req, res) {
    try {
        const posts = await CommunityPost.find({isVerified: true}).sort({createdAt: -1}).lean();
        return res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching community posts:", error);
        return res.status(500).json({error: "An error occurred while fetching community posts."});
    }
}


async function createPost(req, res) {
  try {
    const auth_id = req.user.auth_id;

    const student = await Student.findOne({ auth_id });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const { category, content } = req.body;

    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    await CommunityPost.create({
      author: student.name,
      avatarId: student.avatarId,
      role: "Student",
      category,
      content,
      mediaUrl,
      isVerified: false // pending review
    });

    return res.status(201).json({
      success: true,
      message: "Pending review"
    });

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

module.exports = { getCommunityPosts, createPost, toggleLike };