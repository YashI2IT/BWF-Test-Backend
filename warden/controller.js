const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Warden = require('./models/warden');
const bcrypt = require('bcrypt');
const Staff = require('./models/staff');
const Post = require('./models/post');
const WardenComplaint = require('./models/complaints');
const ComplaintHistory = require('./models/complaintHistory');
const Activity = require('./models/activity');
const PendingActivity = require('./models/pendingActivity');
const mongoose = require('mongoose');

const postToResponse = (post, userId) => {
  const object = post.toObject ? post.toObject() : post;
  const voter = object.voters?.find(v => String(v.userId) === String(userId));
  return {
    ...object,
    canManage: String(object.creatorId) === String(userId),
    userVote: voter ? voter.optionIndex : null,
  };
};

const normalizeTags = (tags = []) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .slice(0, 10);
};

const normalizePollOptions = (type, pollOptions = [], previousOptions = []) => {
  if (type !== "poll") return [];
  if (!Array.isArray(pollOptions)) return [];

  const previousVotes = new Map(
    previousOptions.map((option) => [String(option.text).trim().toLowerCase(), option.votes || 0])
  );

  const options = pollOptions
    .map((option) => {
      const text = typeof option === "string" ? option : option?.text;
      const normalizedText = String(text || "").trim();
      return normalizedText
        ? {
          text: normalizedText,
          votes: previousVotes.get(normalizedText.toLowerCase()) || 0,
        }
        : null;
    })
    .filter(Boolean)
    .slice(0, 4);

  return options;
};

// ================= CREATE STUDENT =================
const Student = require('../student/models/student');

async function createStudent(req, res) {
  try {
    const userId = req.user.id;
    const {
      name,
      auth_id,
      password,
      DOB,
      gender,
      contactNumber,
      class: studentClass,

      // optional
      email,
      address,
      schoolName,
      adhaarCard,
      panCard,
      interests,
      profilePictureUrl,
      avatarId,
      trustedPerson
    } = req.body;

    // ✅ Required validation
    if (!name || !auth_id || !password || !DOB || !gender || !studentClass) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedAuthId = String(auth_id).trim();
    const plainPassword = String(password);

    if (!normalizedAuthId || !plainPassword) {
      return res.status(400).json({ message: "auth_id and password are required" });
    }

    // ✅ Get warden hostel
    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    // ✅ Check existing user
    if (!warden.hostelName) {
      return res.status(400).json({ message: "Warden is not assigned to a hostel" });
    }

    const existingUser = await User.findOne({ auth_id: normalizedAuthId });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existingStudent = await Student.findOne({ auth_id: normalizedAuthId });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // ✅ Create User (auth layer)
    const user = await User.create({
      name,
      auth_id: normalizedAuthId,
      password: hashedPassword,
      role: "student",
      hostelName: warden.hostelName
    });

    // ✅ Create Student (profile layer)
    const student = await Student.create({
      userId: user._id,
      auth_id: normalizedAuthId,
      name,
      DOB,
      gender,
      contactNumber,
      class: studentClass,
      hostelName: warden.hostelName,

      // optional
      email,
      address,
      schoolName,
      adhaarCard,
      panCard,
      interests,
      profilePictureUrl,
      avatarId,
      trustedPerson
    });

    return res.status(201).json({
      message: "Student created successfully",
      student
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}


async function getStudents(req, res) {
  try {
    const userId = req.user.id;

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const students = await Student.find({
      hostelName: warden.hostelName
    })
      .populate("hostelName")
      .select("-__v");

    return res.status(200).json(students);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateStudent(req, res) {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const student = await Student.findOne({
      _id: studentId,
      hostelName: warden.hostelName
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const linkedUser = await User.findById(student.userId);

    const updates = {};

    Object.keys(Student.schema.paths).forEach((field) => {
      const blockedFields = new Set([
        "_id",
        "__v",
        "userId",
        "hostelName",
        "createdAt",
        "updatedAt",
        "auth_id"
      ]);

      if (!blockedFields.has(field) && req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const userUpdates = {};

    if (req.body.auth_id !== undefined) {
      const nextAuthId = String(req.body.auth_id).trim();
      if (!nextAuthId) {
        return res.status(400).json({ message: "auth_id cannot be empty" });
      }

      if (nextAuthId !== student.auth_id) {
        const existingUserQuery = { auth_id: nextAuthId };
        if (linkedUser?._id) {
          existingUserQuery._id = { $ne: linkedUser._id };
        } else if (student.userId) {
          existingUserQuery._id = { $ne: student.userId };
        }

        const existingUser = await User.findOne(existingUserQuery);
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        const existingStudent = await Student.findOne({
          auth_id: nextAuthId,
          _id: { $ne: student._id }
        });
        if (existingStudent) {
          return res.status(400).json({ message: "Student already exists" });
        }
      }

      updates.auth_id = nextAuthId;
      userUpdates.auth_id = nextAuthId;
    }

    if (req.body.password !== undefined) {
      const nextPassword = String(req.body.password);
      if (!nextPassword) {
        return res.status(400).json({ message: "Password cannot be empty" });
      }

      userUpdates.password = await bcrypt.hash(nextPassword, 10);
    }

    if (updates.name !== undefined) {
      userUpdates.name = updates.name;
    }

    if (Object.keys(updates).length === 0 && Object.keys(userUpdates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (Object.keys(userUpdates).length > 0 && !linkedUser) {
      return res.status(404).json({
        message: "Linked student login user not found"
      });
    }

    if (Object.keys(userUpdates).length > 0) {
      linkedUser.set(userUpdates);
      await linkedUser.save();
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      updates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    return res.status(200).json(updatedStudent);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateStudentCredentials(req, res) {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const { auth_id, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const student = await Student.findOne({
      _id: studentId,
      hostelName: warden.hostelName
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const linkedUser = await User.findById(student.userId);
    if (!linkedUser) {
      return res.status(404).json({ message: "Linked student login user not found" });
    }

    const userUpdates = {};
    const studentUpdates = {};

    if (auth_id !== undefined) {
      const nextAuthId = String(auth_id).trim();
      if (!nextAuthId) {
        return res.status(400).json({ message: "auth_id cannot be empty" });
      }

      if (nextAuthId !== student.auth_id) {
        const existingUser = await User.findOne({
          auth_id: nextAuthId,
          _id: { $ne: linkedUser._id }
        });
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        const existingStudent = await Student.findOne({
          auth_id: nextAuthId,
          _id: { $ne: student._id }
        });
        if (existingStudent) {
          return res.status(400).json({ message: "Student already exists" });
        }
      }

      userUpdates.auth_id = nextAuthId;
      studentUpdates.auth_id = nextAuthId;
    }

    if (password !== undefined) {
      const nextPassword = String(password);
      if (!nextPassword) {
        return res.status(400).json({ message: "Password cannot be empty" });
      }

      userUpdates.password = await bcrypt.hash(nextPassword, 10);
    }

    if (Object.keys(userUpdates).length === 0) {
      return res.status(400).json({ message: "No credentials to update" });
    }

    await User.updateOne(
      { _id: linkedUser._id },
      { $set: userUpdates },
      { runValidators: true }
    );

    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      studentUpdates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    return res.status(200).json({
      message: "Student credentials updated successfully",
      student: updatedStudent
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
async function deleteStudent(req, res) {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 🔥 delete linked user
    await User.findByIdAndDelete(student.userId);

    await Student.findByIdAndDelete(studentId);

    return res.status(200).json({
      message: "Student deleted successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= CREATE STAFF =================
async function createStaff(req, res) {
  try {
    const userId = req.user.id;
    const {
      name,
      gender,
      contactNumber,
      roleName,
      joiningDate,

      // optional auth
      auth_id,
      password,

      // optional profile
      DOB,
      email,
      address,
      department,
      employmentType,
      shift,
      salary,
      status,
      adhaarCard,
      panCard,
      emergencyContact,
      notes
    } = req.body;

    if (!name || !gender || !contactNumber || !roleName || !joiningDate || !email) {
      return res.status(400).json({
        message: "Missing required fields",
        requiredFields: ["name", "gender", "contactNumber", "roleName", "joiningDate", "email"]
      });
    }

    if ((auth_id && !password) || (!auth_id && password)) {
      return res.status(400).json({
        message: "Both auth_id and password are required when creating a staff login"
      });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    if (!warden.hostelName) {
      return res.status(400).json({ message: "Warden is not assigned to a hostel" });
    }

    let user = null;

    if (auth_id) {
      const existingUser = await User.findOne({ auth_id });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const existingStaff = await Staff.findOne({ auth_id });
      if (existingStaff) {
        return res.status(400).json({ message: "Staff already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        name,
        auth_id,
        password: hashedPassword,
        role: "staff",
        hostelName: warden.hostelName,
        email: String(email).trim().toLowerCase()
      });
    }

    try {
      const staff = await Staff.create({
        userId: user?._id,
        auth_id,
        registeredByWarden: warden._id,
        roleName,
        name,
        gender,
        DOB,
        email: String(email).trim().toLowerCase(),
        contactNumber,
        address,
        hostelName: warden.hostelName,
        department,
        employmentType,
        shift,
        joiningDate,
        salary,
        status,
        adhaarCard,
        panCard,
        emergencyContact,
        notes
      });

      return res.status(201).json({
        message: "Staff created successfully",
        staff
      });
    } catch (err) {
      if (user) {
        await User.findByIdAndDelete(user._id);
      }
      throw err;
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= GET STAFF =================
async function getStaff(req, res) {
  try {
    const userId = req.user.id;

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const staff = await Staff.find({
      hostelName: warden.hostelName
    })
      .populate("hostelName")
      .select("-__v");

    return res.status(200).json(staff);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= UPDATE STAFF =================
async function updateStaff(req, res) {
  try {
    const userId = req.user.id;
    const { staffId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid staff id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const allowedFields = [
      "roleName",
      "name",
      "gender",
      "DOB",
      "email",
      "contactNumber",
      "address",
      "department",
      "employmentType",
      "shift",
      "joiningDate",
      "salary",
      "status",
      "adhaarCard",
      "panCard",
      "emergencyContact",
      "notes"
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const staff = await Staff.findOneAndUpdate(
      {
        _id: staffId,
        hostelName: warden.hostelName
      },
      updates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (updates.name && staff.userId) {
      await User.findByIdAndUpdate(staff.userId, { name: updates.name });
    }

    return res.status(200).json(staff);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateStaffCredentials(req, res) {
  try {
    const userId = req.user.id;
    const { staffId } = req.params;
    const { auth_id, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid staff id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      hostelName: warden.hostelName
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const linkedUser = await User.findById(staff.userId);
    if (!linkedUser) {
      return res.status(404).json({ message: "Linked staff login user not found" });
    }

    const userUpdates = {};
    const staffUpdates = {};

    if (auth_id !== undefined) {
      const nextAuthId = String(auth_id).trim();
      if (!nextAuthId) {
        return res.status(400).json({ message: "auth_id cannot be empty" });
      }

      if (nextAuthId !== staff.auth_id) {
        const existingUser = await User.findOne({
          auth_id: nextAuthId,
          _id: { $ne: linkedUser._id }
        });
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        const existingStaff = await Staff.findOne({
          auth_id: nextAuthId,
          _id: { $ne: staff._id }
        });
        if (existingStaff) {
          return res.status(400).json({ message: "Staff already exists" });
        }
      }

      userUpdates.auth_id = nextAuthId;
      staffUpdates.auth_id = nextAuthId;
    }

    if (password !== undefined) {
      const nextPassword = String(password);
      if (!nextPassword) {
        return res.status(400).json({ message: "Password cannot be empty" });
      }

      userUpdates.password = await bcrypt.hash(nextPassword, 10);
    }

    if (Object.keys(userUpdates).length === 0) {
      return res.status(400).json({ message: "No credentials to update" });
    }

    await User.updateOne(
      { _id: linkedUser._id },
      { $set: userUpdates },
      { runValidators: true }
    );

    const updatedStaff = await Staff.findByIdAndUpdate(
      staff._id,
      staffUpdates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    return res.status(200).json({
      message: "Staff credentials updated successfully",
      staff: updatedStaff
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= DELETE STAFF =================
async function deleteStaff(req, res) {
  try {
    const userId = req.user.id;
    const { staffId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid staff id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      hostelName: warden.hostelName
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (staff.userId) {
      await User.findByIdAndDelete(staff.userId);
    }

    await Staff.findByIdAndDelete(staffId);

    return res.status(200).json({
      message: "Staff deleted successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= WARDEN COMMUNITY POSTS =================
async function getPosts(req, res) {
  try {
    const userId = req.user.id;
    const { pinned } = req.query;

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const query = {};
    if (warden.hostelName) {
      query.hostelName = warden.hostelName;
    }
    if (pinned === "true") {
      query.pinned = true;
    }

    const posts = await Post.find(query)
      .populate("hostelName")
      .sort({ date: -1, time: -1, createdAt: -1 })
      .select("-__v");

    return res.status(200).json(posts.map((post) => postToResponse(post, userId)));

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createPost(req, res) {
  try {
    const userId = req.user.id;
    const { content, type = "text", tags, pollOptions } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: "Post content is required" });
    }

    if (!["text", "poll"].includes(type)) {
      return res.status(400).json({ message: "Invalid post type" });
    }

    const normalizedPollOptions = normalizePollOptions(type, pollOptions);
    if (type === "poll" && normalizedPollOptions.length < 2) {
      return res.status(400).json({ message: "Poll requires at least 2 options" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const latestPost = await Post.findOne().sort({ id: -1 }).select("id");
    const now = new Date();

    const post = await Post.create({
      id: (latestPost?.id || 0) + 1,
      author: warden.name,
      content: String(content).trim(),
      date: now,
      time: now.toTimeString().slice(0, 5),
      status: "Approved",
      type,
      tags: normalizeTags(tags),
      pollOptions: normalizedPollOptions,
      creatorId: userId,
      creatorRole: "warden",
      hostelName: warden.hostelName,
      pinned: false,
    });

    const populatedPost = await post.populate("hostelName");

    return res.status(201).json({
      message: "Post created successfully",
      post: postToResponse(populatedPost, userId),
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updatePost(req, res) {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { content, type, tags, pollOptions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findOne({ _id: postId, creatorId: userId });
    if (!post) {
      return res.status(404).json({ message: "Post not found or not owned by warden" });
    }

    const nextType = type || post.type;
    if (!["text", "poll"].includes(nextType)) {
      return res.status(400).json({ message: "Invalid post type" });
    }

    const updates = {};

    if (content !== undefined) {
      if (!String(content).trim()) {
        return res.status(400).json({ message: "Post content is required" });
      }
      updates.content = String(content).trim();
    }

    if (type !== undefined) {
      updates.type = nextType;
    }

    if (tags !== undefined) {
      updates.tags = normalizeTags(tags);
    }

    if (pollOptions !== undefined || type !== undefined) {
      const normalizedPollOptions = normalizePollOptions(
        nextType,
        pollOptions !== undefined ? pollOptions : post.pollOptions,
        post.pollOptions
      );

      if (nextType === "poll" && normalizedPollOptions.length < 2) {
        return res.status(400).json({ message: "Poll requires at least 2 options" });
      }

      updates.pollOptions = normalizedPollOptions;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      post._id,
      updates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    return res.status(200).json(postToResponse(updatedPost, userId));

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updatePostPin(req, res) {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { pinned } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findOneAndUpdate(
      { _id: postId, creatorId: userId },
      { pinned: Boolean(pinned) },
      { new: true, runValidators: true }
    ).populate("hostelName");

    if (!post) {
      return res.status(404).json({ message: "Post not found or not owned by warden" });
    }

    return res.status(200).json(postToResponse(post, userId));

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deletePost(req, res) {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await Post.findOneAndDelete({ _id: postId, creatorId: userId });
    if (!post) {
      return res.status(404).json({ message: "Post not found or not owned by warden" });
    }

    return res.status(200).json({ message: "Post deleted successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= GET WARDEN PROFILE =================
async function getWardenProfile(req, res) {
  try {
    const userId = req.user.id;
    console.log('=== GET WARDEN PROFILE ===');
    console.log('userId:', userId);
    console.log('User data:', req.user);

    const warden = await Warden.findOne({ userId }).populate("hostelName");
    console.log('Warden found:', !!warden);
    if (warden) {
      console.log('Warden ID:', warden._id);
      console.log('Warden hostelName:', warden.hostelName);
    }

    if (!warden) {
      console.log('❌ No warden record found for userId:', userId);
      return res.status(404).json({
        message: "Warden not found",
        debug: { userId }
      });
    }

    console.log('✅ Returning warden profile');
    return res.status(200).json(warden);

  } catch (err) {
    console.error('❌ Error in getWardenProfile:', err);
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
}

// ================= UPDATE WARDEN PROFILE =================
async function updateWardenProfile(req, res) {
  try {
    const userId = req.user.id;
    console.log('=== UPDATE WARDEN PROFILE ===');
    console.log('userId:', userId);
    console.log('Request body:', req.body);

    const allowedFields = [
      "name",
      "email",
      "phone",
      "gender",
      "DOB",
      "address",
      "qualification",
      "joiningDate",
      "status",
      "emergencyContact",
      "profilePic",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    console.log('Updates to apply:', updates);

    // ✅ Prevent empty update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const warden = await Warden.findOneAndUpdate(
      { userId },
      updates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    if (warden && updates.name) {
      // Sync name with User collection
      await User.findByIdAndUpdate(userId, { name: updates.name });
    }

    if (!warden) {
      console.log('❌ No warden record found for userId:', userId);
      return res.status(404).json({
        message: "Warden not found",
        debug: { userId }
      });
    }

    console.log('✅ Warden updated:', warden._id);
    return res.status(200).json(warden);

  } catch (err) {
    console.error('❌ Error in updateWardenProfile:', err);
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
}

async function votePost(req, res) {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { optionIndex } = req.body;

    if (optionIndex === undefined || optionIndex < 0) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.type !== 'poll') {
      return res.status(400).json({ message: "Post is not a poll" });
    }

    if (!post.pollOptions || optionIndex >= post.pollOptions.length) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    // Find existing voter
    const existingVoterIndex = post.voters.findIndex(voter => String(voter.userId) === String(userId));

    if (existingVoterIndex !== -1) {
      // User already voted, check if same option
      const oldOptionIndex = post.voters[existingVoterIndex].optionIndex;
      if (oldOptionIndex === optionIndex) {
        // Remove vote
        post.pollOptions[oldOptionIndex].votes -= 1;
        post.voters.splice(existingVoterIndex, 1);
      } else {
        // Change vote
        post.pollOptions[oldOptionIndex].votes -= 1;
        post.pollOptions[optionIndex].votes += 1;
        post.voters[existingVoterIndex].optionIndex = optionIndex;
      }
    } else {
      // New vote
      post.pollOptions[optionIndex].votes += 1;
      post.voters.push({ userId, optionIndex });
    }

    await post.save();

    const populatedPost = await post.populate("hostelName");

    return res.status(200).json({
      message: "Vote recorded successfully",
      post: postToResponse(populatedPost, userId)
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= WARDEN COMPLAINTS =================
async function getComplaints(req, res) {
  try {
    const userId = req.user.id;

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const complaints = await WardenComplaint.find({
      hostelName: warden.hostelName
    })
      .populate("hostelName")
      .populate("creator")
      .sort({ "timeline.reportedDate": -1, "timeline.reportedTime": -1 })
      .select("-__v");

    return res.status(200).json(complaints);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function approveComplaint(req, res) {
  try {
    const userId = req.user.id;
    const { complaintId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({ message: "Invalid complaint id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const complaint = await WardenComplaint.findOne({
      _id: complaintId,
      hostelName: warden.hostelName
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.status !== 'OPEN') {
      return res.status(400).json({ message: "Complaint is not open" });
    }

    const now = new Date();
    const updates = {
      status: 'RESOLVED',
      'timeline.resolvedDate': now,
      'timeline.resolvedTime': now.toTimeString().slice(0, 5),
      'timeline.resolvedReason': reason || 'Approved by warden'
    };

    const updatedComplaint = await WardenComplaint.findByIdAndUpdate(
      complaint._id,
      updates,
      { new: true, runValidators: true }
    ).populate("hostelName").populate("creator");

    // Sync to ComplaintHistory
    if (updatedComplaint) {
      await ComplaintHistory.create({
        title: updatedComplaint.title,
        description: updatedComplaint.description,
        reporter: updatedComplaint.reporter,
        role: updatedComplaint.role,
        date: updatedComplaint.date,
        time: updatedComplaint.time,
        location: updatedComplaint.location,
        priority: updatedComplaint.priority,
        status: updatedComplaint.status,
        timeline: updatedComplaint.timeline,
        creator: updatedComplaint.creator._id || updatedComplaint.creator,
        hostelName: updatedComplaint.hostelName._id || updatedComplaint.hostelName
      });
    }

    return res.status(200).json(updatedComplaint);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectComplaint(req, res) {
  try {
    const userId = req.user.id;
    const { complaintId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({ message: "Invalid complaint id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const complaint = await WardenComplaint.findOne({
      _id: complaintId,
      hostelName: warden.hostelName
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.status !== 'OPEN') {
      return res.status(400).json({ message: "Complaint is not open" });
    }

    const now = new Date();
    const updates = {
      status: 'ESCALATED',
      'timeline.escalatedDate': now,
      'timeline.escalatedTime': now.toTimeString().slice(0, 5),
      'timeline.escalatedReason': reason || 'Rejected by warden'
    };

    const updatedComplaint = await WardenComplaint.findByIdAndUpdate(
      complaint._id,
      updates,
      { new: true, runValidators: true }
    ).populate("hostelName").populate("creator");

    // Sync to ComplaintHistory
    if (updatedComplaint) {
      await ComplaintHistory.create({
        title: updatedComplaint.title,
        description: updatedComplaint.description,
        reporter: updatedComplaint.reporter,
        role: updatedComplaint.role,
        date: updatedComplaint.date,
        time: updatedComplaint.time,
        location: updatedComplaint.location,
        priority: updatedComplaint.priority,
        status: updatedComplaint.status,
        timeline: updatedComplaint.timeline,
        creator: updatedComplaint.creator._id || updatedComplaint.creator,
        hostelName: updatedComplaint.hostelName._id || updatedComplaint.hostelName
      });
    }

    return res.status(200).json(updatedComplaint);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteComplaint(req, res) {
  try {
    const userId = req.user.id;
    const { complaintId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(400).json({ message: "Invalid complaint id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const complaint = await WardenComplaint.findOneAndDelete({
      _id: complaintId,
      hostelName: warden.hostelName,
      status: { $ne: 'OPEN' } // Can only delete resolved/escalated ones from active list
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found or is still open" });
    }

    return res.status(200).json({ message: "Complaint removed from active list" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getComplaintHistory(req, res) {
  try {
    const userId = req.user.id;

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const history = await ComplaintHistory.find({
      hostelName: warden.hostelName
    })
      .populate("hostelName")
      .populate("creator")
      .sort({ "timeline.reportedDate": -1, "timeline.reportedTime": -1 })
      .select("-__v");

    return res.status(200).json(history);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteComplaintHistory(req, res) {
  try {
    const userId = req.user.id;
    const { historyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({ message: "Invalid history id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const history = await ComplaintHistory.findOneAndDelete({
      _id: historyId,
      hostelName: warden.hostelName
    });

    if (!history) {
      return res.status(404).json({ message: "History record not found" });
    }

    return res.status(200).json({ message: "History record deleted permanently" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function testCreateComplaint(req, res) {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const student = await Student.findById(studentId).populate('hostelName');
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const user = await User.findById(student.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const complaint = await WardenComplaint.create({
      title: "Test Complaint",
      description: "This is a test complaint created for testing purposes",
      reporter: student.name,
      role: user.role,
      date: now,
      time: now.toTimeString().slice(0, 5),
      location: "Test Location",
      priority: "Medium",
      status: "OPEN",
      timeline: {
        reportedDate: now,
        reportedTime: now.toTimeString().slice(0, 5),
      },
      creator: student.userId,
      hostelName: student.hostelName._id
    });

    const populatedComplaint = await complaint.populate([
      { path: "hostelName" },
      { path: "creator" }
    ]);
    return res.status(201).json({
      message: "Test complaint created successfully",
      complaint: populatedComplaint
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= WARDEN ACTIVITIES =================
async function getActivities(req, res) {
  try {
    const userId = req.user.id;

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const activities = await Activity.find({
      hostelName: warden.hostelName
    })
      .populate("hostelName")
      .populate("creator")
      .populate("approvedBy", "name")
      .populate("rejectedBy", "name")
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json(activities);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getPendingActivities(req, res) {
  try {
    const userId = req.user.id;

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const activities = await PendingActivity.find({
      hostelName: warden.hostelName
    })
      .populate("hostelName")
      .populate("creator")
      .populate("approvedBy", "name")
      .populate("rejectedBy", "name")
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json(activities);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function approveActivity(req, res) {
  try {
    const userId = req.user.id;
    const { activityId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ message: "Invalid activity id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    // 1. Update the record in PendingActivity
    const pendingActivity = await PendingActivity.findOneAndUpdate(
      {
        _id: activityId,
        hostelName: warden.hostelName
      },
      {
        status: 'Approved',
        approvedBy: userId,
        rejectedBy: null
      },
      { new: true, runValidators: true }
    ).populate("hostelName").populate("creator").populate("approvedBy", "name");

    if (!pendingActivity) {
      return res.status(404).json({ message: "Pending activity not found" });
    }

    // 2. Create/Sync to the live Activity collection
    const latestActivity = await Activity.findOne().sort({ id: -1 }).select("id");
    const newLiveId = (latestActivity?.id || 0) + 1;

    const liveActivity = await Activity.create({
      id: newLiveId,
      title: pendingActivity.title,
      description: pendingActivity.description,
      requestedBy: pendingActivity.requestedBy,
      requesterRole: pendingActivity.requesterRole,
      date: pendingActivity.date,
      time: pendingActivity.time,
      location: pendingActivity.location,
      category: pendingActivity.category,
      status: 'Approved',
      approvedBy: userId,
      creator: pendingActivity.creator._id || pendingActivity.creator,
      hostelName: pendingActivity.hostelName
    });

    return res.status(200).json({
      message: "Activity approved and published",
      activity: pendingActivity,
      publishedActivity: liveActivity
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function rejectActivity(req, res) {
  try {
    const userId = req.user.id;
    const { activityId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ message: "Invalid activity id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const activity = await PendingActivity.findOneAndUpdate(
      {
        _id: activityId,
        hostelName: warden.hostelName
      },
      {
        status: 'Rejected',
        rejectionReason: reason || 'Rejected by warden',
        rejectedBy: userId, // Store user ID
        approvedBy: null
      },
      { new: true, runValidators: true }
    ).populate("hostelName").populate("creator").populate("rejectedBy", "name");

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    return res.status(200).json(activity);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteActivity(req, res) {
  try {
    const userId = req.user.id;
    const { activityId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ message: "Invalid activity id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    // Deleting from this route now targets the moderation record (PendingActivity)
    // as per user request, to prevent deleting live activities for everyone.
    const activity = await PendingActivity.findOneAndDelete({
      _id: activityId,
      hostelName: warden.hostelName,
      status: { $in: ['Approved', 'Rejected'] }
    });

    if (!activity) {
      return res.status(404).json({ message: "Moderation record not found or is still pending" });
    }

    return res.status(200).json({ message: "Moderation record deleted successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deletePendingActivity(req, res) {
  try {
    const userId = req.user.id;
    const { activityId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ message: "Invalid activity id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const activity = await PendingActivity.findOneAndDelete({
      _id: activityId,
      hostelName: warden.hostelName,
      status: { $in: ['Approved', 'Rejected'] } // Only allow deleting processed ones
    });

    if (!activity) {
      return res.status(404).json({ message: "Pending activity not found or cannot be deleted" });
    }

    return res.status(200).json({ message: "Moderation record deleted" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function testCreateActivity(req, res) {
  try {
    const { requesterId } = req.params;
    const { title, description, category, date, time, location } = req.body;
    const wardenUserId = req.user.id;

    const warden = await Warden.findOne({ userId: wardenUserId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    let requesterUser = null;
    let requesterName = "";
    let requesterRole = "";

    // 1. Check Warden profile
    const wardenP = await Warden.findById(requesterId);
    if (wardenP) {
      requesterUser = await User.findById(wardenP.userId);
      requesterName = wardenP.name;
      requesterRole = 'warden';
    }

    // 2. Check Student profile
    if (!requesterUser && mongoose.Types.ObjectId.isValid(requesterId)) {
      const studentP = await Student.findById(requesterId);
      if (studentP) {
        requesterUser = await User.findById(studentP.userId);
        requesterName = studentP.name;
        requesterRole = 'student';
      }
    }

    // 3. Check Staff profile
    if (!requesterUser && mongoose.Types.ObjectId.isValid(requesterId)) {
      const staffP = await Staff.findById(requesterId);
      if (staffP) {
        requesterUser = await User.findById(staffP.userId);
        requesterName = staffP.name;
        // Check if they are a teacher
        const isTeacher = staffP.roleName?.toLowerCase().includes('teacher');
        requesterRole = isTeacher ? 'teacher' : 'staff';
      }
    }

    // 4. Fallback to direct User ID
    if (!requesterUser && mongoose.Types.ObjectId.isValid(requesterId)) {
      requesterUser = await User.findById(requesterId);
      if (requesterUser) {
        requesterName = requesterUser.name;
        requesterRole = requesterUser.role;
      }
    }

    if (!requesterUser) {
      return res.status(404).json({ message: "Requester not found" });
    }

    const roleMap = {
      student: 'student',
      warden: 'warden',
      staff: 'staff'
    };

    const normalizedRole = roleMap[requesterRole] || 'student';
    const isAutoApproved = normalizedRole === 'warden';
    const status = isAutoApproved ? 'Approved' : 'Pending';

    const latestActivity = await PendingActivity.findOne().sort({ id: -1 }).select("id");

    const activity = await PendingActivity.create({
      id: (latestActivity?.id || 0) + 1,
      title: title || "Test Activity",
      description: description || "Test description",
      requestedBy: requesterName || requesterUser.name,
      requesterRole: normalizedRole,
      date: date || new Date(),
      time: time || "10:00",
      location: location || "Hostel Ground",
      category: category || "Sports",
      status: 'Pending',
      creator: requesterUser._id,
      hostelName: warden.hostelName
    });

    const populatedActivity = await activity.populate([
      { path: "hostelName" },
      { path: "creator" },
      { path: "approvedBy", select: "name" }
    ]);

    return res.status(201).json({
      message: "Test activity created successfully",
      activity: populatedActivity
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createStudent,
  getStudents,
  updateStudent,
  updateStudentCredentials,
  deleteStudent,
  createStaff,
  getStaff,
  updateStaff,
  updateStaffCredentials,
  deleteStaff,
  getPosts,
  createPost,
  updatePost,
  updatePostPin,
  deletePost,
  votePost,
  getWardenProfile,
  updateWardenProfile,
  getComplaints,
  getComplaintHistory,
  approveComplaint,
  rejectComplaint,
  deleteComplaint,
  deleteComplaintHistory,
  testCreateComplaint,
  getActivities,
  getPendingActivities,
  approveActivity,
  rejectActivity,
  deleteActivity,
  deletePendingActivity,
  testCreateActivity,
};
