import Notification from "../models/Notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const { owner } = req.params;

    if (!owner) {
      return res.status(400).json({ error: "owner required" });
    }

    const notifications = await Notification.find({ owner })
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({
      owner,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const createNotification = async (payload) => {
  try {
    const notification = new Notification(payload);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const { owner, ids } = req.body;

    if (!owner || !ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "owner and ids array required" });
    }

    await Notification.updateMany(
      { _id: { $in: ids }, owner },
      { $set: { read: true } }
    );

    const unreadCount = await Notification.countDocuments({
      owner,
      read: false,
    });

    res.json({ ok: true, unreadCount });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    res.status(500).json({ error: "Failed to mark notifications read" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { owner } = req.params;

    if (!owner) {
      return res.status(400).json({ error: "owner required" });
    }

    const unreadCount = await Notification.countDocuments({
      owner,
      read: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};
