import Message, { PersonalNote } from "../models/Message.model.js";

let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

const buildConversationId = (participantA, participantB) =>
  [participantA, participantB].sort().join("::");

const persistMessage = async ({
  sender,
  recipient,
  content,
  type = "text",
  task,
  conversationId,
  replyTo = null,
  forwardedFrom = null,
}) => {
  // Use provided conversationId or build from sender/recipient
  const finalConversationId =
    conversationId || buildConversationId(sender, recipient);

  if (type === "task") {
    // saving task message
  }

  const message = new Message({
    sender,
    recipient,
    content: type === "text" ? content : "",
    type,
    task: type === "task" ? task : null,
    conversationId: finalConversationId,
    replyTo,
    forwardedFrom,
  });

  const savedMessage = await message.save();

  if (type === "task") {
    // task saved
    // Optionally verify document in DB if needed
  }

  return savedMessage;
};

export const getConversationMessages = async (req, res) => {
  try {
    const { participant1, participant2 } = req.query;

    if (!participant1 || !participant2) {
      return res.status(400).json({
        error: "Missing participants",
        message: "participant1 and participant2 are required",
      });
    }

    const conversationId = buildConversationId(participant1, participant2);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean(); // Use lean() to get plain JavaScript objects

    const taskMsgs = messages.filter((m) => m.type === "task");

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch messages",
      message: error.message,
    });
  }
};

export const getPersonalNotes = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        error: "Missing username",
        message: "username is required",
      });
    }

    const notes = await PersonalNote.find({ username }).sort({ createdAt: 1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch personal notes",
      message: error.message,
    });
  }
};

export const savePersonalNote = async (req, res) => {
  try {
    const { username, content } = req.body;

    if (!username || !content) {
      return res.status(400).json({
        error: "Missing fields",
        message: "username and content are required",
      });
    }

    const note = new PersonalNote({
      username,
      content,
    });

    const savedNote = await note.save();
    res.status(201).json(savedNote);
  } catch (error) {
    res.status(500).json({
      error: "Failed to save personal note",
      message: error.message,
    });
  }
};

export const createMessage = async (req, res) => {
  try {
    const { sender, recipient, content, type = "text", task } = req.body;

    if (!sender || !recipient) {
      return res
        .status(400)
        .json({
          error: "Missing sender/recipient",
          message: "sender and recipient are required",
        });
    }

    if (type === "text" && !content) {
      return res
        .status(400)
        .json({
          error: "Missing content",
          message: "content is required for text messages",
        });
    }

    if (type === "task" && (!task || !task.title)) {
      return res
        .status(400)
        .json({
          error: "Missing task payload",
          message: "task with title is required for task messages",
        });
    }

    const savedMessage = await persistMessage({
      sender,
      recipient,
      content,
      type,
      task,
    });

    // Emit socket broadcast if IO instance is available
    if (ioInstance) {
      ioInstance.emit("receive_message", {
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
    }

    return res.status(201).json(savedMessage);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to create message", message: error.message });
  }
};

export const saveMessage = persistMessage;

export const editMessage = async (req, res) => {
  try {
    const { messageId, content, sender } = req.body;

    if (!messageId || !content || !sender) {
      return res.status(400).json({
        error: "Missing fields",
        message: "messageId, content, and sender are required",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can edit their message
    if (message.sender !== sender) {
      return res.status(403).json({ error: "Only sender can edit message" });
    }

    message.content = content;
    message.editedAt = new Date();
    const updated = await message.save();

    // Emit socket event to notify clients of edited message
    if (ioInstance) {
      ioInstance.emit("message_edited", {
        _id: updated._id,
        content: updated.content,
        editedAt: updated.editedAt,
        conversationId: updated.conversationId,
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({
      error: "Failed to edit message",
      message: error.message,
    });
  }
};
