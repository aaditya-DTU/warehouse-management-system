import mongoose from "mongoose";


const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log("MongoDB connection skipped: MONGO_URI is not configured.");
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    console.log("MongoDB connection failed", error.message);
    return false;
  }
};

export default connectDB;
