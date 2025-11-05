"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { useSocket, useSocketEmitter } from "@/lib/socket";
import {
  fetchNotifications as apiFetchNotifications,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  getUnreadCount as apiGetUnreadCount,
} from "@/lib/client/notifications";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const { emitAck } = useSocketEmitter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (pageNum = 1, append = false) => {
      if (!session?.user) return;

      try {
        setLoading(true);
        const data = await apiFetchNotifications(pageNum, 20);

        if (append) {
          setNotifications((prev) => [...prev, ...data.data]);
        } else {
          setNotifications(data.data);
        }

        setUnreadCount(data.unreadCount);
        setHasMore(data.pagination.hasMore);
        setPage(pageNum);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // Load more notifications
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const data = await apiMarkAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const data = await apiDeleteNotification(notificationId);

      // Update local state
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await apiGetUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error refreshing unread count:", error);
    }
  }, []);

  // Socket listener: New notification
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (data) => {
      const { notification, unreadCount: newCount } = data;

      // Add to beginning of list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount(newCount);

      // Show browser notification if page is not visible
      if ("Notification" in window && Notification.permission === "granted") {
        // Only show if page is not visible or not focused
        if (document.visibilityState !== "visible" || !document.hasFocus()) {
          const browserNotification = new Notification(notification.title, {
            body: notification.body,
            icon: notification.fromUser?.image || "/icon-192.png",
            tag: notification._id,
            badge: "/icon-96.png",
            requireInteraction: false,
          });

          // Handle click - navigate to relevant page
          browserNotification.onclick = (event) => {
            event.preventDefault();
            window.focus();

            // Navigate based on notification type
            if (notification.type === "message" && notification.chatId) {
              window.location.href = `/chats?chat=${notification.chatId}`;
            } else if (notification.type === "friend_request") {
              window.location.href = "/friends";
            } else if (
              notification.type === "group_invite" &&
              notification.chatId
            ) {
              window.location.href = `/chats?chat=${notification.chatId}`;
            }

            browserNotification.close();
          };

          // Auto-close after 5 seconds
          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        }
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, isConnected]);

  // Socket listener: Notification read
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotificationRead = (data) => {
      const { notificationId, unreadCount: newCount } = data;

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(newCount);
    };

    socket.on("notification:read", handleNotificationRead);

    return () => {
      socket.off("notification:read", handleNotificationRead);
    };
  }, [socket, isConnected]);

  // Socket listener: All notifications read
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleAllRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    };

    socket.on("notification:all-read", handleAllRead);

    return () => {
      socket.off("notification:all-read", handleAllRead);
    };
  }, [socket, isConnected]);

  // Socket listener: Notification deleted
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotificationDeleted = (data) => {
      const { notificationId, unreadCount: newCount } = data;

      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setUnreadCount(newCount);
    };

    socket.on("notification:deleted", handleNotificationDeleted);

    return () => {
      socket.off("notification:deleted", handleNotificationDeleted);
    };
  }, [socket, isConnected]);

  // Initial fetch
  useEffect(() => {
    if (session?.user && isConnected) {
      fetchNotifications(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, isConnected]);

  const value = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
