import { Avatar, Typography } from "antd";
import { CheckOutlined } from "@ant-design/icons";

const { Text } = Typography;

const MessageBubble = ({ message, currentUser, showSenderName = true }) => {
  const isSentByCurrentUser = message.sender === currentUser;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

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
      {!isSentByCurrentUser && false && (
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
        <div
          style={{
            backgroundColor: isSentByCurrentUser ? "#d9fdd3" : "#fff",
            borderRadius: "7.5px",
            padding: "8px 12px",
            boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.13)",
          }}
        >
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
      </div>
    </div>
  );
};

export default MessageBubble;
