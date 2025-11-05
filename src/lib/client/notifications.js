/**
 * Client-side API functions for notifications
 */

/**
 * Fetch notifications (paginated)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} type - Optional filter by type
 * @returns {Promise<Object>} Notifications data
 */
export async function fetchNotifications(page = 1, limit = 20, type = null) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) {
      params.append("type", type);
    }

    const response = await fetch(`/api/notifications?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch notifications");
    }

    return data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH",
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to mark notification as read");
    }

    return data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Success response
 */
export async function markAllNotificationsAsRead() {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to mark all notifications as read");
    }

    return data;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Success response
 */
export async function deleteNotification(notificationId) {
  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to delete notification");
    }

    return data;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

/**
 * Get unread notification count
 * @returns {Promise<number>} Unread count
 */
export async function getUnreadCount() {
  try {
    const response = await fetch("/api/notifications/unread-count");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to get unread count");
    }

    return data.count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
}
