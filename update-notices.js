const mongoose = require('mongoose');
const Notice = require('./student/models/Notice');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({ role: 'teacher' });
  console.log('Teachers:', users.map(u => ({ id: u._id, name: u.name })));
  
  const notices = await Notice.find({ authorRole: 'teacher', authorName: { $exists: false } });
  console.log('Notices without authorName:', notices.length);
  
  if (users.length > 0 && notices.length > 0) {
    const teacherName = users[0].name;
    const res = await Notice.updateMany({ authorRole: 'teacher', authorName: { $exists: false } }, { $set: { authorName: teacherName } });
    console.log('Updated notices:', res);
  }
  process.exit();
}).catch(console.error);
