// student/wellbeing/routes.js
const express = require("express");
const {authenticateToken} = require("../../auth/middleware")
const router = express.Router();

const {
  postMood,
  getMood,
  getHistory,
  requestCounselling
} = require("./controller");

// 
router.get("/mood", authenticateToken, getMood);

// CBT Mood Log
router.post("/mood", authenticateToken, postMood);

// Mood History
router.get("/history", authenticateToken, getHistory);

// Counselling Request
router.post("/counselling", authenticateToken, requestCounselling);




module.exports = router;