// student/assignments/service.js

const StudentAssignment = require("../models/student_assignment");

function getDate30DaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

async function getAssignments(auth_id, range = "30d") {
  let matchCondition = {};

  if (range === "30d") {
    const cutoff = getDate30DaysAgo();
    matchCondition = { dueDate: { $gte: cutoff } };
  }

  const data = await StudentAssignment.find({ auth_id })
    .populate({
      path: "assignment_id",
      match: matchCondition,
      select: "title subject dueDate"
    })
    .lean();

  const filtered = data.filter(d => d.assignment_id !== null);

  return filtered
    .map(d => ({
      _id: d.assignment_id._id,
      title: d.assignment_id.title,
      subject: d.assignment_id.subject,
      dueDate: d.assignment_id.dueDate,
      status: d.status,
      submittedDate: d.submittedDate,
      rejectionNote: d.rejectionNote
    }))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}


async function submitAssignment(auth_id, assignmentId) {
  const today = new Date().toISOString().split("T")[0];

  const updated = await StudentAssignment.findOneAndUpdate(
    {
      auth_id,
      assignment_id: assignmentId,
    },
    {
      status: "student_submitted",
      submittedDate: today
    },
    { new: true }
  );

  if (!updated) {
    throw new Error("Student assignment not found");
  }

  return updated;
}

async function revertAssignment(auth_id, assignmentId) {
  const assignment = await StudentAssignment.findOne({
    auth_id,
    assignment_id: assignmentId
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  if (assignment.status === "verified") {
    throw new Error("Cannot revert a verified assignment");
  }

  if (assignment.status === "todo") {
    throw new Error("Assignment already in todo state");
  }

  assignment.status = "todo";
  assignment.submittedDate = null;

  await assignment.save();

  return assignment;
}

module.exports = {
  getAssignments,
  submitAssignment,
  revertAssignment
  };