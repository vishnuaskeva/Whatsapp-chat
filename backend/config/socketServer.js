import { Server } from 'socket.io';
import chatEvents from '../events/chat.events.js';

/**
 * Setup Socket.IO server with CORS configuration
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Initialize chat events
    chatEvents(io, socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export default setupSocket;
