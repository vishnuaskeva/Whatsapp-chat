/**
 * Get API base URL from environment variable or derive from window location
 * This allows the app to work from any IP on the network (localhost, 192.168.x.x, etc.)
 */
export const getApiBaseUrl = () => {
  // If VITE_API_URL is set and not empty, use it
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Auto-detect: use current host with port 5000 and /api path
  // This works for localhost, 192.168.x.x, and any network IP
  if (typeof window !== "undefined" && window.location) {
    const protocol = window.location.protocol; // http: or https:
    const host = window.location.hostname; // IP or localhost
    return `${protocol}//${host}:5000/api`;
  }

  // Fallback for development
  return "http://localhost:5000/api";
};

/**
 * Get socket URL from environment variable or derive from window location
 */
export const getSocketUrl = () => {
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
