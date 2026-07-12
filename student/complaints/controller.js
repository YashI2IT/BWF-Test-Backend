const {
  createComplaint,
  getStudentComplaints
} = require("./service");

// POST /student/complaints
async function postComplaint(req, res) {
  try {
    const auth_id = req.user.auth_id;
    const { message, type, category} = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const complaint = await createComplaint(auth_id, {
      message,
      type,
      category,
    });

    return res.status(201).json({
      complaint: {
        _id: complaint._id,
        text: complaint.message,
        category: complaint.category,
        status: complaint.status.toLowerCase(),
        response: null,
        createdAt: complaint.createdAt
      }
    });
  } catch (err) {
    console.error("CREATE COMPLAINT ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /student/complaints
async function getMyComplaints(req, res) {
  try {
    const auth_id = req.user.auth_id;

    const { status } = req.query;

     let complaints = await getStudentComplaints(auth_id, status);

    const formatted = complaints.map(c => ({
      _id: c._id,
      text: c.message,
      category: c.category,
      status: c.status.toLowerCase(),
      response: null,
      createdAt: c.createdAt
    }));

    return res.status(200).json({ complaints: formatted });

  } catch (err) {
    console.error("FETCH COMPLAINT ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  postComplaint,
  getMyComplaints
};