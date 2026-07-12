const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const fs = require('fs');
require('dotenv').config();

const User = require('./models/User');
const Student = require('./student/models/student');
const Staff = require('./warden/models/staff');
const Hostel = require('./models/Hostel');

const files = [
  { file: "Present List of Children at Kupwara home.xlsx", type: "student", hostel: "Kupwara Home" },
  { file: "Present List of Staff at Anantnag Home Home.xlsx", type: "staff", hostel: "Anantnag Home" },
  { file: "Present List of Staff at Kupwara Home.xlsx", type: "staff", hostel: "Kupwara Home" },
  { file: "Staff-list.xlsx", type: "staff", hostel: "Jammu Home" },
  { file: "Studentslistapril2026.xlsx", type: "student", hostel: "Jammu Home" },
  { file: "present list of Anantnag students.xlsx", type: "student", hostel: "Anantnag Home" },
  { file: "present staff list Beerwah home.xlsx", type: "staff", hostel: "Beerwah Home" },
  { file: "present student list of Beerwah home.xlsx", type: "student", hostel: "Beerwah Home" }
];

async function importData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    console.log("Clearing existing User, Student, and Staff collections...");
    await User.deleteMany({ role: { $in: ['student', 'staff'] } });
    await Student.deleteMany({});
    await Staff.deleteMany({});
    
    // Create or find Hostels
    const hostels = {};
    for (const f of files) {
      let h = await Hostel.findOne({ name: f.hostel });
      if (!h) {
        h = await Hostel.create({ name: f.hostel, location: f.hostel });
      }
      hostels[f.hostel] = h._id;
    }

    const defaultPassword = await bcrypt.hash('Bwf@2026', 10);
    let studentCounter = 1;
    let staffCounter = 1;

    for (const item of files) {
      const filePath = `d:/BWF/BWF/${item.file}`;
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }
      
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // Convert to array of arrays
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      // Find the header row (it's usually row 1 or row 2, we just look for "Name" or "name")
      let headerRowIndex = 0;
      let nameCol = -1;
      let ageCol = -1;
      let classCol = -1;
      let desigCol = -1;
      let parentageCol = -1;
      let addrCol = -1;
      
      for (let i = 0; i < 5 && i < data.length; i++) {
        const row = data[i];
        if (!row) continue;
        for (let j = 0; j < row.length; j++) {
          if (typeof row[j] === 'string' && row[j].toLowerCase().includes('name')) {
            headerRowIndex = i;
            break;
          }
        }
        if (headerRowIndex === i) break;
      }
      
      const headers = data[headerRowIndex] || [];
      headers.forEach((h, idx) => {
        if (!h || typeof h !== 'string') return;
        const low = h.toLowerCase().trim();
        if (low.includes('name')) nameCol = idx;
        if (low.includes('age')) ageCol = idx;
        if (low.includes('class')) classCol = idx;
        if (low.includes('designation')) desigCol = idx;
        if (low.includes('parentage')) parentageCol = idx;
        if (low.includes('address') || low.includes('adress')) addrCol = idx;
      });

      console.log(`Processing ${item.file} as ${item.type}...`);
      
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[nameCol] || typeof row[nameCol] !== 'string') continue;
        
        const name = row[nameCol].trim();
        const age = parseInt(row[ageCol]) || 15; // default 15
        const DOB = new Date(new Date().getFullYear() - age, 0, 1);
        const parentage = parentageCol >= 0 ? row[parentageCol] : '';
        const address = addrCol >= 0 ? row[addrCol] : '';
        
        if (item.type === 'student') {
          const auth_id = `STU${String(studentCounter++).padStart(3, '0')}`;
          
          const user = await User.create({
            name,
            auth_id,
            password: defaultPassword,
            role: 'student',
            hostelName: hostels[item.hostel]
          });
          
          await Student.create({
            userId: user._id,
            auth_id,
            name,
            DOB,
            class: classCol >= 0 ? row[classCol] : '',
            address,
            hostelName: hostels[item.hostel],
            trustedPerson: { name: parentage },
            email: `${auth_id.toLowerCase()}@bwf.org`,
            contactNumber: "0000000000",
            gender: "other"
          });
          
        } else if (item.type === 'staff') {
          const auth_id = `STAFF${String(staffCounter++).padStart(3, '0')}`;
          const designation = desigCol >= 0 ? row[desigCol] : 'Staff';
          
          const user = await User.create({
            name,
            auth_id,
            password: defaultPassword,
            role: 'staff',
            hostelName: hostels[item.hostel]
          });
          
          await Staff.create({
            userId: user._id,
            auth_id,
            name,
            gender: 'other',
            email: `${auth_id.toLowerCase()}@bwf.org`,
            contactNumber: "0000000000",
            DOB,
            roleName: designation,
            address,
            hostelName: hostels[item.hostel],
            joiningDate: new Date()
          });
        }
      }
    }
    
    console.log(`Inserted ${studentCounter - 1} students and ${staffCounter - 1} staff.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

importData();
