import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // MongoDB connected
  } catch (error) {
    // connection error
    process.exit(1);
  }
};

export default connectDB;
