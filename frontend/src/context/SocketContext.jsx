import { createContext, useContext, useEffect, useState } from "react";
import socket from "../services/socketClient";
import { useDispatch, useSelector } from "react-redux";
import {
  addNotification,
  setNotifications,
} from "../features/notifications/notificationSlice";
import { notification as antNotification } from "antd";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.chat?.currentUser);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setIsConnected(true);
      // Register user on connection
      if (currentUser) {
        socket.emit("register_user", currentUser);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", () => {
      // connection errors are silently handled here
    });

    // Listen for notifications
    socket.on("notification", (notificationData) => {
      // update Redux store (per-actor unread counts handled in reducer)
      dispatch(addNotification(notificationData));

      // Show toast notification
      antNotification.info({
        message: notificationData.title,
        description: notificationData.body,
        duration: 4.5,
        placement: "topRight",
      });
    });

    // Cleanup on unmount
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("notification");
      socket.disconnect();
    };
  }, [currentUser, dispatch]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
