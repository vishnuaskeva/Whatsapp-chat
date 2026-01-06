import { useState, useEffect, useRef } from "react";
import { Input, Button } from "antd";
import { SendOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { useSocket } from "../../context/SocketContext";

const { TextArea } = Input;

const ChatInput = ({ onSendMessage, onOpenTaskDraft, disabled, currentUser, selectedContact, conversationId, replyingMessage = null, onCancelReply }) => {
  const [messageText, setMessageText] = useState("");
  const { socket } = useSocket();
  const typingTimeoutRef = useRef(null);

  const handleTyping = (e) => {
    const text = e.target.value;
    setMessageText(text);

    // Emit typing event only if text is not empty
    if (socket && currentUser && selectedContact && conversationId) {
      if (text.trim()) {
        socket.emit("user_typing", { username: currentUser, conversationId });

        // Clear previous timeout and set new one
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("user_stopped_typing", { username: currentUser, conversationId });
        }, 3000);
      } else {
        // Empty input - emit stopped typing immediately
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socket.emit("user_stopped_typing", { username: currentUser, conversationId });
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    if (disabled) return;

    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText("");
      // Emit typing stopped
      if (socket && currentUser && selectedContact && conversationId) {
        socket.emit("user_stopped_typing", { username: currentUser, conversationId });
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: "#f0f0f0",
        borderTop: "1px solid #e5ddd5",
        gap: "12px",
      }}
    >
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 8}}>
        {replyingMessage && (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '6px 10px', borderRadius: 8, border: '1px solid #e6e6e6'}}>
            <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
              <div style={{fontSize: 12, color: '#666'}}>Replying to {replyingMessage.sender}</div>
              <div style={{fontSize: 13, color: '#111', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis'}}>{replyingMessage.content}</div>
            </div>
            <Button type="text" icon={<CloseOutlined />} onClick={onCancelReply} />
          </div>
        )}

        <Button
        type="text"
        shape="circle"
        onClick={onOpenTaskDraft}
        disabled={disabled}
        style={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
        icon={<PlusOutlined style={{ fontSize: 18, color: "#128C7E", verticalAlign: "middle" }} />}
      />

        <TextArea
          value={messageText}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          style={{
            flex: 1,
            borderRadius: "20px",
            padding: "8px 15px",
            fontSize: "14px",
            border: "1px solid #ddd",
            backgroundColor: "#fff",
            lineHeight: '1.4'
          }}
          disabled={disabled}
          variant="borderless"
        />
      </div>

      <Button
        type="text"
        shape="circle"
        onClick={handleSend}
        disabled={disabled}
        style={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
        icon={<SendOutlined style={{ fontSize: 18, color: "#25D366", verticalAlign: "middle" }} />}
      />
    </div>
  );
};

export default ChatInput;
