const WardenComplaint = require('../../warden/models/complaints');
require('../../models/Hostel'); // Required for populating hostelName

async function getComplaints(req, res) {
  try {
    const query = { status: 'OPEN' };

    const complaints = await WardenComplaint.find(query)
      .populate('hostelName')
      .sort({ date: -1, time: -1, createdAt: -1 })
      .select('-__v');

    return res.status(200).json(complaints);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getHistory(req, res) {
  try {
    const query = { status: { $in: ['RESOLVED', 'ESCALATED'] } };

    const complaints = await WardenComplaint.find(query)
      .populate('hostelName')
      .sort({ date: -1, time: -1, createdAt: -1 })
      .select('-__v');

    return res.status(200).json(complaints);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function approveComplaint(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const complaint = await WardenComplaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.status === 'RESOLVED') {
      return res.status(400).json({ message: "Complaint is already resolved" });
    }

    const today = new Date();
    const resolvedTime = today.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" });

    complaint.status = 'RESOLVED';
    complaint.timeline.resolvedDate = today;
    complaint.timeline.resolvedTime = resolvedTime;
    complaint.timeline.resolvedReason = reason || "Resolved by Teacher";

    await complaint.save();

    return res.status(200).json(complaint);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectComplaint(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const complaint = await WardenComplaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const today = new Date();
    const escalatedTime = today.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" });

    complaint.status = 'ESCALATED';
    complaint.timeline.escalatedDate = today;
    complaint.timeline.escalatedTime = escalatedTime;
    complaint.timeline.escalatedReason = reason || "Escalated by Teacher";

    await complaint.save();

    return res.status(200).json(complaint);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteComplaint(req, res) {
  try {
    const { id } = req.params;
    await WardenComplaint.findByIdAndDelete(id);
    return res.status(200).json({ message: "Complaint deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getComplaints,
  getHistory,
  approveComplaint,
  rejectComplaint,
  deleteComplaint
};
