import { useState } from 'react';
import { Input, Button, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const ChatInput = ({ onSendMessage, disabled }) => {
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
        bordered={false}
      />
      
      <Space size={4}>
        <Button
          type="text"
          shape="circle"
          icon={<SendOutlined style={{ fontSize: '18px', color: '#25D366' }} />}
          onClick={handleSend}
          disabled={disabled}
        />
      </Space>
    </div>
  );
};

export default ChatInput;
