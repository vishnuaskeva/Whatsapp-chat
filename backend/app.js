import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import messageRoutes from "./routes/message.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import taskDraftRoutes from "./routes/taskDraft.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { userStatus } from "./events/chat.events.js";

dotenv.config();

const app = express();

// CORS configuration to accept requests from any network
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from localhost, 127.0.0.1, and any IP address (for local network)
    if (!origin || origin.match(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.)/) || process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for local network testing
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/messages", messageRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/task-drafts", taskDraftRoutes);
app.use("/api/notifications", notificationRoutes);

// User status endpoint
app.get("/api/users/:username/status", (req, res) => {
  const { username } = req.params;
  const status = userStatus.get(username);
  
  if (!status) {
    return res.status(404).json({
      error: "User not found",
      username,
    });
  }
  
  res.status(200).json({
    username,
    isOnline: status.isOnline,
    lastSeen: status.lastSeen,
  });
});

// Return all user statuses (username -> { isOnline, lastSeen })
app.get("/api/users/statuses", (req, res) => {
  try {
    const all = {};
    for (const [username, status] of userStatus.entries()) {
      all[username] = status;
    }
    res.status(200).json({ statuses: all });
  } catch (err) {
    res.status(500).json({ error: "Failed to read statuses" });
  }
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

app.use((err, req, res, next) => {
  // error handler
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

export default app;
