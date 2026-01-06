import { saveMessage } from "../controllers/message.controller.js";
import { createNotification } from "../controllers/notification.controller.js";

// Map to track user -> socketId
const userSockets = new Map();

// Map to track user online status and last seen
const userStatus = new Map(); // { username -> { isOnline: bool, lastSeen: timestamp } }

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
    socket.join(username);
    
    // Mark user as online
    userStatus.set(username, { isOnline: true, lastSeen: new Date().toISOString() });
    
    // Broadcast online status to all clients
    io.emit("user_status_changed", {
      username,
      isOnline: true,
      lastSeen: userStatus.get(username).lastSeen,
    });
  });

  /**
   * Join conversation room
   * Event: "join_conversation"
   * Payload: { conversationId }
   */
  socket.on("join_conversation", (data) => {
    const { conversationId } = data || {};
    if (!conversationId) return;
    socket.join(conversationId);
  });

  /**
   * Leave conversation room
   * Event: "leave_conversation"
   * Payload: { conversationId }
   */
  socket.on("leave_conversation", (data) => {
    const { conversationId } = data || {};
    if (!conversationId) return;
    socket.leave(conversationId);
  });

  socket.on("disconnect", () => {
    for (const [user, id] of userSockets.entries()) {
      if (id === socket.id) {
        userSockets.delete(user);
        
        // Mark user as offline and record last seen
        const lastSeen = new Date().toISOString();
        userStatus.set(user, { isOnline: false, lastSeen });
        
        // Broadcast offline status to all clients
        io.emit("user_status_changed", {
          username: user,
          isOnline: false,
          lastSeen,
        });
        
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
        replyTo: messageData.replyTo || null,
        forwardedFrom: messageData.forwardedFrom || null,
      });

      io.emit("receive_message", {
        _id: savedMessage._id,
        sender: savedMessage.sender,
        recipient: savedMessage.recipient,
        content: savedMessage.content,
        type: savedMessage.type,
        task: savedMessage.task,
        conversationId: savedMessage.conversationId,
        replyTo: savedMessage.replyTo || null,
        forwardedFrom: savedMessage.forwardedFrom || null,
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

  /**
   * Typing indicator event
   * Event: "user_typing"
   * Payload: { username, conversationId }
   */
  socket.on("user_typing", (data) => {
    const { username, conversationId } = data || {};
    if (!username || !conversationId) return;
    io.to(conversationId).emit("typing_indicator", {
      username,
      isTyping: true,
    });
  });

  /**
   * Typing stopped event
   * Event: "user_stopped_typing"
   * Payload: { username, conversationId }
   */
  socket.on("user_stopped_typing", (data) => {
    const { username, conversationId } = data || {};
    if (!username || !conversationId) return;
    io.to(conversationId).emit("typing_indicator", {
      username,
      isTyping: false,
    });
  });

  /**
   * Delete message for me
   * Event: "delete_message_for_me"
   * Payload: { messageId, username }
   */
  socket.on("delete_message_for_me", async (data) => {
    const { messageId, username } = data || {};
    if (!messageId || !username) return;

    try {
      const Message = (await import("../models/Message.model.js")).default;
      await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { deletedFor: username } },
        { new: true }
      );
      io.to(username).emit("message_deleted_for_me", { messageId });
    } catch (error) {
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

  /**
   * Delete message for everyone
   * Event: "delete_message_for_everyone"
   * Payload: { messageId, sender }
   */
  socket.on("delete_message_for_everyone", async (data) => {
    const { messageId, sender } = data || {};
    if (!messageId || !sender) return;

    try {
      const Message = (await import("../models/Message.model.js")).default;
      const msg = await Message.findByIdAndUpdate(
        messageId,
        { isDeletedEveryone: true },
        { new: true }
      );
      if (msg) {
        const convId = msg.conversationId;
        io.to(convId).emit("message_deleted_for_everyone", { messageId });
      }
    } catch (error) {
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

  /**
   * Forward message
   * Event: "forward_message"
   * Payload: { messageId, toRecipient, fromSender }
   */
  socket.on("forward_message", async (data) => {
    const { messageId, toRecipient, fromSender } = data || {};
    if (!messageId || !toRecipient || !fromSender) return;

    try {
      const Message = (await import("../models/Message.model.js")).default;
      const originalMsg = await Message.findById(messageId);
      if (!originalMsg) return;

      const forwardedMsg = new Message({
        sender: fromSender,
        recipient: toRecipient,
        content: originalMsg.content,
        type: originalMsg.type,
        task: originalMsg.task,
        attachments: originalMsg.attachments,
        conversationId: [fromSender, toRecipient].sort().join("::"),
        forwardedFrom: messageId,
      });
      await forwardedMsg.save();

      const convId = forwardedMsg.conversationId;
      const receivePayload = {
        _id: forwardedMsg._id,
        sender: forwardedMsg.sender,
        recipient: forwardedMsg.recipient,
        content: forwardedMsg.content,
        type: forwardedMsg.type,
        task: forwardedMsg.task,
        forwardedFrom: forwardedMsg.forwardedFrom,
        conversationId: forwardedMsg.conversationId,
        createdAt: forwardedMsg.createdAt,
      };

      io.to(convId).emit("receive_message", receivePayload);

      // Also emit to the forwarding user so they see the forwarded message in their UI
      io.to(fromSender).emit("receive_message", receivePayload);

      socket.emit("message_forwarded", { messageId, forwardedTo: toRecipient });
    } catch (error) {
      socket.emit("error", { message: "Failed to forward message" });
    }
  });
};

export { chatEvents as default, userStatus };
