// student/assignments/service.js

const StudentAssignment = require("../models/student_assignment");
const Task = require("../models/Task");

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
      select: "title subject dueDate fileUrl fileType"
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
      rejectionNote: d.rejectionNote,
      fileUrl: d.assignment_id.fileUrl,
      fileType: d.assignment_id.fileType
    }));

  let taskMatchCondition = { assignedTo: auth_id };
  if (range === "30d") {
    const cutoff = getDate30DaysAgo();
    taskMatchCondition.dueDate = { $gte: cutoff };
  }

  const tasks = await Task.find(taskMatchCondition).lean();

  const formattedTasks = tasks.map(t => ({
    _id: t._id,
    title: t.title,
    subject: "Custom Task",
    dueDate: t.dueDate,
    status: t.status === "pending" ? "todo" : (t.status === "verified" ? "verified" : "student_submitted"),
    submittedDate: t.submittedDate,
    fileUrl: t.fileUrl,
    fileType: t.fileType
  }));

  return [...filteredAssignments, ...formattedTasks].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );
}


async function submitAssignment(auth_id, assignmentId, mediaUrl = null, mediaType = null) {
  const today = new Date().toISOString().split("T")[0];

  const updateFields = {
    status: "student_submitted",
    submittedDate: today
  };

  if (mediaUrl) updateFields.submissionUrl = mediaUrl;
  if (mediaType) updateFields.submissionType = mediaType;

  // First try to find and update StudentAssignment
  const updatedStudentAssignment = await StudentAssignment.findOneAndUpdate(
    { auth_id, assignment_id: assignmentId },
    updateFields,
    { new: true }
  );

  if (updatedStudentAssignment) {
    return updatedStudentAssignment;
  }

  // If not found, try Task model
  const taskUpdateFields = {
    status: "submitted",
    submittedDate: today
  };
  
  if (mediaUrl) taskUpdateFields.submissionUrl = mediaUrl;
  if (mediaType) taskUpdateFields.submissionType = mediaType;

  const updatedTask = await Task.findOneAndUpdate(
    { _id: assignmentId, assignedTo: auth_id },
    taskUpdateFields,
    { new: true }
  );

  if (updatedTask) {
    return updatedTask;
  }

  throw new Error("Assignment or Task not found");
}

async function revertAssignment(auth_id, assignmentId) {
  // First try StudentAssignment
  const updatedSA = await StudentAssignment.findOneAndUpdate(
    { auth_id, assignment_id: assignmentId },
    { $set: { status: "todo" }, $unset: { submittedDate: 1, submissionUrl: 1, submissionType: 1, rejectionNote: 1 } },
    { new: true }
  );

  if (updatedSA) return updatedSA;

  // If not found, try Task
  const updatedTask = await Task.findOneAndUpdate(
    { _id: assignmentId, assignedTo: auth_id },
    { $set: { status: "pending" }, $unset: { submittedDate: 1, submissionUrl: 1, submissionType: 1 } },
    { new: true }
  );

  if (updatedTask) return updatedTask;

  throw new Error("Assignment or Task not found");
}

module.exports = {
  getAssignments,
  submitAssignment,
  revertAssignment
  };