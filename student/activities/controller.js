const Activity = require('../../warden/models/activity');

async function getCampusActivities(req, res) {
  try {
    // Fetch activities that are approved or active
    // The warden model sets status to 'approved' when approved
    const activities = await Activity.find({
      status: { $in: ['approved', 'active', 'completed'] }
    }).sort({ date: 1, time: 1 });

    return res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching campus activities:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getCampusActivities
};
