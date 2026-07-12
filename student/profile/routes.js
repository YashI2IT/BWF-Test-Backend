// student/profile/routes.js
const express = require("express");
const router = express.Router();

const {
  getStudent,
  updateStudent,
  getJournalEntries,
  postJournal
} = require("./controller");

const {
  authenticateToken,
  authorizeRoles,
} = require("../../auth/middleware");

router.get(
  "/me",
  authenticateToken,
  authorizeRoles("student", "admin"),
  getStudent
);

router.put(
  "/me",
  authenticateToken,
  authorizeRoles("student"),
  updateStudent
);

router.get(
  "/me/journal",
  authenticateToken,
  authorizeRoles("student"),
  getJournalEntries
);

router.post(
  "/me/journal",
  authenticateToken,
  authorizeRoles("student"),
  postJournal
);

module.exports = router;