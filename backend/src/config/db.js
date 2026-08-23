import mongoose from "mongoose";
import { seedData } from "../scripts/seed.js";
import User from "../models/User.js";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in .env");
  }

  mongoose.set("strictQuery", true);

  console.log(`Connecting to MongoDB Atlas...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ Connected to MongoDB Atlas successfully!");

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log("Seeding database with initial admin user...");
    await seedData();
  }
}
