'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/components/layout/NotificationContext';
import NotificationItem from './NotificationItem';
import { CheckIcon, BellSlashIcon, BellIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui';
import silentMode from '@/lib/silentMode';

/**
 * Notification Dropdown Panel
 * Shows list of notifications with actions
 */
export default function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, loading, markAllAsRead } = useNotifications();
  const [isSilent, setIsSilent] = useState(silentMode.isEnabled());

  useEffect(() => {
    // Listen for silent mode changes
    const cleanup = silentMode.addListener((enabled) => {
      setIsSilent(enabled);
    });
    return cleanup;
  }, []);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const toggleSilentMode = () => {
    const newState = silentMode.toggle();
    setIsSilent(newState);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-[10px] sm:text-xs text-gray-600">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mark all read</span>
              <span className="sm:hidden">Read all</span>
            </button>
          )}
        </div>
        
        {/* Silent Mode Toggle */}
        <button
          onClick={toggleSilentMode}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
            isSilent
              ? 'bg-gray-100 text-gray-700'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            {isSilent ? (
              <BellSlashIcon className="h-4 w-4" />
            ) : (
              <BellIcon className="h-4 w-4" />
            )}
            <span className="text-xs sm:text-sm font-medium">
              {isSilent ? 'Silent mode' : 'Sound notifications'}
            </span>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isSilent
              ? 'bg-gray-200 text-gray-600'
              : 'bg-blue-100 text-blue-600'
          }`}>
            {isSilent ? 'OFF' : 'ON'}
          </div>
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Spinner size="md" variant="primary" />
            <p className="mt-3 sm:mt-4 text-gray-500 text-xs sm:text-sm">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <BellSlashIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-1 text-sm sm:text-base">No notifications</p>
            <p className="text-gray-500 text-xs sm:text-sm text-center">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200">
          <button
            onClick={() => {
              onClose();
              window.location.href = '/notifications';
            }}
            className="w-full text-center text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </motion.div>
  );
}
