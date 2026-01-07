import { io } from "socket.io-client";

/**
 * Get socket URL from environment variable or derive from window location
 * This allows the app to work from any IP on the network
 */
const getSocketUrl = () => {
  // If VITE_SOCKET_URL is set and not empty, use it
  if (import.meta.env.VITE_SOCKET_URL && import.meta.env.VITE_SOCKET_URL.trim()) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // Auto-detect: use current host with port 5000
  // This works for localhost, 192.168.x.x, and any network IP
  if (typeof window !== "undefined" && window.location) {
    const protocol = window.location.protocol; // http: or https:
    const host = window.location.hostname; // IP or localhost
    return `${protocol}//${host}:5000`;
  }

  // Fallback for development
  return "http://localhost:5000";
};

/**
 * Initialize Socket.IO client connection
 * @returns {Object} Socket instance
 */
const socket = io(getSocketUrl(), {
  autoConnect: false, // Manual connection control
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  transports: ["websocket", "polling"], // Support both WebSocket and polling
});

export default socket;
