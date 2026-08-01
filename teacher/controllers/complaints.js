const WardenComplaint = require('../../warden/models/complaints');
const Teacher = require('../models/teacher');
const Hostel = require('../../models/Hostel');

async function getComplaints(req, res) {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const hostel = await Hostel.findOne({ name: teacher.hostel });
    if (!hostel) {
      return res.status(200).json([]); // No hostel matched, so no complaints
    }

    const query = { 
      hostelName: hostel._id,
      status: { $ne: 'RESOLVED' }
    };

    const complaints = await WardenComplaint.find(query)
      .populate('hostelName')
      .populate('creator')
      .sort({ "timeline.reportedDate": -1, "timeline.reportedTime": -1 })
      .select('-__v');

    console.log(`[DEBUG] getComplaints found ${complaints.length} complaints for query`, query);

    return res.status(200).json(complaints);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getHistory(req, res) {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const hostel = await Hostel.findOne({ name: teacher.hostel });
    if (!hostel) {
      return res.status(200).json([]); 
    }

    const query = { 
      hostelName: hostel._id,
      status: { $ne: 'OPEN' }
    };

    const complaints = await WardenComplaint.find(query)
      .populate('hostelName')
      .populate('creator')
      .sort({ "timeline.reportedDate": -1, "timeline.reportedTime": -1 })
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

    const updatedComplaint = await WardenComplaint.findByIdAndUpdate(
      complaint._id,
      {
        status: 'RESOLVED',
        'timeline.resolvedDate': today,
        'timeline.resolvedTime': resolvedTime,
        'timeline.resolvedReason': reason || "Resolved by Teacher"
      },
      { returnDocument: 'after', runValidators: true }
    ).populate('hostelName').populate('creator');

    // Sync with Student complaint if applicable
    if (updatedComplaint) {
      try {
        const User = require('../models/User');
        const StudentComplaint = require('../student/models/complaints');
        const creatorId = updatedComplaint.creator?._id || updatedComplaint.creator;
        if (creatorId) {
          const user = await User.findById(creatorId);
          if (user) {
            await StudentComplaint.updateMany(
              { auth_id: user.auth_id, message: updatedComplaint.description },
              { status: 'resolved' }
            );
          }
        }
      } catch (e) {
        console.error("Failed to sync status to student complaint:", e);
      }
    }

    return res.status(200).json(updatedComplaint);
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

    const updatedComplaint = await WardenComplaint.findByIdAndUpdate(
      complaint._id,
      {
        status: 'ESCALATED',
        'timeline.escalatedDate': today,
        'timeline.escalatedTime': escalatedTime,
        'timeline.escalatedReason': reason || "Escalated by Teacher"
      },
      { returnDocument: 'after', runValidators: true }
    ).populate('hostelName').populate('creator');

    // (Complaint history duplication removed)

    return res.status(200).json(updatedComplaint);
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
