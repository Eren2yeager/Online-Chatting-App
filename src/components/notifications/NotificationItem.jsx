'use client';

import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/layout/NotificationContext';
import { UserAvatar } from '@/components/ui';
import { 
  UserPlusIcon, 
  ChatBubbleLeftIcon, 
  XMarkIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

/**
 * Individual Notification Item
 * Displays notification with icon, message, and actions
 */
export default function NotificationItem({ notification, onClose }) {
  const router = useRouter();
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = async () => {
    console.log('🖱️ Notification clicked:', notification._id);
    
    // Mark as read
    if (!notification.read) {
      console.log('📖 Marking as read...');
      await markAsRead(notification._id);
    }

    // Navigate based on type
    if (notification.type === 'message' && notification.chatId) {
      console.log('📨 Navigating to chat:', notification.chatId);
      router.push(`/chats/${notification.chatId}`);
      onClose?.();
    } else if (notification.type === 'friend_request' || notification.type === 'friend_request_accepted') {
      console.log('👥 Navigating to friends');
      router.push('/friends');
      onClose?.();
    } else if (notification.type === 'group_invite' && notification.chatId) {
      console.log('👥 Navigating to group chat:', notification.chatId);
      router.push(`/chats/${notification.chatId}`);
      onClose?.();
    } else if (notification.type === 'group_update' && notification.chatId) {
      console.log('👥 Navigating to group chat:', notification.chatId);
      router.push(`/chats/${notification.chatId}`);
      onClose?.();
    } else if (notification.type === 'reaction' && notification.chatId) {
      console.log('❤️ Navigating to chat with reaction:', notification.chatId);
      router.push(`/chats/${notification.chatId}`);
      onClose?.();
    }
  };

  const handleDelete = async (e) => {
    console.log('🗑️ Delete button clicked:', notification._id);
    e.stopPropagation();
    e.preventDefault();
    await deleteNotification(notification._id);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'friend_request':
        return <UserPlusIcon className="h-5 w-5 text-green-600" />;
      case 'friend_request_accepted':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'message':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-600" />;
      case 'group_invite':
        return <UserPlusIcon className="h-5 w-5 text-purple-600" />;
      case 'group_update':
        return <CheckCircleIcon className="h-5 w-5 text-purple-600" />;
      case 'reaction':
        return <span className="text-base">❤️</span>;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`w-full p-3 sm:p-4 hover:bg-gray-50 transition-colors relative group cursor-pointer ${
        !notification.read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Avatar or Icon - Clickable to profile */}
        {notification.fromUser ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (notification.fromUser?.handle) {
                router.push(`/profile/${notification.fromUser.handle}`);
                onClose?.();
              }
            }}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
            title={`View ${notification.fromUser.name}'s profile`}
          >
            <UserAvatar
              user={notification.fromUser}
              size="sm"
              showStatus={false}
              showName={false}
              clickable = {false}
            />
          </button>
        ) : (
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <div className="scale-75 sm:scale-100">
              {getIcon()}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
              {/* Title - Clickable if it's a user name */}
              {notification.fromUser ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (notification.fromUser?.handle) {
                      router.push(`/profile/${notification.fromUser.handle}`);
                      onClose?.();
                    }
                  }}
                  className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline truncate block text-left"
                >
                  {notification.title}
                </button>
              ) : (
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                  {notification.title}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-0.5">
                {notification.body}
              </p>
            </div>
            
            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all flex-shrink-0 z-10"
              title="Delete notification"
            >
              <XMarkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
            </button>
          </div>

          {/* Time and Unread Indicator */}
          <div className="flex items-center gap-2 mt-1 cursor-pointer" onClick={handleClick}>
            <span className="text-[10px] sm:text-xs text-gray-500">
              {formatTime(notification.createdAt)}
            </span>
            {!notification.read && (
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-600 rounded-full"></div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
