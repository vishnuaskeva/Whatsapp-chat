import { useState, useEffect, useMemo } from 'react';
import { Layout, notification, Button, Space } from 'antd';
import { useSocket } from '../context/SocketContext';
import { useAppDispatch } from '../app/hooks';
import {
  useGetMessagesQuery,
  useGetPersonalNotesQuery,
  useSendMessageMutation,
  useSavePersonalNoteMutation,
} from '../features/chat/chatApi';
import { openTaskDraft } from '../features/taskDraft/taskDraftSlice';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatHeader from '../components/Chat/ChatHeader';
import ChatMessages from '../components/Chat/ChatMessages';
import ChatInput from '../components/Chat/ChatInput';
import TaskDraftModal from '../components/taskDraft/TaskDraftModal';

const { Content } = Layout;
const USERS = ['Alice', 'Bob', 'Charlie'];

const buildConversationId = (a, b) => [a, b].sort().join('::');

const ChatPage = () => {
  const dispatch = useAppDispatch();
  const { socket } = useSocket();

  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [selectedContact, setSelectedContact] = useState(USERS[1]);
  const [messages, setMessages] = useState([]);
  const [unreadCountsPerUser, setUnreadCountsPerUser] = useState({});
  const [lastMessagesPerUser, setLastMessagesPerUser] = useState({});
  const [messageTimestampsPerUser, setMessageTimestampsPerUser] = useState({});

  const availableContacts = useMemo(
    () => USERS.filter((user) => user !== currentUser),
    [currentUser],
  );

  const conversationId = useMemo(() => {
    if (!currentUser || !selectedContact) return null;
    return buildConversationId(currentUser, selectedContact);
  }, [currentUser, selectedContact]);

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
  } = useGetMessagesQuery(
    { participant1: currentUser, participant2: selectedContact },
    { skip: !currentUser || !selectedContact || selectedContact === currentUser },
  );

  const {
    data: notesData,
    isLoading: isNotesLoading,
  } = useGetPersonalNotesQuery(currentUser, {
    skip: !currentUser || selectedContact !== currentUser,
  });

  const [sendMessageMutation] = useSendMessageMutation();
  const [savePersonalNote] = useSavePersonalNoteMutation();

  useEffect(() => {
    if (selectedContact === currentUser && notesData) {
      setMessages(
        notesData.map((note) => ({
          ...note,
          sender: currentUser,
          recipient: currentUser,
          type: 'text',
        })),
      );
    }
  }, [notesData, selectedContact, currentUser]);

  useEffect(() => {
    if (selectedContact && selectedContact !== currentUser && messagesData) {
      console.log('Loading messages for conversation:', { currentUser, selectedContact, messageCount: messagesData.length });
      messagesData.forEach((msg, idx) => {
        console.log(`  Message ${idx}: type=${msg.type}, sender=${msg.sender}, has_task=${!!msg.task}, has_id=${!!msg._id}`);
      });
      setMessages(messagesData);
    }
  }, [messagesData, selectedContact, currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    if (selectedContact === currentUser && notesData && notesData.length > 0) {
      const lastNote = notesData[notesData.length - 1];
      setLastMessagesPerUser((prev) => {
        const userMessages = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userMessages,
            [currentUser]: lastNote.content,
          },
        };
      });
      setMessageTimestampsPerUser((prev) => {
        const userTimestamps = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userTimestamps,
            [currentUser]: lastNote.createdAt,
          },
        };
      });
    }

    if (selectedContact !== currentUser && messagesData && messagesData.length > 0) {
      const lastMsg = messagesData[messagesData.length - 1];
      setLastMessagesPerUser((prev) => {
        const userMessages = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userMessages,
            [selectedContact]: lastMsg.content,
          },
        };
      });

      setMessageTimestampsPerUser((prev) => {
        const userTimestamps = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userTimestamps,
            [selectedContact]: lastMsg.createdAt,
          },
        };
      });
    }
  }, [messagesData, notesData, selectedContact, currentUser]);

  useEffect(() => {
    if (!socket || !currentUser) return undefined;

    const handleReceiveMessage = (message) => {
      const { sender, recipient } = message;
      if (sender !== currentUser && recipient !== currentUser) return;

      const contactInMessage = sender === currentUser ? recipient : sender;
      const messageConvId = buildConversationId(sender, recipient);

      setLastMessagesPerUser((prev) => {
        const userMessages = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userMessages,
            [contactInMessage]: message.content || message.type,
          },
        };
      });

      setMessageTimestampsPerUser((prev) => {
        const userTimestamps = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userTimestamps,
            [contactInMessage]: message.createdAt,
          },
        };
      });

      if (conversationId && messageConvId === conversationId) {
        setMessages((prev) => {
          console.log('Received message via socket:', { type: message.type, sender: message.sender, has_task: !!message.task, has_id: !!message._id });
          
          // Check if message already exists by _id (most reliable check)
          if (message._id && prev.some((m) => m._id === message._id)) {
            console.log('Message already exists by _id, skipping:', message._id);
            return prev;
          }
          
          // Check if we already added this message locally (before DB response)
          // For task messages, check: type, sender, recipient, and that it doesn't have _id yet
          if (message.type === 'task') {
            const isDuplicate = prev.some(
              (m) =>
                m.type === 'task' &&
                m.sender === message.sender &&
                m.recipient === message.recipient &&
                !m._id && // Local message won't have _id
                m.task?.title === message.task?.title
            );
            if (isDuplicate) {
              console.log('Task message is duplicate (added locally before DB response), skipping');
              return prev;
            }
          }
          
          // For text messages, check sender + recipient + type + content
          if (message.type === 'text') {
            const isDuplicate = prev.some(
              (m) =>
                m.sender === message.sender &&
                m.recipient === message.recipient &&
                m.type === 'text' &&
                m.content === message.content &&
                !m._id // Local message won't have _id
            );
            if (isDuplicate) {
              console.log('Text message is duplicate (added locally before DB response), skipping');
              return prev;
            }
          }
          
          console.log('Adding new message to state:', { type: message.type, sender: message.sender, _id: message._id });
          return [...prev, message];
        });
      } else {
        setUnreadCountsPerUser((prev) => {
          const userCounts = prev[currentUser] || {};
          return {
            ...prev,
            [currentUser]: {
              ...userCounts,
              [contactInMessage]: (userCounts[contactInMessage] || 0) + 1,
            },
          };
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, currentUser, conversationId]);

  const handleSendMessage = async (content) => {
    if (!selectedContact) return;

    if (selectedContact === currentUser) {
      try {
        const savedNote = await savePersonalNote({ username: currentUser, content }).unwrap();
        const transformedNote = {
          ...savedNote,
          sender: currentUser,
          recipient: currentUser,
          type: 'text',
        };
        setMessages((prev) => [...prev, transformedNote]);
        setLastMessagesPerUser((prev) => {
          const userMessages = prev[currentUser] || {};
          return {
            ...prev,
            [currentUser]: {
              ...userMessages,
              [currentUser]: content,
            },
          };
        });
        setMessageTimestampsPerUser((prev) => {
          const userTimestamps = prev[currentUser] || {};
          return {
            ...prev,
            [currentUser]: {
              ...userTimestamps,
              [currentUser]: savedNote.createdAt,
            },
          };
        });
      } catch (err) {
        notification.error({
          message: 'Error',
          description: 'Failed to save note',
          placement: 'topRight',
        });
      }
      return;
    }

    const outgoing = {
      sender: currentUser,
      recipient: selectedContact,
      content,
      type: 'text',
      conversationId,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, outgoing]);
    
    setLastMessagesPerUser((prev) => {
      const userMessages = prev[currentUser] || {};
      return {
        ...prev,
        [currentUser]: {
          ...userMessages,
          [selectedContact]: content,
        },
      };
    });
    setMessageTimestampsPerUser((prev) => {
      const userTimestamps = prev[currentUser] || {};
      return {
        ...prev,
        [currentUser]: {
          ...userTimestamps,
          [selectedContact]: outgoing.createdAt,
        },
      };
    });

    socket.emit('send_message', outgoing);
  };

  const handleTaskSubmit = async (task) => {
    if (!selectedContact || selectedContact === currentUser) return;

    const outgoing = {
      sender: currentUser,
      recipient: selectedContact,
      type: 'task',
      task,
      conversationId,
      createdAt: new Date().toISOString(),
    };

    console.log('🚀 FRONTEND: Sending task message:', {
      sender: outgoing.sender,
      recipient: outgoing.recipient,
      type: outgoing.type,
      conversationId: outgoing.conversationId,
      hasTask: !!outgoing.task,
      taskTitle: outgoing.task?.title,
      taskScreensCount: outgoing.task?.screens?.length
    });

    setMessages((prev) => [...prev, outgoing]);
    
    setLastMessagesPerUser((prev) => {
      const userMessages = prev[currentUser] || {};
      return {
        ...prev,
        [currentUser]: {
          ...userMessages,
          [selectedContact]: 'Task draft',
        },
      };
    });
    setMessageTimestampsPerUser((prev) => {
      const userTimestamps = prev[currentUser] || {};
      return {
        ...prev,
        [currentUser]: {
          ...userTimestamps,
          [selectedContact]: outgoing.createdAt,
        },
      };
    });

    socket.emit('send_message', outgoing);
  };

  const handleSwitchUser = (user) => {
    setCurrentUser(user);
    const nextContact = USERS.find((u) => u !== user) || null;
    setSelectedContact(nextContact);
    setMessages([]);
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setUnreadCountsPerUser((prev) => {
      const userCounts = prev[currentUser] || {};
      const updated = { ...userCounts };
      delete updated[contact];
      return {
        ...prev,
        [currentUser]: updated,
      };
    });
  };

  const handleOpenTaskDraft = () => {
    dispatch(openTaskDraft());
  };

  const loading = isMessagesLoading || isNotesLoading;
  const unreadCounts = unreadCountsPerUser[currentUser] || {};
  const lastMessages = lastMessagesPerUser[currentUser] || {};
  const messageTimestamps = messageTimestampsPerUser[currentUser] || {};

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#fff' }}>
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#075E54',
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          borderBottom: '1px solid #128C7E',
        }}
      >
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
                fontWeight: currentUser === user ? '600' : '400',
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
          <Content
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 64px)',
            }}
          >
            <ChatMessages
              messages={messages}
              currentUser={currentUser}
              loading={loading}
              selectedContact={selectedContact}
            />
            <ChatInput
              onSendMessage={handleSendMessage}
              onOpenTaskDraft={handleOpenTaskDraft}
              disabled={!selectedContact}
            />
          </Content>
        </Layout>
      </Layout>

      <TaskDraftModal onSubmit={handleTaskSubmit} currentUser={currentUser} />
    </Layout>
  );
};

export default ChatPage;
