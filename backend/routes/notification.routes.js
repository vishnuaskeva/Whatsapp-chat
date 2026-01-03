import express from "express";
import {
  getNotifications,
  markNotificationsRead,
  getUnreadCount,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/mark-read", markNotificationsRead);
router.get("/unread/:owner", getUnreadCount);
router.get("/:owner", getNotifications);

export default router;
