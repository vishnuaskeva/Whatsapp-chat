import { List, Avatar, Typography } from 'antd';

const { Text } = Typography;

const ChatListItem = ({ contactName, active, onSelect, unreadCount = 0, lastMessage = '', messageTimestamp }) => {
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Now';
    
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    const daysSince = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
    if (daysSince < 7) {
      return messageDate.toLocaleString('en-US', { weekday: 'short' });
    }
    
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <List.Item
      onClick={onSelect}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        backgroundColor: active ? '#f5f5f5' : '#fff',
        borderBottom: '1px solid #f0f0f0',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => !active && (e.currentTarget.style.backgroundColor = '#f5f5f5')}
      onMouseLeave={(e) => !active && (e.currentTarget.style.backgroundColor = '#fff')}
    >
      <List.Item.Meta
        avatar={(
          <Avatar 
            size={56} 
            style={{ 
              backgroundColor: '#e0e0e0',
              color: '#666',
              fontWeight: 'bold'
            }}
          >
            {contactName.charAt(0).toUpperCase()}
          </Avatar>
        )}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ fontSize: '15px', color: '#000', flex: 1 }}>
              {contactName}
            </Text>
            <Text style={{ fontSize: '12px', color: '#999' }}>
              {formatTimestamp(messageTimestamp)}
            </Text>
          </div>
        }
        description={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <Text 
              ellipsis 
              style={{ 
                fontSize: '13px', 
                color: '#999',
                display: 'block',
                flex: 1
              }}
            >
              {lastMessage || (contactName === 'Alice' ? 'Your notes' : 'No messages yet')}
            </Text>
            {unreadCount > 0 && (
              <div style={{
                minWidth: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: '#25D366',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)'
              }}>
                {unreadCount}
              </div>
            )}
          </div>
        }
      />
    </List.Item>
  );
};

export default ChatListItem;
