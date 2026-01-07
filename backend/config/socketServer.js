import { Server } from "socket.io";
import chatEvents from "../events/chat.events.js";
import { setIO } from "../controllers/message.controller.js";

/**
 * Setup Socket.IO server with CORS configuration
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for local network
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"], // Support both WebSocket and polling
  });

  // Make the io instance available to controllers that may emit via REST
  try {
    setIO(io);
  } catch (err) {
    // ignore if setIO not available
  }

  // Handle socket connections
  io.on("connection", (socket) => {
    // Initialize chat events
    chatEvents(io, socket);

    // Handle disconnection
    socket.on("disconnect", () => {
      // user disconnected
    });
  });

  return io;
};

export default setupSocket;
