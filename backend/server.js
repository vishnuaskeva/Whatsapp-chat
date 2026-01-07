import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import setupSocket from "./config/socketServer.js";

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
setupSocket(server);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, HOST, () => {
      // server started
    });
  } catch (error) {
    // failed to start server
    process.exit(1);
  }
};
startServer();
