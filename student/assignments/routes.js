// student/assignments/routes.js
const express = require("express");
const { authenticateToken } = require("../../auth/middleware");
const multer = require('multer');

const memoryUpload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

const {
  getAssignmentsController,
  submitAssignmentController,
  revertAssignmentController
} = require("./controller");

// GET all assignments
router.get("/", authenticateToken, getAssignmentsController);

// Submit assignment
router.post("/:id/submit", authenticateToken, memoryUpload.single('file'), submitAssignmentController);

// Revert assignment
router.post("/:id/revert", authenticateToken, revertAssignmentController);

module.exports = router;