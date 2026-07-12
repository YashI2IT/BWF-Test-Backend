const MoodLog = require("../models/moodLog");
const Journal = require("../models/journal");

const moodMap = {
  "Happy": "happy",
  "Okay": "okay",
  "Need Help": "need_help"
};

const reverseMoodMap = {
  "happy": "Happy",
  "okay": "Okay",
  "need_help": "Need Help"
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

async function saveMood({ auth_id, mood, context, thought, reframe }) {
  const date = getTodayDate();

  const formattedMood = mood.toLowerCase().replace(" ", "_");

  return await MoodLog.findOneAndUpdate(
    { auth_id, date },
    {
      mood: formattedMood,
      context,
      thought,
      reframe,
      last_modified: new Date()
    },
    {
      new: true,
      upsert: true
    }
  );
}

async function getMoodHistory(auth_id) {
  const data = await MoodLog.find({ auth_id })
    .sort({ date: -1 })
    .lean();

  return data.map(item => ({
    id: item._id,
    date: item.date,
    mood: formatMood(item.mood),
    context: item.context,
    thought: item.thought,
    reframe: item.reframe
  }));
}

function formatMood(mood) {
  if (mood === "need_help") return "Need Help";
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}



module.exports = {
  saveMood,
  getMoodHistory,
};