/**
 * Client-side Socket API for Notifications
 * Real-time notification handling via Socket.IO
 */

/**
 * Mark notification as read via socket
 * @param {Object} socket - Socket instance
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Response with notification and unread count
 */
export function markNotificationAsRead(socket, notificationId) {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      return reject(new Error('Socket not connected'));
    }

    socket.emit('notification:mark-read', { notificationId }, (response) => {
      if (response?.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || 'Failed to mark notification as read'));
      }
    });
  });
}

/**
 * Mark all notifications as read via socket
 * @param {Object} socket - Socket instance
 * @returns {Promise<Object>} Response with unread count
 */
export function markAllNotificationsAsRead(socket) {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      return reject(new Error('Socket not connected'));
    }

    socket.emit('notification:mark-all-read', {}, (response) => {
      if (response?.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || 'Failed to mark all notifications as read'));
      }
    });
  });
}

/**
 * Delete notification via socket
 * @param {Object} socket - Socket instance
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Response with unread count
 */
export function deleteNotification(socket, notificationId) {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      return reject(new Error('Socket not connected'));
    }

    socket.emit('notification:delete', { notificationId }, (response) => {
      if (response?.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || 'Failed to delete notification'));
      }
    });
  });
}

/**
 * Get unread notification count via socket
 * @param {Object} socket - Socket instance
 * @returns {Promise<number>} Unread count
 */
export function getUnreadCount(socket) {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      return reject(new Error('Socket not connected'));
    }

    socket.emit('notification:get-unread-count', {}, (response) => {
      if (response?.success) {
        resolve(response.count);
      } else {
        reject(new Error(response?.error || 'Failed to get unread count'));
      }
    });
  });
}

/**
 * Listen for new notifications
 * @param {Object} socket - Socket instance
 * @param {Function} callback - Callback function (notification, unreadCount)
 * @returns {Function} Cleanup function
 */
export function onNotificationNew(socket, callback) {
  const handler = (data) => {
    callback(data.notification, data.unreadCount);
  };

  socket.on('notification:new', handler);

  // Return cleanup function
  return () => {
    socket.off('notification:new', handler);
  };
}

/**
 * Listen for notification read events
 * @param {Object} socket - Socket instance
 * @param {Function} callback - Callback function (notificationId, unreadCount)
 * @returns {Function} Cleanup function
 */
export function onNotificationRead(socket, callback) {
  const handler = (data) => {
    callback(data.notificationId, data.unreadCount);
  };

  socket.on('notification:read', handler);

  return () => {
    socket.off('notification:read', handler);
  };
}

/**
 * Listen for all notifications marked as read
 * @param {Object} socket - Socket instance
 * @param {Function} callback - Callback function (unreadCount)
 * @returns {Function} Cleanup function
 */
export function onAllNotificationsRead(socket, callback) {
  const handler = (data) => {
    callback(data.unreadCount);
  };

  socket.on('notification:all-read', handler);

  return () => {
    socket.off('notification:all-read', handler);
  };
}

/**
 * Listen for notification deleted events
 * @param {Object} socket - Socket instance
 * @param {Function} callback - Callback function (notificationId, unreadCount)
 * @returns {Function} Cleanup function
 */
export function onNotificationDeleted(socket, callback) {
  const handler = (data) => {
    callback(data.notificationId, data.unreadCount);
  };

  socket.on('notification:deleted', handler);

  return () => {
    socket.off('notification:deleted', handler);
  };
}
