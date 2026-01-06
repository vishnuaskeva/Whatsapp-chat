import mongoose from "mongoose";

/**
 * Message Schema
 * Stores direct messages with sender, recipient, and conversationId
 */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: [true, "Sender name is required"],
      trim: true,
    },
    recipient: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },
    content: {
      type: String,
      trim: true,
      required() {
        return this.type === "text";
      },
    },
    // Optional attachments uploaded to Cloudinary (images, files, etc.)
    attachments: [
      {
        url: { type: String },
        secureUrl: { type: String },
        publicId: { type: String },
        filename: { type: String },
        mimeType: { type: String },
        size: { type: Number },
        resourceType: { type: String }, // 'image' | 'raw' | 'video'
        provider: { type: String, default: 'cloudinary' },
      },
    ],
    type: {
      type: String,
      enum: ["text", "task"],
      default: "text",
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    // Reply-to feature: reference to the message being replied to
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    // Delete for me: array of usernames who deleted for themselves
    deletedFor: {
      type: [String],
      default: [],
    },
    // Delete for everyone: true if sender deleted for all
    isDeletedEveryone: {
      type: Boolean,
      default: false,
    },
    // Forwarded from: reference to original message if forwarded
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

/**
 * PersonalNote Schema
 * Stores personal notes for each user
 */
const personalNoteSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Note content is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const PersonalNote = mongoose.model("PersonalNote", personalNoteSchema);

export { Message as default, PersonalNote };
