import express from "express";
import {
  createMessage,
  getConversationMessages,
  getPersonalNotes,
  savePersonalNote,
  setIO,
  editMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

// Initialize IO instance for socket broadcasting
export const initializeIO = (io) => {
  setIO(io);
};

/**
 * GET /api/notes/:username
 * Fetch personal notes for a user (must come BEFORE generic routes)
 */
router.get("/notes/:username", getPersonalNotes);

/**
 * POST /api/notes
 * Save a personal note
 */
router.post("/notes", savePersonalNote);

/**
 * GET /api/messages?participant1=Alice&participant2=Bob
 * Fetch conversation messages between two participants
 */
router.get("/", getConversationMessages);

/**
 * POST /api/messages
 * Create a new message (text or task)
 */
router.post("/", createMessage);

/**
 * PUT /api/messages/:messageId/edit
 * Edit an existing message
 */
router.put("/:messageId/edit", editMessage);

export default router;
