import { saveMessage } from "../controllers/message.controller.js";
import { createNotification } from "../controllers/notification.controller.js";

// Map to track user -> set of socketIds (supports multiple tabs/devices)
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
    // Track multiple sockets per username
    const sockets = userSockets.get(username) || new Set();
    sockets.add(socket.id);
    userSockets.set(username, sockets);
    socket.join(username);

    // Mark user as online (first connected or additional connection)
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
    const { conversationId, username } = data || {};
    if (!conversationId) return;
    socket.join(conversationId);

    // If a username is provided, mark pending 'sent' messages to this user as 'delivered'
    // and notify the original senders so their UI can show double ticks.
    if (username) {
      (async () => {
        try {
          const Message = (await import("../models/Message.model.js")).default;
          const pending = await Message.find({
            conversationId,
            recipient: username,
            status: "sent",
          });

          if (pending && pending.length) {
            for (const msg of pending) {
              msg.status = "delivered";
              await msg.save();
              // Notify the sender's sockets
              io.to(msg.sender).emit("message_status", {
                _id: msg._id,
                status: "delivered",
                conversationId,
              });
            }
          }
        } catch (err) {
          // ignore errors here to avoid crashing socket
        }
      })();
    }
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

  /**
   * Mark messages as read in a conversation for a given user
   * Event: "mark_as_read"
   * Payload: { conversationId, username }
   */
  socket.on("mark_as_read", async (data) => {
    const { conversationId, username } = data || {};
    if (!conversationId || !username) return;

    try {
      const Message = (await import("../models/Message.model.js")).default;
      const toMark = await Message.find({
        conversationId,
        recipient: username,
        status: { $ne: "read" },
      });

      if (toMark && toMark.length) {
        for (const msg of toMark) {
          msg.status = "read";
          await msg.save();
          // notify sender(s)
          io.to(msg.sender).emit("message_status", {
            _id: msg._id,
            status: "read",
            conversationId,
          });
        }
      }
    } catch (err) {
      // ignore
    }
  });

  socket.on("disconnect", () => {
    for (const [user, sockets] of userSockets.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
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
        } else {
          // update map
          userSockets.set(user, sockets);
        }

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

      // Emit only to the conversation room (avoids broadcasting to unrelated clients)
      const convId = messageData.conversationId || [sender, recipient].sort().join("::");
      // Preserve any client-generated `tempId` so sender can reconcile optimistic UI
      io.to(convId).emit("receive_message", {
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
        status: savedMessage.status || "sent", // Track message status
        tempId: messageData.tempId || null,
      });

      // If recipient currently has a socket in the conversation room, mark delivered now
      try {
        const socketsInRoom = await io.in(convId).allSockets();
        const recipientSockets = userSockets.get(recipient) || new Set();
        const hasRecipientInRoom = [...recipientSockets].some((sId) => socketsInRoom.has(sId));
        if (hasRecipientInRoom) {
          // mark DB and notify sender
          const Message = (await import("../models/Message.model.js")).default;
          const msg = await Message.findById(savedMessage._id);
          if (msg && msg.status !== "delivered") {
            msg.status = "delivered";
            await msg.save();
            io.to(msg.sender).emit("message_status", {
              _id: msg._id,
              status: "delivered",
              conversationId: convId,
            });
          }
        }
      } catch (err) {
        // ignore
      }
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
        io.to(convId).emit("message_deleted_for_everyone", { 
          messageId,
          conversationId: convId,
        });
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

      // Emit forwarded message only to the target conversation room
      io.to(convId).emit("receive_message", receivePayload);

      socket.emit("message_forwarded", { messageId, forwardedTo: toRecipient });
    } catch (error) {
      socket.emit("error", { message: "Failed to forward message" });
    }
  });
};

export { chatEvents as default, userStatus };
