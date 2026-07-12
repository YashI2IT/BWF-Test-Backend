const Journal = require("../models/journal");
function validateStudentUpdate(data) {
  const errors = [];

  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  if (data.contactNumber && !/^\+?\d{10,15}$/.test(data.contactNumber)) {
    errors.push("Invalid phone number");
  }

  if (data.DOB && isNaN(Date.parse(data.DOB))) {
    errors.push("Invalid date of birth");
  }

  if (data.name && data.name.length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  return errors;
}

async function saveJournal(auth_id, { title, body, date }) {
  const entry = await Journal.findOneAndUpdate(
    { auth_id, date },        // one entry per day
    { title, body },
    { new: true, upsert: true }
  );

  return entry;
}

async function getJournal(auth_id) {
  const entries = await Journal.find({ auth_id })
    .sort({ date: -1 })
    .limit(3)
    .lean();

  return { entries };
}

module.exports = {
  validateStudentUpdate,
  saveJournal,
  getJournal
};

// const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: "uploads/",
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   }
// });

// const upload = multer({ storage });

// app.post("/upload-avatar", upload.single("avatar"), (req, res) => {
//   const fileUrl = `/uploads/${req.file.filename}`;

//   res.json({ url: fileUrl });
// });