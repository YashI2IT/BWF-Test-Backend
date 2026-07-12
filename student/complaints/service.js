const Complaint = require("../models/complaints");

// CREATE
async function createComplaint(auth_id, data) {
  return await Complaint.create({
    auth_id,
    message: data.message,
    anonymous: data.anonymous,
    category: data.category,
    priority: data.priority
  });
}

// GET student complaints
async function getStudentComplaints(auth_id, status) {
  const filter = { auth_id };

  if (status) {
    filter.status = status.toLowerCase();
  }

  return await Complaint.find(filter).sort({ createdAt: -1 });
}

// GET all complaints (warden)
async function getAllComplaints() {
  return await Complaint.find().sort({ createdAt: -1 });
}

// UPDATE status (warden)
async function updateComplaintStatus(id, status) {
  return await Complaint.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
}

module.exports = {
  createComplaint,
  getStudentComplaints,
  getAllComplaints,
  updateComplaintStatus
};