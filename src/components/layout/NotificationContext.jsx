'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/lib/socket';
import * as socketNotifications from '@/lib/client/socket-notifications';
import * as browserNotifications from '@/lib/browserNotifications';
import notificationSound from '@/lib/notificationSound';
import silentMode from '@/lib/silentMode';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=20');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⚠️ Socket not connected:', { socket: !!socket, isConnected });
      return;
    }
    
    console.log('✅ Socket connected, setting up notification listeners');

    // Listen for new notifications
    const cleanupNew = socketNotifications.onNotificationNew(socket, (notification, newUnreadCount) => {
      console.log('✅ New notification received:', notification);
      console.log('✅ Unread count:', newUnreadCount);
      
      // Add to list
      setNotifications(prev => [notification, ...prev]);
      if (typeof newUnreadCount === 'number') {
        setUnreadCount(newUnreadCount);
      } else {
        setUnreadCount(prev => prev + 1);
      }

      // Play notification sound (unless silent mode is on)
      if (!silentMode.isEnabled()) {
        notificationSound.play();
      }

      // Show browser notification if page is hidden
      browserNotifications.showNotificationIfHidden({
        title: notification.title || 'New Notification',
        body: notification.body || '',
        icon: notification.fromUser?.image || '/user.jpg',
        tag: notification._id,
        data: notification,
        onClick: () => {
          window.focus();
          // Handle notification click based on type
          if (notification.type === 'message' && notification.chatId) {
            window.location.href = `/chats/${notification.chatId}`;
          } else if (notification.type === 'friend_request') {
            window.location.href = '/friends';
          }
        },
      });
    });

    // Listen for notification read
    const cleanupRead = socketNotifications.onNotificationRead(socket, (notificationId, newUnreadCount) => {
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(newUnreadCount);
    });

    // Listen for all read
    const cleanupAllRead = socketNotifications.onAllNotificationsRead(socket, (newUnreadCount) => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(newUnreadCount);
    });

    // Listen for notification deleted
    const cleanupDeleted = socketNotifications.onNotificationDeleted(socket, (notificationId, newUnreadCount) => {
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(newUnreadCount);
    });

    return () => {
      cleanupNew();
      cleanupRead();
      cleanupAllRead();
      cleanupDeleted();
    };
  }, [socket, isConnected]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId) => {
    console.log('📖 Marking notification as read:', notificationId);
    
    if (!socket || !isConnected) {
      console.log('📖 Using HTTP fallback');
      // Fallback to HTTP
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'PATCH',
        });
        const data = await response.json();
        if (data.success) {
          setNotifications(prev =>
            prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
          );
          setUnreadCount(data.unreadCount);
          console.log('✅ Marked as read via HTTP');
        }
      } catch (error) {
        console.error('❌ Error marking notification as read:', error);
      }
      return;
    }

    try {
      console.log('📖 Using socket');
      const result = await socketNotifications.markNotificationAsRead(socket, notificationId);
      console.log('✅ Marked as read via socket:', result);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }, [socket, isConnected]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!socket || !isConnected) {
      // Fallback to HTTP
      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
        });
        const data = await response.json();
        if (data.success) {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
      return;
    }

    try {
      await socketNotifications.markAllNotificationsAsRead(socket);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [socket, isConnected]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    console.log('🗑️ Deleting notification:', notificationId);
    
    if (!socket || !isConnected) {
      console.log('🗑️ Using HTTP fallback');
      // Fallback to HTTP
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          setNotifications(prev => prev.filter(n => n._id !== notificationId));
          setUnreadCount(data.unreadCount);
          console.log('✅ Deleted via HTTP');
        }
      } catch (error) {
        console.error('❌ Error deleting notification:', error);
      }
      return;
    }

    try {
      console.log('🗑️ Using socket');
      const result = await socketNotifications.deleteNotification(socket, notificationId);
      console.log('✅ Deleted via socket:', result);
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  }, [socket, isConnected]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
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
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
