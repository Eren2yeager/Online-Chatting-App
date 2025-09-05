
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  FlagIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { addReaction } from '../../lib/client/messages';
import { useSocketEmit } from '../../lib/socket';
import EmojiPicker from '../common/EmojiPicker.jsx';

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
  const { emit, emitAck } = useSocketEmit();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        // Don't close if emoji picker is open
        if (showEmojiPicker) return;
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        } else {
          onClose();
        }
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
  }, [isOpen, onClose, showEmojiPicker]);

  const handleAction = (action) => {
    onAction(action, message);
  };

  const handleReact = async (emoji) => {
    try {
      await addReaction({ messageId: message._id, emoji });
      // Emit socket event so participants get live update
      emit('reaction:add', { messageId: message._id, emoji });
      onClose();
    } catch (_) {}
  };

  const handleEmojiSelect = (emoji) => {
    const val = emoji.native || emoji.colons || '';
    if (!val) return;
    handleReact(val);
    setShowEmojiPicker(false);
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
    <>
      <AnimatePresence>
        {isOpen && message && (
          <motion.div
            ref={menuRef}
            initial={{ y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 0, opacity: 0, scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 0, opacity: 0, scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed z-50 bg-white shadow-2xl border border-gray-200 py-2 rounded-lg md:rounded-lg md:min-w-[220px] inset-x-0 bottom-0 md:inset-auto md:bottom-auto md:left-auto md:top-auto md:py-1 md:border md:shadow-lg md:rounded-md"
            style={typeof window !== 'undefined' && window.innerWidth >= 768 ? { left: menuPosition.x, top: menuPosition.y } : undefined}
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

          {/* Quick reactions */}
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex gap-2">
              {['👍','❤️','😂','😮','😢','👏'].map(e => (
                <button key={e} className="hover:scale-110 transition" onClick={() => handleReact(e)}>{e}</button>
              ))}
            </div>
            <button onClick={() => setShowEmojiPicker(true)} className="text-blue-600 px-2 py-1 text-sm hover:bg-blue-50 rounded">More</button>
          </div>

          {/* Reply */}
          <button
            onClick={() => handleAction('reply' , message)}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
                           <ArrowUturnLeftIcon className="h-4 w-4 mr-3" />
            Reply
          </button>

          {/* Edit - only for own messages */}
          {isOwnMessage && !message.isDeleted && (
            <button
              onClick={() => handleAction('edit' , message)}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <PencilIcon className="h-4 w-4 mr-3" />
              Edit
            </button>
          )}

          {/* Delete for me */}
          {(
            <button
              onClick={() => handleAction('delete' , message)}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-3" />
              Delete for me
            </button>
          )}

          {/* Delete for everyone - only for own messages within time window */}
          {isOwnMessage && !message.isDeleted && (
            <button
              onClick={() => handleAction('deleteForEveryone' , message)}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-3" />
              Delete for everyone
            </button>
          )}


          </motion.div>
        )}
      </AnimatePresence>
      <EmojiPicker isOpen={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} onSelect={handleEmojiSelect} />
    </>
  );
}
