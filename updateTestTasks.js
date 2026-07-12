require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./student/models/Task');
const Teacher = require('./teacher/models/teacher');

const replacementData = [
  {
    title: 'Submit Science Fair Proposal',
    description: 'Write a 1-page proposal outlining your hypothesis and experiment for the regional science fair.'
  },
  {
    title: 'Math Olympiad Registration',
    description: 'Fill out the regional registration form and submit the parent consent signature.'
  },
  {
    title: 'Submit Art Portfolio',
    description: 'Upload your 5 best sketches to the school art portal for the upcoming state competition.'
  },
  {
    title: 'Volunteer at Library',
    description: 'Complete your mandatory 2 hours of volunteering at the school library organizing the history section.'
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bwf')
.then(async () => {
  const tasks = await Task.find({});
  let teacherId = null;
  const teacher = await Teacher.findOne();
  if (teacher) teacherId = teacher._id;
  
  // Create missing tasks if there are less than 4
  if (tasks.length < 4) {
    for (let i = tasks.length; i < 4; i++) {
      const newTask = new Task({
        title: replacementData[i].title,
        description: replacementData[i].description,
        dueDate: '2026-07-' + (10 + i),
        assignedTo: 'STU001',
        assignedBy: teacherId,
        status: 'pending'
      });
      await newTask.save();
      console.log(`Created new task ${i + 1}`);
    }
  }
  
  console.log('Done ensuring 4 tasks!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
