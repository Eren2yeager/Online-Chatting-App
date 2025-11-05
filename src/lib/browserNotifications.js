/**
 * Browser Notification Service
 * Handles browser notification permissions and display
 */

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported() {
  return "Notification" in window;
}

/**
 * Check if notification permission is granted
 */
export function isNotificationGranted() {
  if (!isNotificationSupported()) return false;
  return Notification.permission === "granted";
}

/**
 * Check if notification permission is denied
 */
export function isNotificationDenied() {
  if (!isNotificationSupported()) return false;
  return Notification.permission === "denied";
}

/**
 * Check if we should ask for permission
 * (not granted and not denied)
 */
export function shouldAskPermission() {
  if (!isNotificationSupported()) return false;
  return Notification.permission === "default";
}

/**
 * Request notification permission
 * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    console.warn("Browser notifications are not supported");
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    
    // Store permission in localStorage
    localStorage.setItem("notification-permission", permission);
    localStorage.setItem("notification-permission-date", new Date().toISOString());
    
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
}

/**
 * Show a browser notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} options.icon - Notification icon URL
 * @param {string} options.tag - Notification tag (for grouping)
 * @param {Object} options.data - Custom data
 * @param {Function} options.onClick - Click handler
 * @returns {Notification|null} Notification instance or null
 */
export function showNotification({
  title,
  body,
  icon = "/icon-192.png",
  tag,
  data = {},
  onClick,
}) {
  if (!isNotificationGranted()) {
    console.warn("Notification permission not granted");
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon,
      tag,
      data,
      badge: "/icon-96.png",
      requireInteraction: false,
      silent: false,
    });

    // Handle click
    if (onClick) {
      notification.onclick = (event) => {
        event.preventDefault();
        onClick(notification, event);
        notification.close();
      };
    } else {
      // Default: focus window
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };
    }

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
}

/**
 * Check if user is currently viewing the page
 */
export function isPageVisible() {
  return document.visibilityState === "visible" && document.hasFocus();
}

/**
 * Show notification only if page is not visible
 * @param {Object} options - Same as showNotification
 */
export function showNotificationIfHidden(options) {
  if (!isPageVisible()) {
    return showNotification(options);
  }
  return null;
}

/**
 * Get permission status from localStorage
 */
export function getStoredPermission() {
  return localStorage.getItem("notification-permission");
}

/**
 * Check if we should show permission prompt
 * (not asked before or asked more than 7 days ago)
 */
export function shouldShowPermissionPrompt() {
  if (!shouldAskPermission()) return false;

  const lastAsked = localStorage.getItem("notification-permission-asked");
  if (!lastAsked) return true;

  const daysSinceAsked = (Date.now() - new Date(lastAsked).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceAsked > 7; // Ask again after 7 days
}

/**
 * Mark that we asked for permission
 */
export function markPermissionAsked() {
  localStorage.setItem("notification-permission-asked", new Date().toISOString());
}

/**
 * Dismiss permission prompt (don't ask again for 7 days)
 */
export function dismissPermissionPrompt() {
  markPermissionAsked();
}
