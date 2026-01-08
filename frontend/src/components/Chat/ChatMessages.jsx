import { useEffect, useRef, useState } from "react";
import { Spin, Empty, Typography, Button, Space } from "antd";
import { DeleteOutlined, ShareAltOutlined } from "@ant-design/icons";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import bgImage from "../../assets/image.png";

const { Text } = Typography;

const ChatMessages = ({
  messages,
  searchTerm = "",
  currentUser,
  loading,
  selectedContact,
  typingUsers,
  onDelete,
  onForward,
  onReply,
  onEdit,
  isMultiSelectMode = false,
  selectedMessageIds = [],
  onSelectMessage,
  onMultiDelete,
  onMultiForward,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom on new messages or typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const getDateLabel = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDateOnly = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate()
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return "Today";
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          messageDate.getFullYear() !== today.getFullYear()
            ? "numeric"
            : undefined,
      });
    }
  };

  const shouldShowDateSeparator = (current, previous) => {
    if (!previous) return true;
    return getDateLabel(current.createdAt) !== getDateLabel(previous.createdAt);
  };

  if (!selectedContact) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#E5DDD5",
        }}
      >
        <Empty description="Select a contact to start chatting" />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#ECE5DD",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // If a search term is present, filter messages for display
  const filteredMessages = searchTerm
    ? messages.filter((m) => {
        if (!m) return false;
        const term = searchTerm.toLowerCase();
        if (m.type === "text" && m.content) {
          return m.content.toLowerCase().includes(term);
        }
        if (m.type === "task" && m.task && m.task.title) {
          return m.task.title.toLowerCase().includes(term);
        }
        return false;
      })
    : messages;

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "500px 500px",
        backgroundRepeat: "repeat",
        backgroundAttachment: "scroll",
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Empty description="No messages yet. Start the conversation!" />
        </div>
      ) : (
        <>
          {isMultiSelectMode && selectedMessageIds.length > 0 && (
            <div
              style={{
                position: "sticky",
                bottom: "0",
                left: "0",
                right: "0",
                backgroundColor: "#fff",
                borderTop: "1px solid #e0e0e0",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <Text strong>{selectedMessageIds.length} selected</Text>
              <Space>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={() => onMultiForward?.(selectedMessageIds)}
                >
                  Forward
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onMultiDelete?.(selectedMessageIds)}
                >
                  Delete
                </Button>
              </Space>
            </div>
          )}
          {filteredMessages.map((message, index) => {
            // Check if sender changed from previous message
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const senderChanged =
              !previousMessage || previousMessage.sender !== message.sender;
            const showDateSeparator = shouldShowDateSeparator(
              message,
              previousMessage
            );
            const messageKey = message._id
              ? `${message._id}`
              : `temp-${index}-${message.sender}-${message.createdAt}`;

            const replyMessage = message.replyTo
              ? messages.find((m) => m._id === message.replyTo)
              : null;

            const isSelected = selectedMessageIds.includes(
              message._id || messageKey
            );

            return (
                <div
                key={messageKey}
                style={{
                  backgroundColor: isSelected ? "#e3f2fd" : "transparent",
                  borderRadius: "4px",
                  padding: isSelected ? "4px" : "0",
                  marginBottom: isSelected ? "4px" : "0",
                  position: "relative",
                }}
              >
                {showDateSeparator && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: index === 0 ? "8px" : "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#999",
                        backgroundColor: "#f0f0f0",
                        padding: "4px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      {getDateLabel(message.createdAt)}
                    </Text>
                  </div>
                )}
                {isMultiSelectMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      onSelectMessage?.(message._id || messageKey, isSelected)
                    }
                    style={{
                      position: "absolute",
                      left: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      zIndex: 5,
                    }}
                  />
                )}
                <div
                  style={{
                    marginLeft: isMultiSelectMode ? "32px" : "0",
                  }}
                  onClick={() => {
                    if (
                      isMultiSelectMode &&
                      message.sender === currentUser
                    ) {
                      onSelectMessage?.(
                        message._id || messageKey,
                        isSelected
                      );
                    }
                  }}
                >
                  <ChatMessage
                    searchTerm={searchTerm}
                    message={message}
                    replyMessage={replyMessage}
                    currentUser={currentUser}
                    showSenderName={senderChanged}
                    onDelete={onDelete}
                    onForward={onForward}
                    onReply={onReply}
                    onEdit={onEdit}
                    isSelected={isSelected}
                  />
                </div>
              </div>
            );
          })}
        </>
      )}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
