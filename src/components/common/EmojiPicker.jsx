'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import EmojiPicker to avoid SSR issues
const Picker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
);

/**
 * Modern Emoji Picker Component using emoji-picker-react
 * 
 * @param {boolean} isOpen - Controls picker visibility
 * @param {function} onClose - Callback when picker should close
 * @param {function} onSelect - Callback when emoji is selected (receives EmojiClickData)
 * @param {string} theme - 'light' or 'dark' theme
 * @param {object} pickerProps - Additional props to pass to EmojiPicker
 */
export default function EmojiPicker({ 
  isOpen, 
  onClose, 
  onSelect, 
  theme = 'light',
  pickerProps = {} 
}) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before using portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose]);

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    // emojiData contains: emoji, unified, names, etc.
    // Extract just the emoji string
    const emoji = emojiData.emoji || emojiData.native || emojiData;
    onSelect?.(emoji);
    onClose?.();
  };

  // Don't render until mounted (prevents SSR issues)
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[99999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-2xl"
          style={{ zIndex: 99999 }} // Inline style as backup
        >
          <div ref={ref} className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Choose Emoji
              </h3>
              <button 
                onClick={onClose} 
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
            
            <div className="flex justify-center">
              <Picker
                onEmojiClick={handleEmojiClick}
                theme={theme}
                width="100%"
                height={400}
                searchPlaceHolder="Search emoji..."
                previewConfig={{ showPreview: false }}
                skinTonesDisabled={false}
                {...pickerProps}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Example usage component
export function EmojiPickerDemo() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedEmoji, setSelectedEmoji] = React.useState('');
  const [theme, setTheme] = React.useState('light');

  const handleSelect = (emojiData) => {
    console.log('Selected emoji:', emojiData);
    setSelectedEmoji(emojiData.emoji);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Emoji Picker React Demo
          </h1>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => setIsOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                Open Emoji Picker
              </button>
              
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition"
              >
                Toggle Theme: {theme}
              </button>
            </div>

            {selectedEmoji && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Selected Emoji:
                </p>
                <div className="text-6xl">{selectedEmoji}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EmojiPicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleSelect}
        theme={theme}
      />
    </div>
  );
}