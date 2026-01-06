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

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
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
