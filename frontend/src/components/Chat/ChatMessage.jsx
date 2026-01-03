import MessageBubble from "./MessageBubble";
import ChatTaskPreview from "./ChatTaskPreview";

const ChatMessage = ({ message, currentUser, showSenderName }) => {
  if (message.type === "task") {
    const isSentByCurrentUser = message.sender === currentUser;
    return (
      <div
        style={{
          display: "flex",
          justifyContent: isSentByCurrentUser ? "flex-end" : "flex-start",
          padding: "0 16px",
        }}
      >
        <ChatTaskPreview task={message.task} />
      </div>
    );
  }

  return (
    <MessageBubble
      message={message}
      currentUser={currentUser}
      showSenderName={showSenderName}
    />
  );
};

export default ChatMessage;
