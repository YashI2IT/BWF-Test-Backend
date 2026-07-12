const User = require('../models/User');
const Teacher = require('./models/teacher');
const Student = require('../student/models/student');
const GlobalResource = require('../student/models/GlobalResource');
const Assignment = require('../student/models/assignment');
const StudentAssignment = require('../student/models/student_assignment');
const MentorNote = require('../student/models/mentorNote');
const Schedule = require('../student/models/schedule');
const MoodLog = require('../student/models/moodLog');
const Journal = require('../student/models/journal');
const Task = require('../student/models/Task');
const TeacherSchedule = require('./models/schedule');
const bcrypt = require('bcrypt');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Get Profile
exports.getTeacherProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let teacher = await Teacher.findOne({ auth_id: user.auth_id });
    
    res.json({
      name: user.name,
      auth_id: user.auth_id,
      email: teacher?.email,
      phone: teacher?.phone,
      bio: teacher?.bio,
      profilePic: teacher?.profilePic,
      programName: teacher?.programName,
      profileVisibility: teacher?.profileVisibility,
      gender: teacher?.gender,
      dob: teacher?.dob,
      address: teacher?.address,
      hostel: teacher?.hostel,
      hostelLocation: teacher?.hostelLocation,
      qualification: teacher?.qualification,
      joiningDate: teacher?.joiningDate,
      status: teacher?.status || 'Active',
      emergencyName: teacher?.emergencyName,
      emergencyPhone: teacher?.emergencyPhone,
      emergencyRelation: teacher?.emergencyRelation,
      widgetSettings: teacher?.widgetSettings || { stats: true, schedule: true, tasks: true, progress: true }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update Profile
exports.updateTeacherProfile = async (req, res) => {
  try {
    const {
      name, email, phone, bio, programName, profilePic, profileVisibility, widgetSettings,
      gender, dob, address, hostel, hostelLocation, qualification, joiningDate, status,
      emergencyName, emergencyPhone, emergencyRelation
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sync global user name
    if (name && name !== user.name) {
      user.name = name;
      await user.save();
    }

    const updateData = { userId: user._id };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (programName !== undefined) updateData.programName = programName;
    if (profilePic !== undefined) updateData.profilePic = profilePic;
    if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
    if (widgetSettings !== undefined) updateData.widgetSettings = widgetSettings;
    if (gender !== undefined) updateData.gender = gender;
    if (dob !== undefined) updateData.dob = dob;
    if (address !== undefined) updateData.address = address;
    if (hostel !== undefined) updateData.hostel = hostel;
    if (hostelLocation !== undefined) updateData.hostelLocation = hostelLocation;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
    if (status !== undefined) updateData.status = status;
    if (emergencyName !== undefined) updateData.emergencyName = emergencyName;
    if (emergencyPhone !== undefined) updateData.emergencyPhone = emergencyPhone;
    if (emergencyRelation !== undefined) updateData.emergencyRelation = emergencyRelation;

    const teacher = await Teacher.findOneAndUpdate(
      { auth_id: user.auth_id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({ message: 'Profile updated successfully', profile: teacher });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Update Password
exports.updateTeacherPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
};

// Get Dashboard (Students, Resources, Pending Submissions, Chart Data)
exports.getTeacherDashboard = async (req, res) => {
  try {
    const students = await Student.find({}, '_id auth_id name class mentorName');
    const resources = await GlobalResource.find({}, '_id key value');
    
    // Pending submissions
    const pendingSubmissions = await StudentAssignment.find({ status: 'pending' })
      .populate('assignment_id', 'title subject dueDate')
      .exec();

    const formattedSubmissions = pendingSubmissions.map(sub => ({
      _id: sub._id,
      student_auth_id: sub.auth_id,
      submissionText: sub.submissionText,
      status: sub.status,
      rejectionNote: sub.rejectionNote,
      assignment_id: sub.assignment_id
    }));

    // Aggregate Assignment Progress Data
    const allAssignments = await StudentAssignment.find({});
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    const assignmentProgressData = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      let mIndex = currentMonthIndex - i;
      if (mIndex < 0) mIndex += 12;
      assignmentProgressData.push({ month: months[mIndex], completed: 0, pending: 0 });
    }
    
    allAssignments.forEach(sub => {
      const date = sub.updatedAt || sub._id.getTimestamp();
      const monthStr = months[date.getMonth()];
      const monthData = assignmentProgressData.find(m => m.month === monthStr);
      if (monthData) {
        if (sub.status === 'approved') monthData.completed++;
        else if (sub.status === 'pending') monthData.pending++;
      }
    });

    // Aggregate Mood Breakdown
    const allMoods = await MoodLog.find({});
    let moodMap = { 'Happy': 0, 'Okay': 0, 'Help': 0 };
    allMoods.forEach(m => {
       const moodCap = m.mood ? m.mood.charAt(0).toUpperCase() + m.mood.slice(1) : 'Okay';
       if(moodMap[moodCap] !== undefined) moodMap[moodCap]++;
    });
    
    const moodBreakdown = [
      { name: 'Happy', value: moodMap['Happy'] || (allMoods.length ? 0 : 65), fill: '#10b981' },
      { name: 'Okay', value: moodMap['Okay'] || (allMoods.length ? 0 : 25), fill: '#f59e0b' },
      { name: 'Help', value: moodMap['Help'] || (allMoods.length ? 0 : 10), fill: '#ef4444' },
    ];

    // Tracker Data (Assignments submitted in last 30 days scaled into a weekly view, so it's guaranteed to show DB data)
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const trackerData = days.map(day => ({ name: day, value: 0 }));
    const recentSubs = await StudentAssignment.find({
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    recentSubs.forEach(sub => {
      const dateStr = sub.updatedAt || sub.createdAt;
      if (dateStr) {
        const d = new Date(dateStr).getDay();
        trackerData[d].value += 1;
      }
    });

    // We removed the random mock fallback entirely. This is now 100% pure DB data.
    // If the graph is flat, it means no assignments have been created/updated recently in your local DB!

    // Today's Schedule
    const today = new Date().toISOString().split('T')[0];
    const tSchedules = await TeacherSchedule.find({ teacherId: req.user._id, date: today }).sort({ startTime: 1 });
    const todaySchedule = tSchedules.map(sch => ({
      time: sch.startTime,
      title: sch.title,
      location: sch.type === 'online' ? 'Online' : 'In Person',
      color: sch.type === 'online' ? 'indigo' : 'emerald'
    }));

    // Daily Tasks
    const tasks = await Task.find().sort({ createdAt: -1 }).limit(3);
    const dailyTasks = tasks.map(t => ({
      id: t._id,
      title: t.title,
      status: t.status === 'verified' ? 'completed' : 'due_today'
    }));

    // Class Progress
    const totalAssignments = await StudentAssignment.countDocuments();
    const reviewed = await StudentAssignment.countDocuments({ status: { $in: ['approved', 'rejected'] } });
    const passed = await StudentAssignment.countDocuments({ status: 'approved' });
    const classProgress = { assignments: totalAssignments, reviewed, passed };

    res.json({
      students,
      resources,
      pendingSubmissions: formattedSubmissions,
      assignmentProgressData,
      moodBreakdown,
      trackerData,
      todaySchedule,
      dailyTasks,
      classProgress
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
};

// Assign Mentor
exports.assignMentor = async (req, res) => {
  try {
    const { studentAuthId } = req.params;
    const { mentorName } = req.body;

    const student = await Student.findOneAndUpdate(
      { auth_id: studentAuthId },
      { mentorName },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Mentor assigned', student });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning mentor', error: error.message });
  }
};

// Add Assignment
exports.addAssignment = async (req, res) => {
  try {
    const { studentAuthId } = req.params;
    const { title, subject, dueDate, priority } = req.body;

    let fileUrl = null;
    let fileType = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        fileUrl = result.url;
        fileType = result.type;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ message: "Failed to upload file" });
      }
    }

    const newAssignment = new Assignment({
      auth_id: studentAuthId,
      title,
      subject,
      dueDate,
      priority,
      fileUrl,
      fileType
    });
    
    await newAssignment.save();

    // Create a corresponding student assignment entry
    const studentAssignment = new StudentAssignment({
      auth_id: studentAuthId,
      assignment_id: newAssignment._id,
      status: 'not_submitted',
      submissionText: ''
    });

    await studentAssignment.save();

    res.json({ message: 'Assignment added', assignment: newAssignment, studentAssignment });
  } catch (error) {
    res.status(500).json({ message: 'Error adding assignment', error: error.message });
  }
};

// Add Schedule
exports.addSchedule = async (req, res) => {
  try {
    const { studentAuthId } = req.params;
    const { title, sessionType, date, startTime, joinLink } = req.body;

    const newSchedule = new Schedule({
      auth_id: studentAuthId,
      title,
      sessionType,
      date,
      startTime,
      joinLink
    });

    await newSchedule.save();

    res.json({ message: 'Schedule added', schedule: newSchedule });
  } catch (error) {
    res.status(500).json({ message: 'Error adding schedule', error: error.message });
  }
};

// Push Mentor Note
exports.pushMentorNote = async (req, res) => {
  try {
    const { studentAuthId } = req.params;
    const { message, mentorName } = req.body;

    const mentorNote = new MentorNote({
      auth_id: studentAuthId,
      mentorName,
      message
    });

    await mentorNote.save();

    res.json({ message: 'Note pushed', mentorNote });
  } catch (error) {
    res.status(500).json({ message: 'Error pushing note', error: error.message });
  }
};

exports.updateMentorNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { message } = req.body;
    
    const updatedNote = await MentorNote.findByIdAndUpdate(noteId, { message }, { new: true });
    if (!updatedNote) return res.status(404).json({ message: 'Note not found' });
    
    res.json({ message: 'Note updated', updatedNote });
  } catch (error) {
    res.status(500).json({ message: 'Error updating note', error: error.message });
  }
};

exports.deleteMentorNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    
    const deletedNote = await MentorNote.findByIdAndDelete(noteId);
    if (!deletedNote) return res.status(404).json({ message: 'Note not found' });
    
    res.json({ message: 'Note deleted', deletedNote });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
};

// Get Mentor Notes
exports.getMentorNotes = async (req, res) => {
  try {
    const notes = await MentorNote.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'auth_id',
          foreignField: 'auth_id',
          as: 'studentInfo'
        }
      },
      {
        $unwind: {
          path: '$studentInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notes', error: error.message });
  }
};

// Get Students for Dropdown
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({}, '_id auth_id name class');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

// Update Resource
exports.updateResource = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const resource = await GlobalResource.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );

    res.json({ message: 'Resource updated', resource });
  } catch (error) {
    res.status(500).json({ message: 'Error updating resource', error: error.message });
  }
};

// Get Student Overview
exports.getStudentOverview = async (req, res) => {
  try {
    const { studentAuthId } = req.params;

    const student = await Student.findOne({ auth_id: studentAuthId }, '_id auth_id name class');
    const assignments = await Assignment.find({ auth_id: studentAuthId }).sort({ createdAt: -1 });
    
    const submissionsData = await StudentAssignment.find({ auth_id: studentAuthId })
      .populate('assignment_id', 'title subject dueDate')
      .exec();

    const submissions = submissionsData.map(sub => ({
      _id: sub._id,
      student_auth_id: sub.auth_id,
      submissionText: sub.submissionText,
      status: sub.status,
      rejectionNote: sub.rejectionNote,
      assignment_id: sub.assignment_id
    }));

    const moodsData = await MoodLog.find({ auth_id: studentAuthId }).sort({ createdAt: -1 }).limit(10);
    const moods = moodsData.map(m => ({
      _id: m._id,
      mood: m.mood,
      date: m.date,
      note: m.note || ''
    }));

    const journalsData = await Journal.find({ auth_id: studentAuthId }).sort({ createdAt: -1 }).limit(10);
    const journals = journalsData.map(j => ({
      _id: j._id,
      text: j.content, // Assuming content is the journal text
      createdAt: j.createdAt
    }));

    res.json({
      student,
      assignments,
      submissions,
      moods,
      journals
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student overview', error: error.message });
  }
};

// Get Assignment Progress
exports.getAssignmentProgress = async (req, res) => {
  try {
    const { studentAuthId } = req.params;

    const assignmentsData = await Assignment.find({ auth_id: studentAuthId });
    const submissionsData = await StudentAssignment.find({ auth_id: studentAuthId });

    let summary = {
      total: assignmentsData.length,
      not_submitted: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    const assignments = assignmentsData.map(assignment => {
      const sub = submissionsData.find(s => s.assignment_id.toString() === assignment._id.toString());
      const status = sub ? sub.status : 'not_submitted';
      
      summary[status]++;

      return {
        assignment_id: assignment._id,
        title: assignment.title,
        subject: assignment.subject,
        dueDate: assignment.dueDate,
        priority: assignment.priority,
        progressStatus: status,
        rejectionNote: sub ? sub.rejectionNote : '',
        submittedAt: sub ? sub.submittedDate : null,
        reviewedAt: sub ? sub.updatedAt : null // proxy for review time
      };
    });

    res.json({
      student_auth_id: studentAuthId,
      summary,
      assignments
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignment progress', error: error.message });
  }
};

// Get Submissions
exports.getSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const submissionsData = await StudentAssignment.find(query)
      .populate('assignment_id', 'title subject dueDate')
      .exec();

    const studentAuthIds = [...new Set(submissionsData.map(sub => sub.auth_id))];
    const students = await Student.find({ auth_id: { $in: studentAuthIds } }, 'auth_id name');
    const studentMap = students.reduce((acc, student) => {
      acc[student.auth_id] = student.name;
      return acc;
    }, {});

    const formattedSubmissions = submissionsData.map(sub => ({
      _id: sub._id,
      studentAuthId: sub.auth_id,
      studentName: studentMap[sub.auth_id] || 'Unknown Student',
      assignmentTitle: sub.assignment_id ? sub.assignment_id.title : 'Unknown Assignment',
      submissionText: sub.submissionText,
      submittedAt: sub.submittedDate || sub.updatedAt || sub.createdAt,
      status: sub.status,
      fileUrl: sub.fileUrl,
      rejectionNote: sub.rejectionNote,
    }));

    res.json(formattedSubmissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// Review Submission
exports.reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, rejectionNote } = req.body;

    const submission = await StudentAssignment.findByIdAndUpdate(
      submissionId,
      { status, rejectionNote },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ message: 'Submission reviewed', submission });
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing submission', error: error.message });
  }
};
