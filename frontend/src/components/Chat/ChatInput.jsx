import { useState } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined, PlusOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const ChatInput = ({ onSendMessage, onOpenTaskDraft, disabled }) => {
  const [messageText, setMessageText] = useState('');

  const handleSend = () => {
    if (disabled) return;

    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      padding: '12px 16px',
      backgroundColor: '#f0f0f0',
      borderTop: '1px solid #e5ddd5',
      gap: '12px'
    }}>
      <Button
        type="text"
        shape="circle"
        icon={<PlusOutlined style={{ fontSize: '18px', color: '#128C7E' }} />}
        onClick={onOpenTaskDraft}
        disabled={disabled}
      />

      <TextArea
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        autoSize={{ minRows: 1, maxRows: 3 }}
        style={{
          flex: 1,
          borderRadius: '20px',
          padding: '10px 15px',
          fontSize: '14px',
          border: '1px solid #ddd',
          backgroundColor: '#fff'
        }}
        disabled={disabled}
        variant="borderless"
      />
      
      <Button
        type="text"
        shape="circle"
        icon={<SendOutlined style={{ fontSize: '18px', color: '#25D366' }} />}
        onClick={handleSend}
        disabled={disabled}
      />
    </div>
  );
};

export default ChatInput;
