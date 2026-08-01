// student/wellbeing/controller.js
const {
  saveMood,
  getMoodHistory,
} = require("./service");

const CounsellingRequest = require("../models/counsellingRequest");
const DailyTask = require("../models/dailyTask");

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


async function toggleTask(req, res) {
  try {
    const auth_id = req.user.auth_id;
    const { completed } = req.body;

    const date = new Date().toISOString().split("T")[0];

    const task = await DailyTask.findOneAndUpdate(
      { auth_id, date },
      { completed, auth_id, date },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      task
    });

  } catch (err) {
    console.error("TASK ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getTodayTask(req, res) {
  try {
    const auth_id = req.user.auth_id;
    const date = new Date().toISOString().split("T")[0];

    const task = await DailyTask.findOne({ auth_id, date });

    return res.status(200).json({
      task: task || { completed: false },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}


module.exports = {
  postMood,
  getMood,
  requestCounselling,
  toggleTask,
  getHistory,
  getTodayTask
};