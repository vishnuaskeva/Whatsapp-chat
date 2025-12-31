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
      if (!messageData?.sender || !messageData?.recipient || !messageData?.content) {
        socket.emit('error', { message: 'Missing sender, recipient, or content' });
        return;
      }

      const message = {
        sender: messageData.sender,
        recipient: messageData.recipient,
        content: messageData.content
      };

      // Save message to MongoDB
      const savedMessage = await saveMessage(message);

      // Emit saved message to all connected clients (clients filter by participant)
      io.emit('receive_message', {
        _id: savedMessage._id,
        sender: savedMessage.sender,
        recipient: savedMessage.recipient,
        content: savedMessage.content,
        conversationId: savedMessage.conversationId,
        createdAt: savedMessage.createdAt,
        updatedAt: savedMessage.updatedAt
      });

      console.log(`Message ${savedMessage.sender} -> ${savedMessage.recipient}: ${savedMessage.content}`);
    } catch (error) {
      console.error('Error handling send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};

export default chatEvents;
