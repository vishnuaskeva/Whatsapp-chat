import Message, { PersonalNote } from '../models/Message.model.js';

let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

const buildConversationId = (participantA, participantB) => [participantA, participantB].sort().join('::');

const persistMessage = async ({ sender, recipient, content, type = 'text', task, conversationId }) => {
  console.log('💾 DATABASE: Attempting to save message:', { sender, recipient, type, conversationId, hasTask: !!task });
  
  // Use provided conversationId or build from sender/recipient
  const finalConversationId = conversationId || buildConversationId(sender, recipient);

  if (type === 'task') {
    console.log('💾 DATABASE: Saving TASK message:', {
      sender,
      recipient,
      conversationId: finalConversationId,
      hasTask: !!task,
      taskTitle: task?.title,
      taskScreensCount: task?.screens?.length,
      fullTask: JSON.stringify(task).substring(0, 500)
    });
  }

  const message = new Message({
    sender,
    recipient,
    content: type === 'text' ? content : '',
    type,
    task: type === 'task' ? task : null,
    conversationId: finalConversationId,
  });

  const savedMessage = await message.save();
  
  if (type === 'task') {
    console.log('✅ DATABASE: Task message saved successfully:', {
      _id: savedMessage._id,
      type: savedMessage.type,
      hasTask: !!savedMessage.task,
      taskTitle: savedMessage.task?.title,
      conversationId: savedMessage.conversationId
    });
    
    // Verify the document actually in database
    const verifyDoc = await Message.findById(savedMessage._id);
    console.log('🔍 DATABASE VERIFICATION: Reading back from DB:', {
      _id: verifyDoc._id,
      type: verifyDoc.type,
      hasTask: !!verifyDoc.task,
      taskTitle: verifyDoc.task?.title,
      taskData: verifyDoc.task ? JSON.stringify(verifyDoc.task).substring(0, 300) : 'null'
    });
  }
  
  return savedMessage;
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
    console.log('Fetching messages for conversationId:', conversationId);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean(); // Use lean() to get plain JavaScript objects
    
    console.log(`Found ${messages.length} messages for conversation ${conversationId}`);
    const taskMsgs = messages.filter(m => m.type === 'task');
    console.log(`📊 FETCH STATS: ${taskMsgs.length} task messages out of ${messages.length} total`);
    
    messages.forEach((msg, idx) => {
      console.log(`  Message ${idx}: type=${msg.type}, sender=${msg.sender}, has_task=${!!msg.task}, has_id=${!!msg._id}`);
      if (msg.type === 'task') {
        console.log(`    🎯 Task details: title="${msg.task?.title}", screens=${msg.task?.screens?.length}, full_task_keys=${msg.task ? Object.keys(msg.task).join(',') : 'none'}`);
        console.log(`    🎯 Raw task data:`, JSON.stringify(msg.task).substring(0, 500));
      }
    });
    
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

export const createMessage = async (req, res) => {
  try {
    const { sender, recipient, content, type = 'text', task } = req.body;

    if (!sender || !recipient) {
      return res.status(400).json({ error: 'Missing sender/recipient', message: 'sender and recipient are required' });
    }

    if (type === 'text' && !content) {
      return res.status(400).json({ error: 'Missing content', message: 'content is required for text messages' });
    }

    if (type === 'task' && (!task || !task.title)) {
      return res.status(400).json({ error: 'Missing task payload', message: 'task with title is required for task messages' });
    }

    const savedMessage = await persistMessage({ sender, recipient, content, type, task });
    
    // Emit socket broadcast if IO instance is available
    if (ioInstance) {
      ioInstance.emit('receive_message', {
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
    }
    
    return res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({ error: 'Failed to create message', message: error.message });
  }
};

export const saveMessage = persistMessage;
