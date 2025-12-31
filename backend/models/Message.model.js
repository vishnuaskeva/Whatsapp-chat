import mongoose from 'mongoose';

/**
 * Message Schema
 * Stores direct messages with sender, recipient, and conversationId
 */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true
    },
    recipient: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true
    },
    conversationId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const Message = mongoose.model('Message', messageSchema);

/**
 * PersonalNote Schema
 * Stores personal notes for each user
 */
const personalNoteSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      index: true
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const PersonalNote = mongoose.model('PersonalNote', personalNoteSchema);

export { Message as default, PersonalNote };
