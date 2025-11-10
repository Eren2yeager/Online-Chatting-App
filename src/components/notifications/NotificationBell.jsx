'use client';

import { useState, useRef, useEffect } from 'react';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/components/layout/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import silentMode from '@/lib/silentMode';

/**
 * Notification Bell Icon with Badge
 * Shows unread count and opens dropdown
 */
export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isSilent, setIsSilent] = useState(silentMode.isEnabled());
  const bellRef = useRef(null);

  // Listen for silent mode changes
  useEffect(() => {
    const cleanup = silentMode.addListener((enabled) => {
      setIsSilent(enabled);
    });
    return cleanup;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        {isSilent ? (
          <BellSlashIcon className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <NotificationDropdown onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
