const Notice = require('../student/models/Notice');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary');

async function getNotices(req, res) {
  try {
    const notices = await Notice.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('-__v');
    const mappedNotices = notices.map(notice => {
      const obj = notice.toObject();
      return {
        ...obj,
        canManage: String(obj.creatorId) === String(req.user.id) || req.user.role === 'admin'
      };
    });
    
    return res.status(200).json(mappedNotices);
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
    const authorName = user ? user.name : "Admin";

    const today = new Date();
    const publishedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    let imageUrl = null;
    let mediaType = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        imageUrl = result.url;
        
        if (req.file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (req.file.mimetype === 'application/pdf') {
          mediaType = 'pdf';
        } else {
          mediaType = 'image';
        }
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
      authorRole: 'admin',
      authorName,
      creatorId: userId,
      imageUrl,
      mediaType,
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

    let imageUrl = notice.imageUrl;
    let mediaType = notice.mediaType;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        imageUrl = result.url;
        
        if (req.file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (req.file.mimetype === 'application/pdf') {
          mediaType = 'pdf';
        } else {
          mediaType = 'image';
        }
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
    if (req.file) notice.mediaType = mediaType;

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
