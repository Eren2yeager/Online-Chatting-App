'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/components/layout/NotificationContext';
import NotificationItem from '@/components/notifications/NotificationItem';
import { 
  BellIcon, 
  BellSlashIcon, 
  CheckIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';
import { Spinner, Button } from '@/components/ui';
import { motion } from 'framer-motion';
import { Loader } from '@/components/ui';
/**
 * Full Notifications Page
 * Shows all notifications with filtering and actions
 */
export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAllAsRead, 
    refetch 
  } = useNotifications();
  
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [deleting, setDeleting] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) return;
    
    setDeleting(true);
    try {
      // Delete all notifications via API
      await Promise.all(
        notifications.map(n => 
          fetch(`/api/notifications/${n._id}`, { method: 'DELETE' })
        )
      );
      await refetch();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BellIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMarkAllRead}
                  icon={<CheckIcon className="h-4 w-4" />}
                >
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={deleting}
                  icon={<TrashIcon className="h-4 w-4" />}
                >
                  {deleting ? 'Clearing...' : 'Clear all'}
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 sm:gap-2">
            {['all', 'unread', 'read'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  filter === filterOption
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                {filterOption === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-[10px] sm:text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" variant="primary" />
              <p className="mt-4 text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <BellSlashIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'unread' 
                  ? 'No unread notifications' 
                  : filter === 'read'
                  ? 'No read notifications'
                  : 'No notifications'}
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                {filter === 'all'
                  ? "You're all caught up! We'll notify you when something new happens."
                  : filter === 'unread'
                  ? "You've read all your notifications. Great job staying on top of things!"
                  : "You haven't read any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NotificationItem notification={notification} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {notifications.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              <span>{unreadCount} unread</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
              <span>{notifications.length - unreadCount} read</span>
            </div>
            <div className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              <span>{notifications.length} total</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
