const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./models/User');
const Student = require('./student/models/student');
const Teacher = require('./teacher/models/teacher');
const Assignment = require('./student/models/assignment');
const StudentAssignment = require('./student/models/student_assignment');
const CommunityPost = require('./models/CommunityPost');
const MoodLog = require('./student/models/moodLog');
const Journal = require('./student/models/journal');

const seedData = async () => {
  try {
    // Clear previous seed data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Assignment.deleteMany({});
    await StudentAssignment.deleteMany({});
    await MoodLog.deleteMany({});
    await Journal.deleteMany({});
    await CommunityPost.deleteMany({});

    console.log('🧹 Cleared existing database...');

    const hashedPassword = await bcrypt.hash('123456', 10);

    // 1. Create Teacher
    const teacherUser = await User.create({
      name: 'Test Teacher',
      auth_id: 'TEACHER-1',
      password: hashedPassword,
      role: 'teacher'
    });

    await Teacher.create({
      userId: teacherUser._id,
      name: teacherUser.name,
      auth_id: teacherUser.auth_id,
      email: 'teacher@bwf.com',
      phone: '9876543211',
      bio: 'Dedicated math and science educator.',
      programName: 'BWF Scholars'
    });

    console.log('🧑‍🏫 Created Teacher (auth_id: TEACHER-1, pass: 123456)');

    // 2. Create Students
    const studentsData = [
      { name: 'Aisha Khan', auth_id: 'STUDENT-1', classInfo: '10th Grade' },
      { name: 'Rohan Verma', auth_id: 'STUDENT-2', classInfo: '9th Grade' },
      { name: 'Priya Singh', auth_id: 'STUDENT-3', classInfo: '10th Grade' }
    ];

    const createdStudents = [];
    for (const s of studentsData) {
      const user = await User.create({
        name: s.name,
        auth_id: s.auth_id,
        password: hashedPassword,
        role: 'student'
      });

      const student = await Student.create({
        userId: user._id,
        auth_id: user.auth_id,
        name: user.name,
        DOB: new Date('2008-05-10'),
        bio: 'I love learning!',
        gender: 'female',
        email: `${s.auth_id.toLowerCase()}@student.com`,
        contactNumber: '9876543210',
        address: 'Pune, India',
        classInfo: s.classInfo,
        mentorName: teacherUser.name // Assign to our test teacher
      });
      createdStudents.push(student);
    }
    
    console.log(`👨‍🎓 Created ${createdStudents.length} Students assigned to Teacher`);

    // 3. Create Assignments (Master Data)
    const assignments = await Assignment.insertMany([
      { auth_id: 'STUDENT-1', title: "Math Worksheet 11", subject: "Mathematics", dueDate: "2026-06-20", priority: "high" },
      { auth_id: 'STUDENT-1', title: "Science Project", subject: "Science", dueDate: "2026-06-25", priority: "medium" },
      { auth_id: 'STUDENT-2', title: "English Essay", subject: "English", dueDate: "2026-06-22", priority: "high" },
      { auth_id: 'STUDENT-2', title: "History Timeline", subject: "History", dueDate: "2026-06-28", priority: "medium" },
      { auth_id: 'STUDENT-3', title: "Biology Notes", subject: "Science", dueDate: "2026-06-21", priority: "low" }
    ]);

    // 4. Create Student Assignments (Submissions/Queue)
    await StudentAssignment.insertMany([
      { auth_id: 'STUDENT-1', assignment_id: assignments[0]._id, status: "pending", submissionText: "Attached my final draft for the math worksheet.", submittedDate: new Date() },
      { auth_id: 'STUDENT-1', assignment_id: assignments[1]._id, status: "approved", submissionText: "Uploaded the science project photos.", submittedDate: new Date(Date.now() - 86400000 * 2) },
      { auth_id: 'STUDENT-2', assignment_id: assignments[2]._id, status: "pending", submissionText: "Essay on climate change.", submittedDate: new Date() },
      { auth_id: 'STUDENT-2', assignment_id: assignments[3]._id, status: "not_submitted" },
      { auth_id: 'STUDENT-3', assignment_id: assignments[4]._id, status: "rejected", submissionText: "Short notes on biology.", rejectionNote: "Please expand on cell division.", submittedDate: new Date(Date.now() - 86400000 * 5) }
    ]);
    
    console.log('📝 Created Assignments & Submissions');

    // 5. Create Mood Logs for charts (using recent dates to fall into current month)
    const moodEntries = [];
    const moods = ['happy', 'okay', 'help', 'happy', 'happy', 'okay'];
    for (let i = 0; i < 15; i++) {
      moodEntries.push({
        auth_id: createdStudents[i % 3].auth_id,
        mood: moods[i % moods.length],
        date: new Date(Date.now() - 86400000 * i).toISOString().split('T')[0],
        note: "Feeling " + moods[i % moods.length]
      });
    }
    await MoodLog.insertMany(moodEntries);

    // 6. Create Journals
    await Journal.insertMany([
      { auth_id: 'STUDENT-1', title: "Great day!", content: "I finally understood algebra." },
      { auth_id: 'STUDENT-2', title: "Need focus", content: "Got distracted during study time today." },
      { auth_id: 'STUDENT-3', title: "Project done", content: "Finished the biology model! It looks awesome." }
    ]);
    
    console.log('❤️ Created Mood Logs & Journals');

    console.log('✅ Seeding complete! You can now login as teacher (auth_id: TEACHER-1, password: 123456) or student (STUDENT-1).');

  } catch (err) {
    console.error('❌ Error seeding data:', err.message);
  }
};

module.exports = seedData;

// If script is run directly from terminal (e.g. `node seedData.js`)
if (require.main === module) {
  require('dotenv').config();
  
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in .env file");
    process.exit(1);
  }

  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('✅ Connected to MongoDB for seeding...');
      await seedData();
      mongoose.connection.close();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ MongoDB Connection Error:', err.message);
      process.exit(1);
    });
}
