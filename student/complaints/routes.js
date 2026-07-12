// student/complaints/routes.js
const express = require("express");
const router = express.Router();

const {
  postComplaint,
  getMyComplaints
} = require("./controller");

const {
  authenticateToken,
  authorizeRoles
} = require("../../auth/middleware");

// Student only
router.post(
  "/",
  authenticateToken,
  authorizeRoles("student"),
  postComplaint
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("student"),
  getMyComplaints
);

module.exports = router;