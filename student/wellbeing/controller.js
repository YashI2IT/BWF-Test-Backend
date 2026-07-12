// student/wellbeing/controller.js
const {
  saveMood,
  getMoodHistory,
} = require("./service");

const CounsellingRequest = require("../models/counsellingRequest");

async function postMood(req, res) {
  try {
    const auth_id = req.user.auth_id;
    const { mood, context, thought, reframe } = req.body;

    if (!mood) {
      return res.status(400).json({ message: "Mood is required" });
    }

    await saveMood({
      auth_id,
      mood,
      context,
      thought,
      reframe
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("MOOD SAVE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}

async function getMood(req, res) {
  try {
    const auth_id = req.user.auth_id;

    const history = await getMoodHistory(auth_id);

    return res.status(200).json({history});

  } catch (err) {
    console.error("MOOD FETCH ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function requestCounselling(req, res) {
  try {
    const auth_id = req.user.auth_id;
    const { message } = req.body;

    const request = await CounsellingRequest.create({
      auth_id,
      message
    });

    return res.status(200).json({
      success: true,
      request
    });

  } catch (err) {
    console.error("COUNSELLING ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getHistory(req, res) {
  try {
    const auth_id = req.user.auth_id;

    const history = await getMoodHistory(auth_id);

    return res.status(200).json({ history });

  } catch (err) {
    console.error("HISTORY ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}



module.exports = {
  postMood,
  getMood,
  requestCounselling,
  getHistory
};