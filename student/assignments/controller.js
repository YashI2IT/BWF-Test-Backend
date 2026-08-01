// student/assignments/controller.js

const {
  getAssignments,
  submitAssignment,
  revertAssignment
} = require("./service");
const { uploadToCloudinary } = require('../../utils/cloudinary');

// GET assignments
async function getAssignmentsController(req, res) {
  try {
    const auth_id = req.user.auth_id;

    const range = req.query.range || "30d";

    const assignments = await getAssignments(auth_id, range);

    const formatted = assignments.map(c => ({
      _id: c._id,
      title: c.title,
      subject: c.subject,
      status: c.status.toLowerCase(),
      dueDate: c.dueDate,
      submittedDate: c.submittedDate,
      rejectionNote: c.rejectionNote,
      fileUrl: c.fileUrl,
      fileType: c.fileType
    }));

    return res.status(200).json({ assignments: formatted });

  } catch (err) {
    console.error("GET ASSIGNMENTS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
} 

// POST submit assignment
async function submitAssignmentController(req, res) {
  try {
    const auth_id = req.user.auth_id;
    const { id } = req.params;

    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        mediaUrl = result.url;
        
        if (req.file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (req.file.mimetype === 'application/pdf') {
          mediaType = 'pdf';
        } else {
          mediaType = 'image';
        }
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ message: "Failed to upload file" });
      }
    }

    const result = await submitAssignment(auth_id, id, mediaUrl, mediaType);

    return res.status(200).json({
      success: true,
      status: result.status
    });

  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

async function revertAssignmentController(req, res) {
  try {
    const auth_id = req.user.auth_id;
    const { id } = req.params;

    const result = await revertAssignment(auth_id, id);

    return res.status(200).json({
      success: true,
      status: result.status
    });

  } catch (err) {
    console.error("REVERT ERROR:", err);
    return res.status(400).json({ message: err.message });
  }
}

module.exports = {
  getAssignmentsController,
  submitAssignmentController,
  revertAssignmentController
};