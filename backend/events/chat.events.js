import { saveMessage } from '../controllers/message.controller.js';

/**
 * Setup chat event handlers for Socket.IO
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance for the connected client
 */
const chatEvents = (io, socket) => {
  /**
   * Handle incoming direct message from client
   * Event: "send_message"
   * Payload: { sender, recipient, content }
   */
  socket.on('send_message', async (messageData) => {
    try {
      const { sender, recipient, content, type = 'text', task } = messageData || {};

      if (!sender || !recipient) {
        console.error('Missing sender or recipient:', { sender, recipient });
        socket.emit('error', { message: 'Missing sender or recipient' });
        return;
      }

      if (type === 'text' && !content) {
        console.error('Missing content for text message');
        socket.emit('error', { message: 'Missing content for text message' });
        return;
      }

      if (type === 'task') {
        console.log('📋 BACKEND: Received task message:', {
          sender,
          recipient,
          conversationId: messageData.conversationId,
          hasTask: !!task,
          taskTitle: task?.title,
          taskScreensCount: task?.screens?.length,
          fullTask: JSON.stringify(task).substring(0, 500)
        });
        if (!task) {
          console.error('Missing task payload');
          socket.emit('error', { message: 'Missing task payload' });
          return;
        }
        if (!task.title) {
          console.error('Task missing title:', JSON.stringify(task).substring(0, 200));
          socket.emit('error', { message: 'Task missing title' });
          return;
        }
        if (!task.screens || task.screens.length === 0) {
          console.error('Task missing screens');
          socket.emit('error', { message: 'Task missing screens' });
          return;
        }
      }

      console.log(`💾 Saving ${type} message from ${sender} to ${recipient}`);
      const savedMessage = await saveMessage({ sender, recipient, content, type, task, conversationId: messageData.conversationId });
      console.log('✅ Message saved with ID:', savedMessage._id);
      if (type === 'task') {
        console.log('✅ Task message saved:', {
          _id: savedMessage._id,
          type: savedMessage.type,
          hasTask: !!savedMessage.task,
          taskTitle: savedMessage.task?.title
        });
      }
      console.log('Message type:', savedMessage.type, 'Has task:', !!savedMessage.task);

      io.emit('receive_message', {
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
    } catch (error) {
      console.error('Error handling send_message:', error);
      socket.emit('error', { message: 'Failed to send message', error: error.message });
    }
  });
};

export default chatEvents;
