'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrashIcon, 
  ClipboardDocumentIcon, 
  ArrowUturnLeftIcon,
  FlagIcon,
  EyeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function MessageContextMenu({ 
  isVisible, 
  position, 
  onClose, 
  onDelete,
  onCopy,
  onReply,
  onReport,
  isOwnMessage = false
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') onClose();
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  const handleCopy = () => {
    onCopy();
    onClose();
  };

  const handleReply = () => {
    onReply();
    onClose();
  };

  const handleDeleteForMe = () => {
    onDelete('me');
    onClose();
  };

  const handleDeleteForEveryone = () => {
    if (confirm('Are you sure you want to delete this message for everyone? This action cannot be undone.')) {
      onDelete('everyone');
      onClose();
    }
  };

  const handleReport = () => {
    onReport();
    onClose();
  };

  if (!isVisible) return null;

  // Calculate position to prevent going off screen
  const getAdjustedPosition = () => {
    const menuWidth = 200;
    const menuHeight = 200;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let x = position.x;
    let y = position.y;
    
    // Adjust horizontal position
    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth - 10;
    }
    if (x < 10) {
      x = 10;
    }
    
    // Adjust vertical position
    if (y + menuHeight > windowHeight) {
      y = windowHeight - menuHeight - 10;
    }
    if (y < 10) {
      y = 10;
    }
    
    return { x, y };
  };

  const adjustedPosition = getAdjustedPosition();

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.95, y: -10 }}
        animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 ${
          isMobile ? 'w-full max-w-sm mx-auto left-1/2 transform -translate-x-1/2 bottom-4' : 'min-w-[200px]'
        }`}
        style={isMobile ? {} : {
          left: adjustedPosition.x,
          top: adjustedPosition.y,
        }}
      >
        {/* Action Buttons */}
        <div className="py-1">
          {/* Copy Message */}
          <motion.button
            whileHover={{ backgroundColor: '#f3f4f6' }}
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            Copy message
          </motion.button>

          {/* Reply */}
          <motion.button
            whileHover={{ backgroundColor: '#f3f4f6' }}
            onClick={handleReply}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
            Reply
          </motion.button>

          {/* Delete Options */}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <motion.button
              whileHover={{ backgroundColor: '#fef2f2' }}
              onClick={handleDeleteForMe}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Delete for me
            </motion.button>

            {isOwnMessage && (
              <motion.button
                whileHover={{ backgroundColor: '#fef2f2' }}
                onClick={handleDeleteForEveryone}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Delete for everyone
              </motion.button>
            )}
          </div>

          {/* Report (if not own message) */}
          {!isOwnMessage && (
            <div className="border-t border-gray-100 mt-1 pt-1">
              <motion.button
                whileHover={{ backgroundColor: '#fef2f2' }}
                onClick={handleReport}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <FlagIcon className="w-4 h-4" />
                Report message
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
