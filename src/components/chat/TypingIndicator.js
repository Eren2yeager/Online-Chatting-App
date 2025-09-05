"use client";

import { motion } from "framer-motion";

/**
 * Typing indicator that looks like a message with bouncing dots
 */
export default function TypingIndicator({ typingUsers = [] }) {
  if (typingUsers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start mb-4"
    >
      <div className="flex items-end space-x-2 max-w-xs">
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
        </div>
        
        {/* Message bubble with typing dots */}
        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-1">
            <motion.div
              className="w-2 h-2 bg-gray-500 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-500 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-500 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: 0.4,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
