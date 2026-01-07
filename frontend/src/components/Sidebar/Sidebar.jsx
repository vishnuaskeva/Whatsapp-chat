import { useState, useMemo } from "react";
import { Layout, List, Typography, Input, Avatar } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ChatListItem from "./ChatListItem";

const { Sider } = Layout;
const { Title, Text } = Typography;

const Sidebar = ({
  currentUser,
  contacts,
  selectedContact,
  onSelectContact,
  unreadCounts,
  lastMessages = {},
  messageTimestamps = {},
  userStatusMap = {},
}) => {
  const [searchText, setSearchText] = useState("");

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) =>
      contact.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [contacts, searchText]);

  return (
    <Sider
      width={300}
      breakpoint="lg"
      collapsedWidth={0}
      style={{
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: "1px solid #e5ddd5",
      }}
    >
      {/* Header with User Profile and Search */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* User Profile */}
        <Avatar
          size={36}
          style={{
            backgroundColor: "#e0e0e0",
            fontSize: "16px",
            fontWeight: "bold",
            color: "#666",
            flexShrink: 0,
          }}
        >
          {currentUser?.charAt(0).toUpperCase()}
        </Avatar>

        {/* Search Bar */}
        <Input
          placeholder="Search contacts..."
          prefix={
            <SearchOutlined style={{ color: "#888", marginRight: "8px" }} />
          }
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            borderRadius: "20px",
            padding: "10px 16px",
            fontSize: "14px",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            color: "#000",
            flex: 1,
          }}
          allowClear
        />
      </div>

      {/* Contacts List */}
      <List
        dataSource={filteredContacts}
        renderItem={(name) => {
          // unreadCounts may be a number or an object of per-actor counts
          const raw = unreadCounts?.[name];
          const unreadCount =
            typeof raw === "number"
              ? raw
              : raw && typeof raw === "object"
              ? Object.values(raw).reduce((s, v) => s + (Number(v) || 0), 0)
              : 0;

          return (
            <ChatListItem
              key={name}
              contactName={name}
              active={name === selectedContact}
              onSelect={() => onSelectContact(name)}
              unreadCount={unreadCount}
              lastMessage={lastMessages?.[name] || ""}
              messageTimestamp={messageTimestamps?.[name]}
              isOnline={userStatusMap[name]?.isOnline || false}
            />
          );
        }}
        locale={{ emptyText: "No contacts available" }}
        style={{
          flex: 1,
          overflowY: "auto",
          borderTop: "1px solid #f0f0f0",
          backgroundColor: "#fff",
        }}
      />
    </Sider>
  );
};

export default Sidebar;
