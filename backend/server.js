import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import setupSocket from "./config/socketServer.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
setupSocket(server);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      // server started
    });
  } catch (error) {
    // failed to start server
    process.exit(1);
  }
};
startServer();
