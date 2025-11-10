import Notification from "../../src/models/Notification.mjs";

/**
 * Create and emit a notification
 * @param {Object} io - Socket.IO instance
 * @param {Map} userSockets - User socket mappings
 * @param {Object} notificationData - Notification data
 */
export async function createAndEmitNotification(io, userSockets, notificationData) {
  try {
    // Create notification in database
    const notification = await Notification.create(notificationData);
    
    // Populate fromUser if exists
    if (notification.fromUser) {
      await notification.populate('fromUser', 'name image handle');
    }

    // Get recipient's socket
    const recipientSocketId = userSockets.get(notificationData.to.toString());
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      to: notificationData.to,
      read: false,
    });

    if (recipientSocketId) {
      // User is online - emit notification
      io.to(recipientSocketId).emit('notification:new', {
        notification: notification.toObject(),
        unreadCount,
      });
      console.log(`✅ Notification sent to user ${notificationData.to}, unread: ${unreadCount}`);
    } else {
      console.log(`User ${notificationData.to} is offline, notification saved to DB`);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Register notification-related socket handlers
 */
export function registerNotificationHandlers(socket, io, userSockets) {
  
  /**
   * Mark notification as read
   */
  socket.on('notification:mark-read', async ({ notificationId }, callback) => {
    console.log('📖 Server: Mark as read request:', notificationId);
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, to: socket.userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        console.log('❌ Server: Notification not found');
        return callback?.({ success: false, error: 'Notification not found' });
      }

      // Get updated unread count
      const unreadCount = await Notification.countDocuments({
        to: socket.userId,
        read: false,
      });

      console.log('✅ Server: Marked as read, unread count:', unreadCount);

      // Emit to user's other devices
      const userSocketId = userSockets.get(socket.userId);
      if (userSocketId) {
        io.to(userSocketId).emit('notification:read', {
          notificationId,
          unreadCount,
        });
      }

      callback?.({ 
        success: true, 
        notification: notification.toObject(),
        unreadCount 
      });
      console.log('✅ Server: Callback sent');
    } catch (error) {
      console.error('❌ Server: Error marking notification as read:', error);
      callback?.({ success: false, error: error.message });
    }
  });

  /**
   * Mark all notifications as read
   */
  socket.on('notification:mark-all-read', async (data, callback) => {
    try {
      await Notification.updateMany(
        { to: socket.userId, read: false },
        { read: true }
      );

      // Emit to user's other devices
      const userSocketId = userSockets.get(socket.userId);
      if (userSocketId) {
        io.to(userSocketId).emit('notification:all-read', {
          unreadCount: 0,
        });
      }

      callback?.({ success: true, unreadCount: 0 });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      callback?.({ success: false, error: error.message });
    }
  });

  /**
   * Delete notification
   */
  socket.on('notification:delete', async ({ notificationId }, callback) => {
    console.log('🗑️ Server: Delete request:', notificationId);
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        to: socket.userId,
      });

      if (!notification) {
        console.log('❌ Server: Notification not found');
        return callback?.({ success: false, error: 'Notification not found' });
      }

      // Get updated unread count
      const unreadCount = await Notification.countDocuments({
        to: socket.userId,
        read: false,
      });

      console.log('✅ Server: Deleted, unread count:', unreadCount);

      // Emit to user's other devices
      const userSocketId = userSockets.get(socket.userId);
      if (userSocketId) {
        io.to(userSocketId).emit('notification:deleted', {
          notificationId,
          unreadCount,
        });
      }

      callback?.({ success: true, unreadCount });
      console.log('✅ Server: Callback sent');
    } catch (error) {
      console.error('❌ Server: Error deleting notification:', error);
      callback?.({ success: false, error: error.message });
    }
  });

  /**
   * Get unread count
   */
  socket.on('notification:get-unread-count', async (data, callback) => {
    try {
      const unreadCount = await Notification.countDocuments({
        to: socket.userId,
        read: false,
      });

      callback?.({ success: true, count: unreadCount });
    } catch (error) {
      console.error('Error getting unread count:', error);
      callback?.({ success: false, error: error.message });
    }
  });
}
