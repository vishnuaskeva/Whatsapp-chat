import mongoose from "mongoose";

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    const dbName = conn.connection.db.databaseName;
    const dbHost = conn.connection.host;
    const dbPort = conn.connection.port;
    console.log(`\n✅ MongoDB Connected Successfully!`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Host: ${dbHost}:${dbPort}`);
    console.log(`   Status: Connected\n`);
    return conn;
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed!`);
    console.error(`   Error: ${error.message}\n`);
    process.exit(1);
  }
};

export default connectDB;
