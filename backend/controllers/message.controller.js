import Message, { PersonalNote } from '../models/Message.model.js';

const buildConversationId = (participantA, participantB) => {
  return [participantA, participantB].sort().join('::');
};

export const getConversationMessages = async (req, res) => {
  try {
    const { participant1, participant2 } = req.query;

    if (!participant1 || !participant2) {
      return res.status(400).json({
        error: 'Missing participants',
        message: 'participant1 and participant2 are required'
      });
    }

    const conversationId = buildConversationId(participant1, participant2);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch messages', 
      message: error.message 
    });
  }
};

export const getPersonalNotes = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        error: 'Missing username',
        message: 'username is required'
      });
    }

    const notes = await PersonalNote.find({ username })
      .sort({ createdAt: 1 });
    
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching personal notes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch personal notes', 
      message: error.message 
    });
  }
};

export const savePersonalNote = async (req, res) => {
  try {
    const { username, content } = req.body;

    if (!username || !content) {
      return res.status(400).json({
        error: 'Missing fields',
        message: 'username and content are required'
      });
    }

    const note = new PersonalNote({
      username,
      content
    });

    const savedNote = await note.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error('Error saving personal note:', error);
    res.status(500).json({ 
      error: 'Failed to save personal note', 
      message: error.message 
    });
  }
};

export const saveMessage = async ({ sender, recipient, content }) => {
  try {
    const conversationId = buildConversationId(sender, recipient);

    const message = new Message({
      sender,
      recipient,
      content,
      conversationId
    });

    const savedMessage = await message.save();
    return savedMessage;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};
