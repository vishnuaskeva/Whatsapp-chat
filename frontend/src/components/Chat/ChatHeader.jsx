import { Avatar, Typography } from "antd";
import NotificationBell from "./NotificationBell";

const { Title, Text } = Typography;

const ChatHeader = ({ contactName, currentUser, isOnline, lastSeen }) => {
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "a while ago";
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "a while ago";
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      // Format time as HH:MM AM/PM
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });

      if (diffMins < 1) return "last seen just now";
      if (diffMins < 60) return `last seen ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      
      // For days, show more WhatsApp-like format
      if (diffDays === 1) return `last seen yesterday at ${timeStr}`;
      if (diffDays < 7) return `last seen ${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${timeStr}`;
      
      // For older dates, show date and time
      return `last seen ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeStr}`;
    } catch (err) {
      void err;
      return "last seen a while ago";
    }
  };

  const statusText = isOnline ? "Online" : `last seen ${formatLastSeen(lastSeen)}`;

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
            {contactName ? statusText : "Waiting for selection"}
          </Text>
        </div>
      </div>
      {currentUser && <NotificationBell currentUser={currentUser} />}
    </div>
  );
};

export default ChatHeader;
