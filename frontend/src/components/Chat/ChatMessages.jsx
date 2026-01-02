import { useEffect, useRef } from 'react';
import { Spin, Empty, Typography } from 'antd';
import ChatMessage from './ChatMessage';
import bgImage from '../../assets/image.png';

const { Text } = Typography;

const ChatMessages = ({ messages, currentUser, loading, selectedContact }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getDateLabel = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const shouldShowDateSeparator = (current, previous) => {
    if (!previous) return true;
    return getDateLabel(current.createdAt) !== getDateLabel(previous.createdAt);
  };

  if (!selectedContact) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E5DDD5'
      }}>
        <Empty description="Select a contact to start chatting" />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ECE5DD'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: '500px 500px',
      backgroundRepeat: 'repeat',
      backgroundAttachment: 'scroll'
    }}>
      {messages.length === 0 ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}>
          <Empty description="No messages yet. Start the conversation!" />
        </div>
      ) : (
        messages.map((message, index) => {
          // Check if sender changed from previous message
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const senderChanged = !previousMessage || previousMessage.sender !== message.sender;
          const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
          const messageKey = message._id ? `${message._id}` : `temp-${index}-${message.sender}-${message.createdAt}`;
          
          return (
            <div key={messageKey}>
              {showDateSeparator && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: index === 0 ? '8px' : '16px',
                  marginBottom: '16px'
                }}>
                  <Text style={{
                    fontSize: '12px',
                    color: '#999',
                    backgroundColor: '#f0f0f0',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}>
                    {getDateLabel(message.createdAt)}
                  </Text>
                </div>
              )}
              <ChatMessage
                message={message}
                currentUser={currentUser}
                showSenderName={senderChanged}
              />
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
