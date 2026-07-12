const Notice = require('../../student/models/Notice');
const User = require('../../models/User');
const { uploadToCloudinary } = require('../../utils/cloudinary');

async function getNotices(req, res) {
  try {
    const notices = await Notice.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    return res.status(200).json(notices);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createNotice(req, res) {
  try {
    const userId = req.user.id;
    const { title, body, category, deadline } = req.body;

    if (!title || !body || !category) {
      return res.status(400).json({ message: "Title, body, and category are required" });
    }

    const user = await User.findById(userId);
    const authorName = user ? user.name : "Teacher";

    const today = new Date();
    const publishedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }); // e.g. "20 Jun 2026"

    let imageUrl = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        imageUrl = result.url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ message: "Failed to upload image" });
      }
    }

    const notice = await Notice.create({
      title,
      body,
      category,
      publishedDate,
      deadline: deadline ? new Date(deadline) : undefined,
      authorRole: 'teacher',
      authorName,
      imageUrl,
      isActive: true
    });

    return res.status(201).json({ message: "Notice published", notice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateNotice(req, res) {
  try {
    const { noticeId } = req.params;
    const { title, body, category, deadline, removeImage } = req.body;

    let notice = await Notice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    if (notice.authorRole !== 'teacher') {
      return res.status(403).json({ message: "You can only edit teacher notices" });
    }

    let imageUrl = notice.imageUrl;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        imageUrl = result.url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ message: "Failed to upload image" });
      }
    } else if (removeImage === 'true') {
      imageUrl = null;
    }

    notice.title = title || notice.title;
    notice.body = body || notice.body;
    notice.category = category || notice.category;
    if (deadline) {
      notice.deadline = new Date(deadline);
    }
    notice.imageUrl = imageUrl;

    await notice.save();
    return res.status(200).json({ message: "Notice updated", notice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteNotice(req, res) {
  try {
    const { noticeId } = req.params;
    
    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    // Teachers can only delete their own notices (or maybe admins can delete any)
    if (notice.authorRole !== 'teacher') {
      return res.status(403).json({ message: "You can only delete teacher notices" });
    }

    await Notice.findByIdAndDelete(noticeId);
    return res.status(200).json({ message: "Notice deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice
};
