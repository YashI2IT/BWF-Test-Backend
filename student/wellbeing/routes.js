// student/wellbeing/routes.js
const express = require("express");
const {authenticateToken} = require("../../auth/middleware")
const router = express.Router();

const {
  postMood,
  getMood,
  getHistory,
  requestCounselling,
  toggleTask,
  getTodayTask
} = require("./controller");

// 
router.get("/mood", authenticateToken, getMood);

// CBT Mood Log
router.post("/mood", authenticateToken, postMood);

// Mood History
router.get("/history", authenticateToken, getHistory);

// Counselling Request
router.post("/counselling", authenticateToken, requestCounselling);

// Daily Task Toggle
router.patch("/tasks/today", authenticateToken, toggleTask);

router.get("/tasks/today", authenticateToken, getTodayTask);


module.exports = router;