/**
 * Notification Handler
 * Handles all notification-related socket events
 */

import Notification from '../../src/models/Notification.js';
import User from '../../src/models/User.js';

/**
 * Register notification socket handlers
 */
export function registerNotificationHandlers(io, socket) {
  // Fetch notifications for current user
  socket.on('notification:fetch', async (data, callback) => {
    try {
      const userId = socket.user._id;
      const { page = 1, limit = 20 } = data || {};

      const skip = (page - 1) * limit;

      const notifications = await Notification.find({ to: userId })
        .populate('fromUser', 'name image handle')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Notification.countDocuments({ to: userId });
      const unreadCount = await Notification.countDocuments({ to: userId, read: false });

      callback?.({
        success: true,
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + notifications.length < total,
        },
        unreadCount,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      callback?.({
        success: false,
        error: 'Failed to fetch notifications',
      });
    }
  });

  // Get unread notification count
  socket.on('notification:get-unread-count', async (data, callback) => {
    try {
      const userId = socket.user._id;

      const unreadCount = await Notification.countDocuments({
        to: userId,
        read: false,
      });

      callback?.({
        success: true,
        count: unreadCount,
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      callback?.({
        success: false,
        error: 'Failed to get unread count',
      });
    }
  });

  // Mark notification as read
  socket.on('notification:mark-read', async (data, callback) => {
    try {
      const userId = socket.user._id;
      const { notificationId } = data;

      if (!notificationId) {
        return callback?.({
          success: false,
          error: 'Notification ID is required',
        });
      }

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, to: userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return callback?.({
          success: false,
          error: 'Notification not found',
        });
      }

      // Get updated unread count
      const unreadCount = await Notification.countDocuments({
        to: userId,
        read: false,
      });

      // Emit to user's other sessions
      io.to(`user:${userId}`).emit('notification:read', {
        notificationId,
        unreadCount,
      });

      callback?.({
        success: true,
        notification,
        unreadCount,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      callback?.({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }
  });

  // Mark all notifications as read
  socket.on('notification:mark-all-read', async (data, callback) => {
    try {
      const userId = socket.user._id;

      await Notification.updateMany(
        { to: userId, read: false },
        { read: true }
      );

      // Emit to user's other sessions
      io.to(`user:${userId}`).emit('notification:all-read');

      callback?.({
        success: true,
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      callback?.({
        success: false,
        error: 'Failed to mark all notifications as read',
      });
    }
  });

  // Delete notification
  socket.on('notification:delete', async (data, callback) => {
    try {
      const userId = socket.user._id;
      const { notificationId } = data;

      if (!notificationId) {
        return callback?.({
          success: false,
          error: 'Notification ID is required',
        });
      }

      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        to: userId,
      });

      if (!notification) {
        return callback?.({
          success: false,
          error: 'Notification not found',
        });
      }

      // Get updated unread count
      const unreadCount = await Notification.countDocuments({
        to: userId,
        read: false,
      });

      // Emit to user's other sessions
      io.to(`user:${userId}`).emit('notification:deleted', {
        notificationId,
        unreadCount,
      });

      callback?.({
        success: true,
        unreadCount,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      callback?.({
        success: false,
        error: 'Failed to delete notification',
      });
    }
  });
}

/**
 * Helper function to create a notification
 */
export async function createNotification(io, {
  to,
  type,
  title,
  body,
  data = {},
  chatId = null,
  messageId = null,
  fromUser = null,
}) {
  try {
    // Don't create notification if user is the same as fromUser
    if (to.toString() === fromUser?.toString()) {
      return null;
    }

    const notification = await Notification.create({
      to,
      type,
      title,
      body,
      data,
      chatId,
      messageId,
      fromUser,
    });

    // Populate fromUser
    await notification.populate('fromUser', 'name image handle');

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      to,
      read: false,
    });

    // Emit to user if they're online
    io.to(`user:${to}`).emit('notification:new', {
      notification: notification.toObject(),
      unreadCount,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Helper function to delete notifications by criteria
 */
export async function deleteNotifications(io, criteria) {
  try {
    const notifications = await Notification.find(criteria);
    
    for (const notification of notifications) {
      await notification.deleteOne();
      
      // Get updated unread count
      const unreadCount = await Notification.countDocuments({
        to: notification.to,
        read: false,
      });

      // Emit to user
      io.to(`user:${notification.to}`).emit('notification:deleted', {
        notificationId: notification._id,
        unreadCount,
      });
    }

    return notifications.length;
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return 0;
  }
}
