import { useState, useEffect, useMemo } from 'react';
import { Layout, notification, Button, Space } from 'antd';
import { useSocket } from '../context/SocketContext';
import chatApi from '../services/chatApi';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatHeader from '../components/Chat/ChatHeader';
import ChatMessages from '../components/Chat/ChatMessages';
import ChatInput from '../components/Chat/ChatInput';

const { Content } = Layout;

const CONTACTS = ['Alice', 'Bob', 'Charlie'];
const USERS = ['Alice', 'Bob', 'Charlie'];

const ChatPage = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState('Alice');
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCountsPerUser, setUnreadCountsPerUser] = useState({});
  const [lastMessagesPerUser, setLastMessagesPerUser] = useState({});
  const [messageTimestampsPerUser, setMessageTimestampsPerUser] = useState({});

  const unreadCounts = unreadCountsPerUser[currentUser] || {};
  const lastMessages = lastMessagesPerUser[currentUser] || {};
  const messageTimestamps = messageTimestampsPerUser[currentUser] || {};

  const availableContacts = useMemo(() => {
    if (!currentUser) return [...CONTACTS];
    const filtered = CONTACTS.filter((c) => c !== currentUser);
    return [currentUser, ...filtered];
  }, [currentUser]);

  const conversationId = useMemo(() => {
    if (!currentUser || !selectedContact) return null;
    if (selectedContact === currentUser) {
      return `${currentUser}::notes`;
    }
    return [currentUser, selectedContact].sort().join('::');
  }, [currentUser, selectedContact]);

  useEffect(() => {
    if (currentUser && availableContacts.length > 0 && !selectedContact) {
      setSelectedContact(availableContacts[0]);
    }
  }, [currentUser, availableContacts, selectedContact]);

  useEffect(() => {
    if (!currentUser) return;
    
    const loadPersonalNotes = async () => {
      try {
        const notes = await chatApi.getPersonalNotes(currentUser);
        if (notes.length > 0) {
          const lastNote = notes[notes.length - 1];
          setLastMessagesPerUser(prev => {
            const userMessages = prev[currentUser] || {};
            return {
              ...prev,
              [currentUser]: {
                ...userMessages,
                [currentUser]: lastNote.content
              }
            };
          });
          
          setMessageTimestampsPerUser(prev => {
            const userTimestamps = prev[currentUser] || {};
            return {
              ...prev,
              [currentUser]: {
                ...userTimestamps,
                [currentUser]: lastNote.createdAt
              }
            };
          });
        }
      } catch (error) {
        console.error('Failed to load personal notes:', error);
      }
    };
    
    loadPersonalNotes();
    
    const otherContacts = CONTACTS.filter(c => c !== currentUser);
    Promise.all(
      otherContacts.map(contact =>
        chatApi.getConversationMessages(currentUser, contact)
          .then(data => {
            if (data.length > 0) {
              const lastMsg = data[data.length - 1];
              setLastMessagesPerUser(prev => {
                const userMessages = prev[currentUser] || {};
                return {
                  ...prev,
                  [currentUser]: {
                    ...userMessages,
                    [contact]: lastMsg.content
                  }
                };
              });
              
              setMessageTimestampsPerUser(prev => {
                const userTimestamps = prev[currentUser] || {};
                return {
                  ...prev,
                  [currentUser]: {
                    ...userTimestamps,
                    [contact]: lastMsg.createdAt
                  }
                };
              });
            }
          })
          .catch(err => console.log(`[Chat] Failed to load messages for ${contact}:`, err))
      )
    );
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && selectedContact) {
      fetchMessages(currentUser, selectedContact);
    }
  }, [currentUser, selectedContact]);

  useEffect(() => {
    if (!socket || !currentUser) return;

    socket.on('receive_message', (message) => {
      const messageConvId = [message.sender, message.recipient].sort().join('::');
      const currentConvId = conversationId;
      
      const isForCurrentUser = message.sender === currentUser || message.recipient === currentUser;
      if (!isForCurrentUser) {
        return;
      }

      const contactInMessage = message.sender === currentUser ? message.recipient : message.sender;

      setLastMessagesPerUser((prev) => {
        const userMessages = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userMessages,
            [contactInMessage]: message.content
          }
        };
      });

      setMessageTimestampsPerUser((prev) => {
        const userTimestamps = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userTimestamps,
            [contactInMessage]: message.createdAt
          }
        };
      });

      if (currentConvId && messageConvId === currentConvId) {
        setMessages((prev) => [...prev, message]);
      } else {
        setUnreadCountsPerUser((prev) => {
          const userCounts = prev[currentUser] || {};
          return {
            ...prev,
            [currentUser]: {
              ...userCounts,
              [contactInMessage]: (userCounts[contactInMessage] || 0) + 1
            }
          };
        });
      }
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket, currentUser, conversationId]);

  const fetchMessages = async (participant1, participant2) => {
    try {
      setLoading(true);
      setMessages([]);
      
      if (participant1 === participant2) {
        const notes = await chatApi.getPersonalNotes(participant1);
        const transformedNotes = notes.map(note => ({
          ...note,
          sender: participant1,
          recipient: participant1
        }));
        setMessages(transformedNotes);
        return;
      }
      
      const data = await chatApi.getConversationMessages(participant1, participant2);
      setMessages(data);
      
      setUnreadCountsPerUser((prev) => {
        const userCounts = prev[participant1] || {};
        const updated = { ...userCounts };
        delete updated[participant2];
        return {
          ...prev,
          [participant1]: updated
        };
      });
      
      if (data.length > 0) {
        const lastMsg = data[data.length - 1];
        setLastMessagesPerUser(prev => {
          const userMessages = prev[participant1] || {};
          return {
            ...prev,
            [participant1]: {
              ...userMessages,
              [participant2]: lastMsg.content
            }
          };
        });
        
        setMessageTimestampsPerUser(prev => {
          const userTimestamps = prev[participant1] || {};
          return {
            ...prev,
            [participant1]: {
              ...userTimestamps,
              [participant2]: lastMsg.createdAt
            }
          };
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to fetch messages',
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle send message
  const handleSendMessage = (content) => {
    
    // Handle personal notes with MongoDB
    if (selectedContact === currentUser) {
      chatApi.savePersonalNote(currentUser, content)
        .then((savedNote) => {
          // Transform note to include sender field
          const transformedNote = {
            ...savedNote,
            sender: currentUser,
            recipient: currentUser
          };
          setMessages((prev) => [...prev, transformedNote]);
          
          // Update last message preview
          setLastMessagesPerUser((prev) => {
            const userMessages = prev[currentUser] || {};
            return {
              ...prev,
              [currentUser]: {
                ...userMessages,
                [currentUser]: content
              }
            };
          });
          
          notification.success({
            message: 'Saved',
            description: 'Note saved to your personal space',
            placement: 'topRight'
          });
        })
        .catch((error) => {
          notification.error({
            message: 'Error',
            description: 'Failed to save note',
            placement: 'topRight'
          });
        });
      return;
    }
    
    if (!socket || !isConnected) {
      notification.warning({
        message: 'Not Connected',
        description: 'Socket connection not established',
        placement: 'topRight'
      });
      return;
    }

    if (!selectedContact) {
      notification.info({
        message: 'Select a contact',
        description: 'Choose someone to chat with first',
        placement: 'topRight'
      });
      return;
    }

    const messageData = {
      sender: currentUser,
      recipient: selectedContact,
      content
    };

    socket.emit('send_message', messageData);
  };

  // Handle username submission
  const handleUsernameSubmit = () => {
    if (tempUsername.trim()) {
      setCurrentUser(tempUsername.trim());
      setUsernameModalOpen(false);
      notification.success({
        message: 'Welcome!',
        description: `Logged in as ${tempUsername.trim()}`,
        placement: 'topRight'
      });
    }
  };

  // Handle user switch
  const handleSwitchUser = (user) => {
    setCurrentUser(user);
    setSelectedContact(null);
    setMessages([]);
    notification.info({
      message: 'User Switched',
      description: `Now logged in as ${user}`,
      placement: 'topRight'
    });
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    // Clear unread count for this contact when selected
    setUnreadCountsPerUser((prev) => {
      const userCounts = prev[currentUser] || {};
      const updated = { ...userCounts };
      delete updated[contact];
      return {
        ...prev,
        [currentUser]: updated
      };
    });
  };

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#fff' }}>
      {/* User Switcher */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#075E54',
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        borderBottom: '1px solid #128C7E'
      }}>
        <span style={{ color: '#fff', fontSize: '12px', paddingTop: '4px', fontWeight: '500' }}>Switch User:</span>
        <Space size="small">
          {USERS.map((user) => (
            <Button
              key={user}
              size="small"
              type={currentUser === user ? 'primary' : 'default'}
              onClick={() => handleSwitchUser(user)}
              style={{
                backgroundColor: currentUser === user ? '#25D366' : '#fff',
                color: currentUser === user ? '#fff' : '#000',
                borderColor: currentUser === user ? '#25D366' : '#ccc',
                fontWeight: currentUser === user ? '600' : '400'
              }}
            >
              {user}
            </Button>
          ))}
        </Space>
      </div>

      <Layout style={{ height: 'calc(100vh - 50px)', backgroundColor: '#fff' }}>
        <Sidebar 
          currentUser={currentUser} 
          contacts={availableContacts}
          selectedContact={selectedContact}
          onSelectContact={handleSelectContact}
          unreadCounts={unreadCounts}
          lastMessages={lastMessages}
          messageTimestamps={messageTimestamps}
        />
        <Layout>
          <ChatHeader contactName={selectedContact} />
          <Content style={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: 'calc(100vh - 64px)'
          }}>
            <ChatMessages 
              messages={messages} 
              currentUser={currentUser} 
              loading={loading}
              selectedContact={selectedContact}
            />
            <ChatInput onSendMessage={handleSendMessage} disabled={!selectedContact} />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default ChatPage;
