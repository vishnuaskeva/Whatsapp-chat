import { saveMessage } from "../controllers/message.controller.js";
import { createNotification } from "../controllers/notification.controller.js";

// Map to track user -> socketId
const userSockets = new Map();

/**
 * Setup chat event handlers for Socket.IO
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance for the connected client
 */
const chatEvents = (io, socket) => {
  /**
   * Register user on connection
   * Event: "register_user"
   * Payload: { username }
   */
  socket.on("register_user", (username) => {
    if (!username) return;
    userSockets.set(username, socket.id);
    socket.join(username); // join room named by username
    console.log(`📍 User registered: ${username} (socket: ${socket.id})`);
  });

  socket.on("disconnect", () => {
    // Remove user from mapping on disconnect
    for (const [user, id] of userSockets.entries()) {
      if (id === socket.id) {
        userSockets.delete(user);
        console.log(`📍 User disconnected: ${user}`);
        break;
      }
    }
  });
  /**
   * Handle incoming direct message from client
   * Event: "send_message"
   * Payload: { sender, recipient, content }
   */
  socket.on("send_message", async (messageData) => {
    try {
      const {
        sender,
        recipient,
        content,
        type = "text",
        task,
      } = messageData || {};

      if (!sender || !recipient) {
        socket.emit("error", { message: "Missing sender or recipient" });
        return;
      }

      if (type === "text" && !content) {
        socket.emit("error", { message: "Missing content for text message" });
        return;
      }

      if (type === "task") {
        if (!task) {
          socket.emit("error", { message: "Missing task payload" });
          return;
        }
        if (!task.title) {
          socket.emit("error", { message: "Task missing title" });
          return;
        }
        if (!task.screens || task.screens.length === 0) {
          socket.emit("error", { message: "Task missing screens" });
          return;
        }
      }

      const savedMessage = await saveMessage({
        sender,
        recipient,
        content,
        type,
        task,
        conversationId: messageData.conversationId,
      });

      io.emit("receive_message", {
        _id: savedMessage._id,
        sender: savedMessage.sender,
        recipient: savedMessage.recipient,
        content: savedMessage.content,
        type: savedMessage.type,
        task: savedMessage.task,
        conversationId: savedMessage.conversationId,
        createdAt: savedMessage.createdAt,
        updatedAt: savedMessage.updatedAt,
      });

      // Create and emit notification to recipient
      const notificationPayload = {
        owner: recipient,
        actor: sender,
        type: type === "task" ? "task" : "message",
        title:
          type === "task"
            ? `New task from ${sender}`
            : `Message from ${sender}`,
        body: type === "task" ? task?.title : content,
        read: false,
        data: {
          messageId: savedMessage._id,
          conversationId: savedMessage.conversationId,
          sender,
        },
      };

      await createNotification(notificationPayload);
      io.to(recipient).emit("notification", notificationPayload);
    } catch (error) {
      socket.emit("error", {
        message: "Failed to send message",
        error: error.message,
      });
    }
  });
};

export default chatEvents;
