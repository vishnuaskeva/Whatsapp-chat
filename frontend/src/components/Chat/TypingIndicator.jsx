import { Typography } from "antd";

const { Text } = Typography;

const TypingIndicator = ({ typingUsers = {} }) => {
  const typingList = Object.keys(typingUsers).filter((u) => typingUsers[u]);

  if (typingList.length === 0) return null;

  return (
    <div style={{ padding: "8px 16px", minHeight: "20px" }}>
      <Text style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>
        {typingList.length === 1
          ? `${typingList[0]} is typing`
          : `${typingList.join(", ")} are typing`}
        <span style={{ marginLeft: "4px" }}>
          <span style={{ animation: "blink 1.4s infinite" }}>.</span>
          <span style={{ animation: "blink 1.4s infinite", animationDelay: "0.2s" }}>.</span>
          <span style={{ animation: "blink 1.4s infinite", animationDelay: "0.4s" }}>.</span>
        </span>
      </Text>
      <style>{`
        @keyframes blink {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
