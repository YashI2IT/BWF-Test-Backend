const mongoose = require('mongoose');
const Post = require('./warden/models/post');
const Notice = require('./student/models/Notice');
const WardenComplaint = require('./warden/models/complaints');
const Task = require('./student/models/Task');
const DailyTask = require('./student/models/dailyTask');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bwf";

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Seed Notices
    await Notice.deleteMany({ authorRole: 'teacher' });
    await Notice.create([
      { title: "Mid-Term Examination Schedule", body: "Please be informed that the mid-terms will begin on the 15th of next month. Syllabus will be shared next week.", category: "academic", publishedDate: "20 Jun 2026", authorRole: "teacher", isActive: true },
      { title: "Upcoming Science Fair", body: "Students interested in participating in the regional Science Fair must submit their proposals to the faculty lounge by Friday.", category: "events", publishedDate: "20 Jun 2026", authorRole: "teacher", isActive: true }
    ]);

    // Seed Tasks
    await Task.deleteMany();
    await Task.create([
      { title: "Complete Chapter 4 Exercises", description: "Math exercises from page 112 to 115.", dueDate: "2026-06-25", assignedTo: "STU001", status: "pending" },
      { title: "Submit History Project Draft", description: "Ensure citations are properly formatted in APA style.", dueDate: "2026-06-22", assignedTo: "STU002", status: "completed" }
    ]);

    // Seed Daily Tasks
    await DailyTask.deleteMany();
    await DailyTask.create([
      { auth_id: "STU001", date: "2026-06-20", completed: true },
      { auth_id: "STU002", date: "2026-06-20", completed: false }
    ]);

    // Seed Community Posts
    await Post.deleteMany({ author: "Teacher" });
    const lastPost = await Post.findOne().sort({ id: -1 });
    let nextId = lastPost && !isNaN(lastPost.id) ? lastPost.id + 1 : 1;
    
    // Hardcode a fake User ID for creatorId since we might not have one handy
    const fakeObjectId = new mongoose.Types.ObjectId();

    await Post.create([
      { id: nextId++, author: "Teacher", content: "Great job to everyone who participated in today's pop quiz!", date: new Date(), time: "14:30", type: "text", status: "Approved", creatorId: fakeObjectId, creatorRole: "teacher", tags: ["#academic"] },
      { id: nextId++, author: "Teacher", content: "Which topic should we cover for the special revision class this weekend?", date: new Date(), time: "15:00", type: "poll", status: "Approved", creatorId: fakeObjectId, creatorRole: "teacher", pollOptions: [{text:"Algebra", votes:5}, {text:"Geometry", votes:2}], tags: ["#poll"] }
    ]);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();
