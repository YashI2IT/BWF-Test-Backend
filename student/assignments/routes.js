// student/assignments/routes.js
const express = require("express");
const { authenticateToken } = require("../../auth/middleware");

const router = express.Router();

const {
  getAssignmentsController,
  submitAssignmentController,
  revertAssignmentController
} = require("./controller");

// GET all assignments
router.get("/", authenticateToken, getAssignmentsController);

// Submit assignment
router.post("/:id/submit", authenticateToken, submitAssignmentController);

// Revert assignment
router.post("/:id/revert", authenticateToken, revertAssignmentController);

module.exports = router;