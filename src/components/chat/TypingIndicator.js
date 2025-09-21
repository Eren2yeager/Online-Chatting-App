"use client";

import { motion } from "framer-motion";
import { memo } from "react";

/**
 * Typing indicator styled like a chat message: only avatar and bouncing dots
 */
const TypingIndicator = memo(function TypingIndicator({ typingUsers = [] }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  // Show only the first user's avatar (like a chat message)
  const user = typingUsers[0];
  const avatarUrl = user?.image || "/user.jpg";
  const altText = user?.name || "User";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-end mb-2"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mr-2">
        <img
          src={avatarUrl}
          alt={altText}
          className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow"
        />
      </div>
      {/* Message bubble with only bouncing dots */}
      <div className="bg-gray-300  rounded-md px-4 py-3 shadow-sm min-w-[44px] flex items-center">
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
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the number of typing users or their IDs change
  const prevUsers = prevProps.typingUsers || [];
  const nextUsers = nextProps.typingUsers || [];
  if (prevUsers.length !== nextUsers.length) return false;
  const prevIds = prevUsers.map(u => u._id || u.id).sort();
  const nextIds = nextUsers.map(u => u._id || u.id).sort();
  return prevIds.every((id, index) => id === nextIds[index]);
});

export default TypingIndicator;
