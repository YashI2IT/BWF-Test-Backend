// student/profile/controller.js
const Student = require("../models/student");
const { isValidUser } = require("../../auth/service");
const { saveJournal, getJournal } = require("./service");

const { validateStudentUpdate } = require("./service");

async function getStudent(req, res) {
  const auth_id = req.user.auth_id;

  try {
    if (!isValidUser(auth_id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const student = await Student.findOne({ auth_id }).lean();

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    return res.status(200).json({
      name: student.name || "",
      dob: student.DOB || null,
      classInfo: student.classInfo || "",
      interests: student.interests || [],
      bio: student.bio || "",
      avatarId: student.avatarId || null,
      customAvatarUrl: student.customAvatarUrl || null,
    });

  } catch (error) {
    console.error("GET ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}


async function updateStudent(req, res) {
  const auth_id = req.user.auth_id;
  let updateData = req.body;

  try {
    if (!isValidUser(auth_id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const errors = validateStudentUpdate(updateData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const allowedFields = [
      "bio",
      "classInfo",
      "interests",
      "avatarId",
      "customAvatarUrl",
    ];

    updateData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) =>
        allowedFields.includes(key)
      )
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (updateData.trustedPerson) {
      const tp = updateData.trustedPerson;

      if (tp.name !== undefined)
        updateData["trustedPerson.name"] = tp.name;

      if (tp.phone !== undefined)
        updateData["trustedPerson.phone"] = tp.phone;

      if (tp.relation !== undefined)
        updateData["trustedPerson.relation"] = tp.relation;

      delete updateData.trustedPerson;
    }

    const student = await Student.findOneAndUpdate(
      { auth_id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({
      name: student.name || "",
      dob: student.DOB || null,
      bio: student.bio || "",
      classInfo: student.classInfo || "",
      interests: student.interests || [],
      avatarId: student.avatarId || null,
      customAvatarUrl: student.customAvatarUrl || null,
      // trustedPerson: student.trustedPerson
    });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function postJournal(req, res) {
  try {
    const auth_id = req.user.auth_id;

    const { title, body, date } = req.body;

    if (!title || !body || !date) {
      return res.status(400).json({ message: "All fields required" });
    }

    const entry = await saveJournal(auth_id, { title, body, date });

    return res.status(200).json({
      success: true,
      entry
    });

  } catch (err) {
    console.error("JOURNAL SAVE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getJournalEntries(req, res) {
  try {
    const auth_id = req.user.auth_id;

    const entries = await getJournal(auth_id);

    return res.status(200).json(entries);

  } catch (err) {
    console.error("JOURNAL FETCH ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getStudent,
  updateStudent,
  postJournal,
  getJournalEntries
};