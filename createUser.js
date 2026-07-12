const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");
const Hostel = require("./models/Hostel");
const Warden = require("./warden/models/warden");

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

async function createHostel({
  name = "A Block",
  location = "BWF Campus",
} = {}) {
  await connectDB();

  const hostel = await Hostel.findOneAndUpdate(
    { name },
    { name, location },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  console.log("Hostel ready:", {
    id: hostel._id.toString(),
    name: hostel.name,
    location: hostel.location,
  });

  return hostel;
}

async function createWarden({
  hostelId,
  name = "Warden User",
  auth_id = "warden1@bwf.com",
  password = "123456",
  phone = "9876543210",
  gender = "male",
  DOB = "1990-01-15",
  address = "BWF Campus Staff Quarters",
  qualification = "MSW",
  joiningDate = "2020-01-15",
  status = "Active",
} = {}) {
  await connectDB();

  if (!hostelId) {
    throw new Error("hostelId is required to create a warden");
  }

  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    throw new Error(`Hostel not found for id: ${hostelId}`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.findOneAndUpdate(
    { auth_id },
    {
      name,
      auth_id,
      password: hashedPassword,
      role: "warden",
    },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  const warden = await Warden.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      name,
      email: auth_id,
      hostelName: hostel._id, // keep same since your schema uses this
      phone,
      gender,
      DOB,
      address,
      qualification,
      joiningDate,
      status,
      emergencyContact: {
        name: "Emergency Contact",
        phone: "9876500000",
        relation: "Family",
      },
    },
    { returnDocument: "after", upsert: true, runValidators: true }
  ).populate("hostelName");

  console.log("Warden ready:", {
    id: warden._id.toString(),
    userId: user._id.toString(),
    name: warden.name,
    email: warden.email,
    hostel: {
      id: warden.hostelName._id.toString(),
      name: warden.hostelName.name,
      location: warden.hostelName.location,
    },
  });

  return { user, warden };
}

async function createHostelAndWarden() {
  const hostel = await createHostel({
    name: "A Block",
    location: "BWF Campus",
  });

  return createWarden({
    hostelId: hostel._id,
    name: "Warden User",
    auth_id: "warden@bwf.com",
    password: "123456",
    phone: "9876543210",
  });
}

async function runFromCli() {
  try {
    const command = process.argv[2] || "all";
    const hostelId = process.argv[3];

    if (command === "hostel") {
      await createHostel();
    } else if (command === "warden") {
      await createWarden({ hostelId });
    } else if (command === "all") {
      await createHostelAndWarden();
    } else {
      console.log("Usage:");
      console.log("  node createUser.js hostel");
      console.log("  node createUser.js warden <hostelId>");
      console.log("  node createUser.js all");
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runFromCli();
}

module.exports = {
  createHostel,
  createWarden,
  createHostelAndWarden,
};
