require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./student/models/Task');
const Teacher = require('./teacher/models/teacher');

const newTasksData = [
  {
    title: 'History Museum Permission Slip',
    description: 'Get your permission slip signed and submitted for the upcoming historical museum field trip.',
    assignedTo: 'STU002',
    status: 'completed',
    dueDate: '2026-07-15'
  },
  {
    title: 'Return Overdue Books',
    description: 'Return the overdue biology textbooks to the main library to clear your account.',
    assignedTo: 'STU003',
    status: 'completed',
    dueDate: '2026-07-12'
  },
  {
    title: 'Submit Scholarship Essay',
    description: 'Complete and submit your 500-word essay for the Alumni Association Scholarship.',
    assignedTo: 'STU004',
    status: 'completed',
    dueDate: '2026-07-20'
  },
  {
    title: 'Choir Audition Form',
    description: 'Submit your vocal range declaration form before the fall auditions.',
    assignedTo: 'STU005',
    status: 'pending',
    dueDate: '2026-08-01'
  },
  {
    title: 'Basketball Tryout Waiver',
    description: 'Complete the medical waiver required for basketball tryouts next week.',
    assignedTo: 'STU002',
    status: 'pending',
    dueDate: '2026-07-18'
  }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bwf')
.then(async () => {
  let teacherId = null;
  const teacher = await Teacher.findOne();
  if (teacher) teacherId = teacher._id;
  
  for (const t of newTasksData) {
    const newTask = new Task({
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      assignedTo: t.assignedTo,
      assignedBy: teacherId,
      status: t.status
    });
    await newTask.save();
    console.log(`Created new task: ${t.title}`);
  }
  
  console.log('Successfully added 5 new mock tasks!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
