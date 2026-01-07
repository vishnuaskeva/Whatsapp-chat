import { useState, useEffect, useMemo } from "react";
import { Layout, notification, Button, Space, Modal, List } from "antd";
import { useSocket } from "../context/SocketContext";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  useGetMessagesQuery,
  useGetPersonalNotesQuery,
  useSavePersonalNoteMutation,
  useEditMessageMutation,
} from "../features/chat/chatApi";
import { openTaskDraft } from "../features/taskDraft/taskDraftSlice";
import {
  useMarkNotificationsReadMutation,
  useGetNotificationsQuery,
} from "../features/notifications/notificationApi";
import { markNotificationsRead } from "../features/notifications/notificationSlice";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatHeader from "../components/Chat/ChatHeader";
import ChatMessages from "../components/Chat/ChatMessages";
import ChatInput from "../components/Chat/ChatInput";
import TaskDraftModal from "../components/taskDraft/TaskDraftModal";

const { Content } = Layout;
const USERS = ["Alice", "Bob", "Charlie"];

const buildConversationId = (a, b) => [a, b].sort().join("::");

const ChatPage = () => {
  const dispatch = useAppDispatch();
  const { socket } = useSocket();

  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [selectedContact, setSelectedContact] = useState(USERS[1]);
  const [messages, setMessages] = useState([]);
  const [unreadCountsPerUser, setUnreadCountsPerUser] = useState({});
  const [lastMessagesPerUser, setLastMessagesPerUser] = useState({});
  const [messageTimestampsPerUser, setMessageTimestampsPerUser] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [_replyingTo, set_ReplyingTo] = useState(null);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [forwardingMessageId, setForwardingMessageId] = useState(null);
  const [userStatusMap, setUserStatusMap] = useState({}); // Track online/last seen per user

  const availableContacts = useMemo(
    () => USERS.filter((user) => user !== currentUser),
    [currentUser]
  );

  const conversationId = useMemo(() => {
    if (!currentUser || !selectedContact) return null;
    return buildConversationId(currentUser, selectedContact);
  }, [currentUser, selectedContact]);

  const replyingMessage = _replyingTo ? messages.find((m) => m._id === _replyingTo) : null;

  const { data: messagesData, isLoading: isMessagesLoading } =
    useGetMessagesQuery(
      { participant1: currentUser, participant2: selectedContact },
      {
        skip:
          !currentUser || !selectedContact || selectedContact === currentUser,
      }
    );

  const { data: notesData, isLoading: isNotesLoading } =
    useGetPersonalNotesQuery(currentUser, {
      skip: !currentUser || selectedContact !== currentUser,
    });

  // sendMessageMutation not used here (we use socket), so omit to avoid unused variable
  const [savePersonalNote] = useSavePersonalNoteMutation();
  const [editMessageMutation] = useEditMessageMutation();
  const [markNotificationsReadMutation] = useMarkNotificationsReadMutation();
  const { data: notificationsData } = useGetNotificationsQuery(currentUser, {
    skip: !currentUser,
  });

  useEffect(() => {
    if (selectedContact === currentUser && notesData) {
      // avoid synchronous setState inside effect — schedule update asynchronously
      const toSet = notesData.map((note) => ({
        ...note,
        sender: currentUser,
        recipient: currentUser,
        type: "text",
      }));
      setTimeout(() => setMessages(toSet), 0);
    }
  }, [notesData, selectedContact, currentUser]);

  // Clean up any leftover per-user notes stored in localStorage by older dev runs
  useEffect(() => {
    if (!currentUser) return;
    try {
      const key = `${currentUser}_notes`;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore localStorage errors (e.g., private mode)
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedContact && selectedContact !== currentUser && messagesData) {
      const toSet = messagesData;
      setTimeout(() => setMessages(toSet), 0);
    }
  }, [messagesData, selectedContact, currentUser]);

  // Join/leave conversation room when conversation changes
  useEffect(() => {
    if (!socket || !conversationId || !currentUser) return;

    // Join conversation and let server know who joined so it can mark delivered
    socket.emit("join_conversation", { conversationId, username: currentUser });

    // Mark messages in this conversation as read by currentUser
    socket.emit("mark_as_read", { conversationId, username: currentUser });

    return () => {
      socket.emit("leave_conversation", { conversationId });
    };
  }, [socket, conversationId, currentUser]);

  // Register current user with socket server so online/lastSeen works
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Emit immediately if connected
    try {
      socket.emit("register_user", currentUser);
    } catch (err) {
      void err;
    }

    const handleConnect = () => {
      if (currentUser) socket.emit("register_user", currentUser);
    };

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, currentUser]);

  // Mark notifications as read when viewing a conversation
  useEffect(() => {
    if (
      !currentUser ||
      !selectedContact ||
      selectedContact === currentUser ||
      !notificationsData
    )
      return;

    // Get unread notifications from selectedContact
    const unreadNotifications = (notificationsData.notifications || []).filter(
      (n) => !n.read && n.actor === selectedContact && n.owner === currentUser
    );

    if (unreadNotifications.length > 0) {
      const ids = unreadNotifications.map((n) => n._id);
      markNotificationsReadMutation({ owner: currentUser, ids })
        .then(() => {
          dispatch(markNotificationsRead({ owner: currentUser, ids }));
          // notifications marked as read
        })
        .catch(() => {
          console.error("Failed to mark notifications as read");
        });
    }
  }, [
    currentUser,
    selectedContact,
    notificationsData,
    markNotificationsReadMutation,
    dispatch,
  ]);

  useEffect(() => {
    if (!currentUser) return;

    if (selectedContact === currentUser && notesData && notesData.length > 0) {
      const lastNote = notesData[notesData.length - 1];
      const toMerge = (prev) => {
        const userMessages = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userMessages,
            [currentUser]: lastNote.content,
          },
        };
      };
      setTimeout(() => setLastMessagesPerUser(toMerge), 0);
      setTimeout(() => {
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
      }, 0);
    }

    if (
      selectedContact !== currentUser &&
      messagesData &&
      messagesData.length > 0
    ) {
      const lastMsg = messagesData[messagesData.length - 1];
      setTimeout(() => {
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
      }, 0);
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
          // If server returned a tempId, replace optimistic message
          if (message.tempId) {
            let found = false;
            const replaced = prev.map((m) => {
              if (m.tempId && m.tempId === message.tempId) {
                found = true;
                return message; // replace with authoritative message from server
              }
              return m;
            });
            if (found) return replaced;
          }

          // Check if message already exists by _id (most reliable check)
          if (message._id && prev.some((m) => m._id === message._id)) {
            return prev;
          }

          // Check if we already added this message locally (before DB response)
          // For task messages, check: type, sender, recipient, and that it doesn't have _id yet
          if (message.type === "task") {
            const isDuplicate = prev.some(
              (m) =>
                m.type === "task" &&
                m.sender === message.sender &&
                m.recipient === message.recipient &&
                !m._id && // Local message won't have _id
                m.task?.title === message.task?.title
            );
            if (isDuplicate) {
              return prev;
            }
          }

          // For text messages, check sender + recipient + type + content
          if (message.type === "text") {
            const isDuplicate = prev.some(
              (m) =>
                m.sender === message.sender &&
                m.recipient === message.recipient &&
                m.type === "text" &&
                m.content === message.content &&
                !m._id // Local message won't have _id
            );
            if (isDuplicate) {
              return prev;
            }
          }

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

    socket.on("receive_message", handleReceiveMessage);

    // Listen for typing indicator
    const handleTypingIndicator = (data) => {
      const { username, isTyping } = data;
      // Don't show typing indicator for current user's own typing
      if (!username || username === currentUser) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          return { ...prev, [username]: true };
        } else {
          const next = { ...prev };
          delete next[username];
          return next;
        }
      });
    };

    // Listen for message deleted for me
    const handleMessageDeletedForMe = (data) => {
      const { messageId } = data;
      setMessages((prev) => {
        const updated = prev.filter((m) => m._id !== messageId);
        return updated;
      });
    };

    // Listen for message deleted for everyone
    const handleMessageDeletedForEveryone = (data) => {
      const { messageId, conversationId } = data;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, isDeletedEveryone: true } : m
        )
      );

      // Update sidebar: find last non-deleted message in conversation
      setMessages((prev) => {
        const lastValidMsg = prev
          .filter((m) => !m.isDeletedEveryone && m.conversationId === conversationId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        if (lastValidMsg) {
          const contactInMsg = lastValidMsg.sender === currentUser ? lastValidMsg.recipient : lastValidMsg.sender;
          setLastMessagesPerUser((prevMsgs) => {
            const userMessages = prevMsgs[currentUser] || {};
            return {
              ...prevMsgs,
              [currentUser]: {
                ...userMessages,
                [contactInMsg]: lastValidMsg.content || lastValidMsg.type,
              },
            };
          });

          setMessageTimestampsPerUser((prevTs) => {
            const userTimestamps = prevTs[currentUser] || {};
            return {
              ...prevTs,
              [currentUser]: {
                ...userTimestamps,
                [contactInMsg]: lastValidMsg.createdAt,
              },
            };
          });
        } else {
          // No valid messages left, try to remove from sidebar
          const deletedMsg = prev.find((m) => m._id === messageId);
          if (deletedMsg) {
            const contactInMsg = deletedMsg.sender === currentUser ? deletedMsg.recipient : deletedMsg.sender;
            setLastMessagesPerUser((prevMsgs) => {
              const userMessages = prevMsgs[currentUser] || {};
              const updated = { ...userMessages };
              delete updated[contactInMsg];
              return {
                ...prevMsgs,
                [currentUser]: updated,
              };
            });

            setMessageTimestampsPerUser((prevTs) => {
              const userTimestamps = prevTs[currentUser] || {};
              const updated = { ...userTimestamps };
              delete updated[contactInMsg];
              return {
                ...prevTs,
                [currentUser]: updated,
              };
            });
          }
        }

        return prev;
      });
    };

    socket.on("typing_indicator", handleTypingIndicator);

    // Also listen for notification events — update sidebar preview and unread counts
    const handleSocketNotification = (note) => {
      try {
        const actor = note.actor || note.data?.sender;
        const owner = note.owner; // recipient of the notification
        // only update when this instance represents the owner (currentUser)
        if (owner !== currentUser) return;

        const preview = note.body || "";
        const ts = new Date().toISOString();

        // update last message preview for this contact (actor)
        setLastMessagesPerUser((prev) => {
          const userMessages = prev[currentUser] || {};
          return {
            ...prev,
            [currentUser]: {
              ...userMessages,
              [actor]: preview,
            },
          };
        });

        // update timestamp
        setMessageTimestampsPerUser((prev) => {
          const userTimestamps = prev[currentUser] || {};
          return {
            ...prev,
            [currentUser]: {
              ...userTimestamps,
              [actor]: ts,
            },
          };
        });

        // increment unread count for this contact
        setUnreadCountsPerUser((prev) => {
          const userCounts = prev[currentUser] || {};
          return {
            ...prev,
            [currentUser]: {
              ...userCounts,
              [actor]: (userCounts[actor] || 0) + 1,
            },
          };
        });
      } catch {
        // ignore
      }
    };

    socket.on("notification", handleSocketNotification);
    socket.on("message_deleted_for_me", handleMessageDeletedForMe);
    socket.on("message_deleted_for_everyone", handleMessageDeletedForEveryone);

    // Listen for message edited events
    const handleMessageEdited = (data) => {
      const { _id, content, editedAt } = data;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === _id
            ? { ...m, content, editedAt }
            : m
        )
      );
    };

    socket.on("message_edited", handleMessageEdited);

    // Listen for message status updates (sent/delivered/read ticks)
    const handleMessageStatus = (data) => {
      const { _id, status } = data;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === _id
            ? { ...m, status }
            : m
        )
      );
    };

    socket.on("message_status", handleMessageStatus);

    // Listen for user status changes
    const handleUserStatusChanged = (data) => {
      const { username, isOnline, lastSeen } = data;
      if (!username) return;
      setUserStatusMap((prev) => ({
        ...prev,
        [username]: { isOnline, lastSeen },
      }));
    };

    socket.on("user_status_changed", handleUserStatusChanged);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("notification", handleSocketNotification);
      socket.off("typing_indicator", handleTypingIndicator);
      socket.off("message_deleted_for_me", handleMessageDeletedForMe);
      socket.off(
        "message_deleted_for_everyone",
        handleMessageDeletedForEveryone
      );
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_status", handleMessageStatus);
      socket.off("user_status_changed", handleUserStatusChanged);
    };
  }, [socket, currentUser, conversationId]);

  // Refresh UI every minute so last-seen times update without socket events
  useEffect(() => {
    const interval = setInterval(() => {
      setUserStatusMap((prev) => ({ ...prev }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (content) => {
    if (!selectedContact) return;

    if (selectedContact === currentUser) {
      try {
        const savedNote = await savePersonalNote({
          username: currentUser,
          content,
        }).unwrap();
        const transformedNote = {
          ...savedNote,
          sender: currentUser,
          recipient: currentUser,
          type: "text",
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
      } catch {
        notification.error({
          message: "Error",
          description: "Failed to save note",
          placement: "topRight",
        });
      }
      return;
    }

    // optimistic message: create a temporary id so we can replace it when server returns
    const tempId = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const outgoing = {
      sender: currentUser,
      recipient: selectedContact,
      content,
      type: "text",
      conversationId,
      replyTo: _replyingTo || null,
      createdAt: new Date().toISOString(),
      tempId,
    };

    // Append optimistic message with tempId
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

    socket.emit("send_message", outgoing);

    // clear reply state after sending
    if (_replyingTo) set_ReplyingTo(null);
  };

  const handleTaskSubmit = async (task) => {
    if (!selectedContact || selectedContact === currentUser) return;

    const outgoing = {
      sender: currentUser,
      recipient: selectedContact,
      type: "task",
      task,
      conversationId,
      createdAt: new Date().toISOString(),
    };

    // sending task message

    setMessages((prev) => [...prev, outgoing]);

    setLastMessagesPerUser((prev) => {
      const userMessages = prev[currentUser] || {};
      return {
        ...prev,
        [currentUser]: {
          ...userMessages,
          [selectedContact]: "Task draft",
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

    socket.emit("send_message", outgoing);
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

  const handleEditMessage = async (messageId, content) => {
    try {
      await editMessageMutation({
        messageId,
        content,
        sender: currentUser,
      }).unwrap();
      
      // Update local message state with edited content and timestamp
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, content, editedAt: new Date().toISOString() }
            : m
        )
      );
    } catch (error) {
      notification.error({
        message: "Failed to edit message",
        placement: "topRight",
      });
      throw error;
    }
  };

  const handleDeleteMessage = (messageId, type) => {
    if (type === "delete_me") {
      socket?.emit("delete_message_for_me", {
        messageId,
        username: currentUser,
      });
    } else if (type === "delete_all") {
      socket?.emit("delete_message_for_everyone", {
        messageId,
        sender: currentUser,
      });
    }
  };

  const handleForwardMessage = (messageId) => {
    setForwardingMessageId(messageId);
    setForwardModalVisible(true);
  };

  const handleForwardConfirm = (recipient) => {
    if (!forwardingMessageId) return;

    const message = messages.find((m) => m._id === forwardingMessageId);
    if (!message) return;

    socket?.emit("forward_message", {
      messageId: forwardingMessageId,
      toRecipient: recipient,
      fromSender: currentUser,
    });

    notification.success({
      message: "Message forwarded",
      description: `Message forwarded to ${recipient}`,
      placement: "topRight",
    });

    setForwardModalVisible(false);
    setForwardingMessageId(null);
  };

  const handleReply = (messageId) => {
    set_ReplyingTo(messageId);
  };

  const loading = isMessagesLoading || isNotesLoading;

  // Get unread counts from Redux notifications
  const reduxUnreadCounts = useAppSelector(
    (state) => state.notifications?.unreadCounts || {}
  );

  // All notifications from Redux (used to seed sidebar previews)
  const reduxNotifications = useAppSelector(
    (state) => state.notifications?.notifications || []
  );

  // Merge Redux notification unread counts with local state
  const mergedUnreadCounts = {
    ...(unreadCountsPerUser[currentUser] || {}),
    ...(reduxUnreadCounts[currentUser] || {}),
  };

  const unreadCounts = mergedUnreadCounts;
  const lastMessages = lastMessagesPerUser[currentUser] || {};
  const messageTimestamps = messageTimestampsPerUser[currentUser] || {};

  // If notifications are fetched/updated in Redux, seed sidebar previews and unread counts
  useEffect(() => {
    if (!currentUser) return;
    if (!reduxNotifications || reduxNotifications.length === 0) return;

    const notesForOwner = reduxNotifications.filter(
      (n) => n.owner === currentUser
    );
    if (!notesForOwner.length) return;

    const latestByActor = {};
    const tsByActor = {};
    const unreadByActor = {};

    notesForOwner.forEach((n) => {
      const actor = n.actor || n.data?.sender || "unknown";
      const created = n.createdAt
        ? new Date(n.createdAt).toISOString()
        : new Date().toISOString();

      if (!tsByActor[actor] || new Date(created) > new Date(tsByActor[actor])) {
        latestByActor[actor] = n.body || n.title || "";
        tsByActor[actor] = created;
      }

      if (!n.read) {
        unreadByActor[actor] = (unreadByActor[actor] || 0) + 1;
      }
    });

    // merge latest previews/timestamps/unread counts asynchronously to avoid cascading renders
    setTimeout(() => {
      setLastMessagesPerUser((prev) => {
        const userMsgs = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userMsgs,
            ...latestByActor,
          },
        };
      });

      setMessageTimestampsPerUser((prev) => {
        const userTs = prev[currentUser] || {};
        return {
          ...prev,
          [currentUser]: {
            ...userTs,
            ...tsByActor,
          },
        };
      });

      setUnreadCountsPerUser((prev) => {
        const userCounts = prev[currentUser] || {};
        const merged = { ...userCounts };
        Object.keys(unreadByActor).forEach((actor) => {
          merged[actor] = Math.max(merged[actor] || 0, unreadByActor[actor]);
        });
        return {
          ...prev,
          [currentUser]: merged,
        };
      });
    }, 0);
  }, [reduxNotifications, currentUser]);

  return (
    <Layout style={{ height: "100vh", backgroundColor: "#fff" }}>
      {/* Forward Message Modal */}
      <Modal
        title="Forward message to"
        open={forwardModalVisible}
        onCancel={() => {
          setForwardModalVisible(false);
          setForwardingMessageId(null);
        }}
        footer={null}
        width={300}
      >
        <List
          dataSource={availableContacts}
          renderItem={(contact) => (
            <List.Item
              style={{
                cursor: "pointer",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
              onClick={() => handleForwardConfirm(contact)}
            >
              <div style={{ width: "100%" }}>
                <div style={{ fontWeight: 500, color: "#075E54" }}>
                  {contact}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Modal>

      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#075E54",
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          borderBottom: "1px solid #128C7E",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: "12px",
            paddingTop: "4px",
            fontWeight: "500",
          }}
        >
          Switch User:
        </span>
        <Space size="small">
          {USERS.map((user) => (
            <Button
              key={user}
              size="small"
              type={currentUser === user ? "primary" : "default"}
              onClick={() => handleSwitchUser(user)}
              style={{
                backgroundColor: currentUser === user ? "#25D366" : "#fff",
                color: currentUser === user ? "#fff" : "#000",
                borderColor: currentUser === user ? "#25D366" : "#ccc",
                fontWeight: currentUser === user ? "600" : "400",
              }}
            >
              {user}
            </Button>
          ))}
        </Space>
      </div>

      <Layout style={{ height: "calc(100vh - 50px)", backgroundColor: "#fff" }}>
        <Sidebar
          currentUser={currentUser}
          contacts={availableContacts}
          selectedContact={selectedContact}
          onSelectContact={handleSelectContact}
          unreadCounts={unreadCounts}
          lastMessages={lastMessages}
          messageTimestamps={messageTimestamps}
          userStatusMap={userStatusMap}
        />
        <Layout>
          <ChatHeader 
            contactName={selectedContact} 
            currentUser={currentUser}
            isOnline={selectedContact && userStatusMap[selectedContact]?.isOnline}
            lastSeen={selectedContact && userStatusMap[selectedContact]?.lastSeen}
          />
          <Content
            style={{
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 64px)",
            }}
          >
            <ChatMessages
              messages={messages}
              currentUser={currentUser}
              loading={loading}
              selectedContact={selectedContact}
              typingUsers={typingUsers}
              onDelete={handleDeleteMessage}
              onForward={handleForwardMessage}
              onReply={handleReply}
              onEdit={handleEditMessage}
            />
            <ChatInput
              onSendMessage={handleSendMessage}
              onOpenTaskDraft={handleOpenTaskDraft}
              disabled={!selectedContact}
              currentUser={currentUser}
              selectedContact={selectedContact}
              conversationId={conversationId}
              replyingMessage={replyingMessage}
              onCancelReply={() => set_ReplyingTo(null)}
            />
          </Content>
        </Layout>
      </Layout>

      <TaskDraftModal onSubmit={handleTaskSubmit} currentUser={currentUser} />
    </Layout>
  );
};

export default ChatPage;
