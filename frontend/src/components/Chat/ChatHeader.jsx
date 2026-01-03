import { Avatar, Typography } from "antd";
import NotificationBell from "./NotificationBell";

const { Title, Text } = Typography;

const ChatHeader = ({ contactName, currentUser }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
        <Avatar
          size={40}
          style={{
            backgroundColor: "#e0e0e0",
            marginRight: "12px",
            color: "#666",
            fontWeight: "bold",
          }}
        >
          {contactName ? contactName.charAt(0).toUpperCase() : "?"}
        </Avatar>
        <div>
          <Title
            level={5}
            style={{ margin: 0, color: "#000", fontWeight: "500" }}
          >
            {contactName || "Select a contact"}
          </Title>
          <Text style={{ color: "#888", fontSize: "12px" }}>
            {contactName ? "Online" : "Waiting for selection"}
          </Text>
        </div>
      </div>
      {currentUser && <NotificationBell currentUser={currentUser} />}
    </div>
  );
};

export default ChatHeader;
