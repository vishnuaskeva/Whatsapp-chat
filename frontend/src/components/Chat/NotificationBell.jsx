import {
  Badge,
  Button,
  Dropdown,
  Empty,
  List,
  Space,
  Tag,
  Button as AntButton,
} from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} from "../../features/notifications/notificationApi";
import {
  markNotificationsRead,
  setNotifications,
} from "../../features/notifications/notificationSlice";
import { useEffect } from "react";

const NotificationBell = ({ currentUser }) => {
  const dispatch = useAppDispatch();
  const unreadCounts = useAppSelector(
    (state) => state.notifications.unreadCounts
  );
  const notifications = useAppSelector(
    (state) => state.notifications.notifications
  );
  const perActorCounts = unreadCounts[currentUser] || {};
  const unreadCount = Object.values(perActorCounts || {}).reduce((s, v) => s + v, 0);

  const { data: notifData } = useGetNotificationsQuery(currentUser, {
    skip: !currentUser,
  });
  const [markRead] = useMarkNotificationsReadMutation();

  // Sync RTK Query data to Redux when it arrives
  useEffect(() => {
    if (notifData && currentUser) {
      // Sync notifications array to Redux; unread per-actor counts computed in reducer
      dispatch(
        setNotifications({ owner: currentUser, notifications: notifData.notifications || [] })
      );
    }
  }, [notifData, currentUser, dispatch]);


  // prefer Redux notifications; fallback to RTK Query data
  const userNotifications = (notifications.length ? notifications : (notifData?.notifications || [])).filter(
    (n) => n.owner === currentUser
  );
  const unreadNotifications = userNotifications.filter((n) => !n.read);

  const handleMarkAllRead = async () => {
    if (unreadNotifications.length === 0) return;

    const ids = unreadNotifications.map((n) => n._id);
    try {
      await markRead({ owner: currentUser, ids }).unwrap();
      dispatch(markNotificationsRead({ owner: currentUser, ids }));
    } catch (error) {
      console.error("Failed to mark notifications read:", error);
    }
  };

  const handleNotificationClick = (notif) => {
    // Navigate to conversation with sender
    if (notif.data?.sender && notif.data?.sender !== currentUser) {
      // You can dispatch an action to set selected contact or navigate
      window.location.hash = `#chat/${notif.data.sender}`;
    }
  };

  const menuItems = [
    {
      key: "notifications",
      label: (
        <div style={{ width: "320px", maxHeight: "400px", overflowY: "auto" }}>
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5ddd5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4 style={{ margin: 0, color: "#075E54" }}>Notifications</h4>
            {unreadNotifications.length > 0 && (
              <AntButton
                type="link"
                size="small"
                onClick={handleMarkAllRead}
                style={{ color: "#25D366" }}
              >
                Mark all read
              </AntButton>
            )}
          </div>
          {userNotifications.length === 0 ? (
            <Empty
              description="No notifications"
              style={{ padding: "40px 0" }}
            />
          ) : (
            <List
              dataSource={userNotifications.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              )}
              renderItem={(notif) => (
                <List.Item
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    backgroundColor: notif.read ? "#fff" : "#fffbf0",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onClick={() => handleNotificationClick(notif)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notif.read
                      ? "#fff"
                      : "#fffbf0";
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space
                        direction="vertical"
                        size={0}
                        style={{ width: "100%" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: notif.read ? "400" : "600",
                              color: "#075E54",
                            }}
                          >
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <Tag color="green" style={{ marginLeft: "auto" }}>
                              New
                            </Tag>
                          )}
                        </div>
                        <span style={{ fontSize: "12px", color: "#999" }}>
                          {notif.body?.substring(0, 50)}
                          {notif.body?.length > 50 ? "..." : ""}
                        </span>
                        <span style={{ fontSize: "11px", color: "#bbb" }}>
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Button
        type="text"
        shape="circle"
        icon={
          <Badge
            count={unreadCount}
            showZero={false}
            style={{ backgroundColor: "#25D366" }}
            color="#25D366"
          >
            <BellOutlined style={{ fontSize: "18px", color: "#128C7E" }} />
          </Badge>
        }
      />
    </Dropdown>
  );
};

export default NotificationBell;
