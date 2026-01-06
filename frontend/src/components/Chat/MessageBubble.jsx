import { useState } from "react";
import { Avatar, Typography, Dropdown } from "antd";
import { CheckOutlined } from "@ant-design/icons";

const { Text } = Typography;

const MessageBubble = ({
  message,
  replyMessage = null,
  currentUser,
  onDelete,
  onForward,
  onReply,
}) => {
  const isSentByCurrentUser = message.sender === currentUser;
  const [showMenu, setShowMenu] = useState(false);

  // Check if message is deleted
  const isDeletedForMe =
    message.deletedFor && message.deletedFor.includes(currentUser);
  const isDeletedEveryone = message.isDeletedEveryone;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const menuItems = [
    {
      label: "Reply",
      key: "reply",
      onClick: () => {
        setShowMenu(false);
        onReply?.(message._id);
      },
    },
    {
      label: "Delete for me",
      key: "delete_me",
      danger: true,
      onClick: () => {
        setShowMenu(false);
        onDelete?.(message._id, "delete_me");
      },
    },
  ];

  // Only sender can delete for everyone
  if (isSentByCurrentUser) {
    menuItems.push({
      label: "Delete for everyone",
      key: "delete_all",
      danger: true,
      onClick: () => {
        setShowMenu(false);
        onDelete?.(message._id, "delete_all");
      },
    });
  }

  menuItems.push({
    label: "Forward",
    key: "forward",
    onClick: () => {
      setShowMenu(false);
      onForward?.(message._id);
    },
  });

  // If message is deleted
  if (isDeletedForMe) {
    return null;
  }

  if (isDeletedEveryone) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: isSentByCurrentUser ? "flex-end" : "flex-start",
          marginBottom: "4px",
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingTop: "2px",
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: "70%",
            marginLeft: isSentByCurrentUser ? "auto" : "0",
            marginRight: isSentByCurrentUser ? "auto" : "auto",
          }}
        >
          <div
            style={{
              backgroundColor: "transparent",
              borderRadius: "7.5px",
              padding: "8px 12px",
            }}
          >
            <Text
              style={{
                color: "#999",
                fontSize: "13px",
                fontStyle: "italic",
                lineHeight: "19px",
                margin: "0",
              }}
            >
              This message was deleted
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isSentByCurrentUser ? "flex-end" : "flex-start",
        marginBottom: "4px",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingTop: "2px",
        width: "100%",
      }}
    >
      {!isSentByCurrentUser && (
        <Avatar
          size={28}
          style={{
            backgroundColor: "#128C7E",
            marginRight: "8px",
            flexShrink: 0,
          }}
        >
          {message.sender.charAt(0).toUpperCase()}
        </Avatar>
      )}
      <div
        style={{
          maxWidth: "70%",
          marginLeft: isSentByCurrentUser ? "auto" : "0",
          marginRight: isSentByCurrentUser ? "0" : "auto",
        }}
      >
        <Dropdown
          menu={{ items: menuItems }}
          trigger={["contextMenu"]}
          open={showMenu}
          onOpenChange={setShowMenu}
        >
          <div
            style={{
              backgroundColor: isSentByCurrentUser ? "#d9fdd3" : "#fff",
              borderRadius: "7.5px",
              padding: "8px 12px",
              boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.13)",
              cursor: "context-menu",
            }}
          >
            {message.forwardedFrom && (
              <Text
                style={{
                  fontSize: "11px",
                  color: "#667781",
                  fontStyle: "italic",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                Forwarded
              </Text>
            )}
            {/** Render replied message preview when available **/}
            {message.replyTo && typeof replyMessage !== 'undefined' && replyMessage && (
              <div
                style={{
                  borderLeft: "3px solid #e0e0e0",
                  paddingLeft: "8px",
                  marginBottom: "6px",
                  maxHeight: "56px",
                  overflow: "hidden",
                }}
              >
                <Text style={{ fontSize: "12px", color: "#555" }}>
                  {replyMessage.sender}: {replyMessage.content?.slice(0, 120)}
                </Text>
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                gap: "6px",
              }}
            >
              <Text
                style={{
                  color: "#111",
                  fontSize: "14.2px",
                  lineHeight: "19px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: "0",
                  flex: "1 1 auto",
                }}
              >
                {message.content}
              </Text>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                <Text
                  style={{
                    fontSize: "11px",
                    color: "#667781",
                    margin: "0",
                  }}
                >
                  {formatTime(message.createdAt)}
                </Text>
                {isSentByCurrentUser && (
                  <div
                    style={{
                      display: "flex",
                      position: "relative",
                      width: "16px",
                      height: "12px",
                      alignItems: "center",
                    }}
                  >
                    <CheckOutlined
                      style={{
                        fontSize: "11px",
                        color: "#53bdeb",
                        position: "absolute",
                        left: "0px",
                      }}
                    />
                    <CheckOutlined
                      style={{
                        fontSize: "11px",
                        color: "#53bdeb",
                        position: "absolute",
                        left: "5px",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default MessageBubble;
