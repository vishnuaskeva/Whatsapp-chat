import express from 'express';
import { getConversationMessages, getPersonalNotes, savePersonalNote } from '../controllers/message.controller.js';

const router = express.Router();

/**
 * GET /api/notes/:username
 * Fetch personal notes for a user (must come BEFORE generic routes)
 */
router.get('/notes/:username', getPersonalNotes);

/**
 * POST /api/notes
 * Save a personal note
 */
router.post('/notes', savePersonalNote);

/**
 * GET /api/messages?participant1=Alice&participant2=Bob
 * Fetch conversation messages between two participants
 */
router.get('/', getConversationMessages);

export default router;
