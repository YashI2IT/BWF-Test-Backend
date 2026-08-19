// routes/student/communityRoutes.js

const express = require("express");
const router = express.Router();

const {
  getCommunityPosts,
  createPost,
  toggleLike,
  votePoll
} = require("./controller");

const upload = require("./middleware");
const {authenticateToken} = require("../../auth/middleware");

// GET posts
router.get("/posts", authenticateToken, getCommunityPosts);

// POST new post
router.post(
  "/posts",
  authenticateToken,
  upload.single("media"),
  createPost
);

// LIKE toggle
router.post(
  "/posts/:id/like",
  authenticateToken,
  toggleLike
);

// VOTE poll
router.post(
  "/posts/:id/vote",
  authenticateToken,
  votePoll
);

module.exports = router;