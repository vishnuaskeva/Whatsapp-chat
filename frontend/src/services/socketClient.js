import { io } from "socket.io-client";

/**
 * Initialize Socket.IO client connection
 * @returns {Object} Socket instance
 */
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false, // Manual connection control
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

export default socket;
