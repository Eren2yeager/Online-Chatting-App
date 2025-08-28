'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  FlagIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

/**
 * Context menu for message actions
 */
export default function MessageContextMenu({
  isOpen,
  position,
  onClose,
  onAction,
  message,
  isOwnMessage
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleAction = (action) => {
    onAction(action, message);
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      onClose();
    }
  };

  const getMenuPosition = () => {
    const menuWidth = 200;
    const menuHeight = 200;
    const padding = 10;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position to keep menu in viewport
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }

    // Adjust vertical position to keep menu in viewport
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }

    return { x, y };
  };

  const menuPosition = getMenuPosition();

  if (!isOpen || !message) return null;

  return (
    <AnimatePresence>
      {isOpen && message && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
          }}
          onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        >
          {/* Copy */}
          {message.text && (
            <button
              onClick={handleCopy}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
                             <ClipboardDocumentIcon className="h-4 w-4 mr-3" />
              Copy text
            </button>
          )}

          {/* Reply */}
          <button
            onClick={() => handleAction('reply')}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
                           <ArrowUturnLeftIcon className="h-4 w-4 mr-3" />
            Reply
          </button>

          {/* Edit - only for own messages */}
          {isOwnMessage && !message.isDeleted && (
            <button
              onClick={() => handleAction('edit')}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <PencilIcon className="h-4 w-4 mr-3" />
              Edit
            </button>
          )}

          {/* Delete for me */}
          {(
            <button
              onClick={() => handleAction('delete')}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-3" />
              Delete for me
            </button>
          )}

          {/* Delete for everyone - only for own messages within time window */}
          {isOwnMessage && !message.isDeleted && (
            <button
              onClick={() => handleAction('deleteForEveryone')}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-3" />
              Delete for everyone
            </button>
          )}

          {/* Report - only for other people's messages */}
          {!isOwnMessage && (
            <button
              onClick={() => handleAction('report')}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FlagIcon className="h-4 w-4 mr-3" />
              Report
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
