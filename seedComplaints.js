const mongoose = require('mongoose');
const WardenComplaint = require('./warden/models/complaints');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bwf";

async function seedComplaints() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding complaints...");

    // Create a fake ObjectId for creator and hostelName
    const fakeCreatorId = new mongoose.Types.ObjectId();
    const fakeHostelId = new mongoose.Types.ObjectId();

    const mockComplaints = [];
    const topics = [
      { title: "Noisy neighbors", location: "Room 101" },
      { title: "Leaky faucet", location: "Washroom A" },
      { title: "Internet issues", location: "Study Room" },
      { title: "Broken chair", location: "Library" },
      { title: "Fan not working", location: "Room 205" },
      { title: "Food quality poor", location: "Mess" },
      { title: "AC not cooling", location: "Room 304" },
      { title: "Water cooler empty", location: "Floor 2" },
      { title: "Lost textbook", location: "Common Area" },
      { title: "Light bulb fused", location: "Room 112" },
      { title: "Window won't close", location: "Room 220" },
      { title: "Too much dust", location: "Corridor" },
      { title: "Projector broken", location: "Classroom 4" },
      { title: "Whiteboard needs replacement", location: "Classroom 2" },
      { title: "Pest problem", location: "Room 105" },
      { title: "Loud music late night", location: "Room 301" },
      { title: "Bad smell", location: "Washroom B" }
    ];

    const priorities = ["Low", "Medium", "High"];
    const statuses = ["OPEN", "RESOLVED", "ESCALATED"];

    for (let i = 0; i < 15; i++) {
      const topic = topics[i % topics.length];
      const date = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
      const time = date.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" });
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const timeline = {
        reportedDate: date,
        reportedTime: time,
      };

      if (status === "RESOLVED") {
        timeline.resolvedDate = new Date(date.getTime() + 86400000);
        timeline.resolvedTime = "10:00";
        timeline.resolvedReason = "Fixed the issue.";
      } else if (status === "ESCALATED") {
        timeline.escalatedDate = new Date(date.getTime() + 86400000);
        timeline.escalatedTime = "11:00";
        timeline.escalatedReason = "Requires higher authority approval.";
      }

      mockComplaints.push({
        title: topic.title,
        description: `This is a detailed description of the complaint regarding ${topic.title.toLowerCase()}. It has been causing inconvenience.`,
        reporter: `Student ${i + 1}`,
        role: "student",
        date: date,
        time: time,
        location: topic.location,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: status,
        timeline: timeline,
        creator: fakeCreatorId,
        hostelName: fakeHostelId
      });
    }

    await WardenComplaint.insertMany(mockComplaints);

    console.log(`Successfully seeded ${mockComplaints.length} complaints.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedComplaints();
