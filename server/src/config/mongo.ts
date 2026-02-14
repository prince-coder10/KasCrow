import mongoose from "mongoose";

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING || "";

export const connectDB = async () => {
  try {
    await mongoose.connect(mongoConnectionString);
    console.log("🟢 Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
