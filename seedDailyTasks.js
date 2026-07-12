const mongoose = require('mongoose');
const DailyTask = require('./student/models/dailyTask');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bwf";

async function seedDailyTasks() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding Daily Tasks...");

    const mockTasks = [];
    const dbStudents = await mongoose.connection.collection('students').find({}).toArray();
    
    if (dbStudents.length === 0) {
      console.log("No students found in DB. Run seedData.js first.");
      process.exit(1);
    }

    // Seed for today and yesterday to have realistic data
    for (let i = 0; i < 15; i++) {
      const student = dbStudents[i % dbStudents.length];
      
      const date = new Date();
      if (i >= 10) {
        // Last 5 records for yesterday
        date.setDate(date.getDate() - 1);
      }
      
      const dateString = date.toISOString().split('T')[0];
      
      mockTasks.push({
        auth_id: student.auth_id,
        date: dateString,
        completed: Math.random() > 0.4 // 60% chance of being true
      });
    }

    // Delete existing to avoid duplicate index errors
    await DailyTask.deleteMany({});
    
    await DailyTask.insertMany(mockTasks);

    console.log(`Successfully seeded ${mockTasks.length} daily tasks.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedDailyTasks();
