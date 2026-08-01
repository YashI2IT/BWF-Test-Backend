const User = require('../../models/User');
const Teacher = require('../models/teacher');
const Student = require('../../student/models/student');
const CounsellingRequest = require('../../student/models/counsellingRequest');

// Get unread counselling requests for students in the teacher's hostel
exports.getUnreadRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const teacher = await Teacher.findOne({ auth_id: user.auth_id });
    if (!teacher) {
      return res.json({ requests: [] });
    }

    let hostelFilter = {};
    const Hostel = require('../../models/Hostel'); // Import Hostel model
    
    if (teacher.hostel) {
      const hostel = await Hostel.findOne({ name: teacher.hostel });
      if (hostel) {
        hostelFilter = { hostelName: hostel._id };
      }
    }

    // Find students matching the filter
    const students = await Student.find(hostelFilter).select('auth_id name');
    
    if (!students || students.length === 0) {
      return res.json({ requests: [] });
    }

    const studentAuthIds = students.map(s => s.auth_id);
    const studentMap = students.reduce((acc, student) => {
      acc[student.auth_id] = student.name;
      return acc;
    }, {});

    // Find unread counselling requests
    const unreadRequests = await CounsellingRequest.find({
      auth_id: { $in: studentAuthIds },
      readByTeacher: false
    }).sort({ createdAt: -1 });

    const requestsWithNames = unreadRequests.map(req => ({
      _id: req._id,
      auth_id: req.auth_id,
      studentName: studentMap[req.auth_id] || 'Unknown Student',
      message: req.message,
      createdAt: req.createdAt
    }));

    res.json({ requests: requestsWithNames });
  } catch (error) {
    console.error('Error fetching unread counselling requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Mark a counselling request as read by the teacher
exports.markRequestRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await CounsellingRequest.findByIdAndUpdate(
      id,
      { readByTeacher: true },
      { returnDocument: 'after' }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error('Error marking request read:', error);
    res.status(500).json({ message: 'Error marking request read', error: error.message });
  }
};
