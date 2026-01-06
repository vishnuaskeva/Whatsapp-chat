import MessageBubble from "./MessageBubble";
import ChatTaskPreview from "./ChatTaskPreview";

const ChatMessage = ({
  message,
  replyMessage = null,
  currentUser,
  showSenderName,
  onDelete,
  onForward,
  onReply,
}) => {
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
      replyMessage={replyMessage}
      currentUser={currentUser}
      showSenderName={showSenderName}
      onDelete={onDelete}
      onForward={onForward}
      onReply={onReply}
    />
  );
};

export default ChatMessage;
