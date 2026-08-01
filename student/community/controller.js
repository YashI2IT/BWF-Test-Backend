const CommunityPost = require("../../models/CommunityPost");
const User = require("../../models/User");
const Post = require("../../warden/models/post");
const Student = require("../models/student");

async function getCommunityPosts (req, res) {
    try {
        const userId = req.user.id;
        const student = await Student.findOne({ userId });

        const posts = await CommunityPost.find({isVerified: true}).lean();

        let postQuery = { status: 'Approved' };
        if (student && student.hostelName) {
            postQuery.$or = [
                { hostelName: student.hostelName },
                { creatorRole: 'teacher' },
                { creatorRole: 'warden' }
            ];
        } else {
            postQuery.creatorRole = 'teacher';
        }

        const wardenPosts = await Post.find(postQuery).lean();

        const validCategories = ["Win", "Story", "Gratitude", "Highlight"];

        const mappedWardenPosts = wardenPosts.map(p => {
            let cat = p.tags && p.tags.length > 0 ? p.tags[0].replace('#', '') : "Story";
            if (!validCategories.includes(cat)) {
                cat = "Story";
            }
            
            let roleStr = "Warden";
            if (p.creatorRole) {
                roleStr = p.creatorRole.charAt(0).toUpperCase() + p.creatorRole.slice(1).toLowerCase();
            }

            return {
                _id: p._id,
                author: p.author,
                avatarId: "default",
                role: roleStr,
                category: cat,
                content: p.content,
                likes: p.voters ? p.voters.length : 0,
                createdAt: p.date,
                mediaUrl: p.mediaUrl,
                isVerified: true
            };
        });

        const allPosts = [...posts, ...mappedWardenPosts];
        
        allPosts.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return res.status(200).json(allPosts);
    } catch (error) {
        console.error("Error fetching community posts:", error);
        return res.status(500).json({error: "An error occurred while fetching community posts."});
    }
}


async function createPost(req, res) {
  try {
    console.log("REQ.BODY:", req.body);
    console.log("REQ.FILE:", req.file);
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { category, content } = req.body;

    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const isVerified = req.user.role !== 'student'; // Teachers, Wardens, Admins are auto-verified
    const roleCapitalized = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);

    await CommunityPost.create({
      userId: user._id,
      author: user.name,
      avatarId: user.avatarId || 'default',
      role: roleCapitalized,
      category,
      content,
      mediaUrl,
      isVerified,
      status: isVerified ? 'approved' : 'pending'
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