'use client';

import { memo } from "react";

/**
 * Typing indicator component showing who is typing
 * Displays avatar and animated dots in a message bubble style
 */
const TypingIndicator = memo(function TypingIndicator({ typingUsers = [] }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  // Get typing user info
  const user = typingUsers[0];
  const avatarUrl = user?.image || "/user.jpg";
  const userName = user?.name || "Someone";
  const multipleUsers = typingUsers.length > 1;

  return (
    <div className="flex items-end gap-2 mb-3 animate-fadeIn">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <img
          src={avatarUrl}
          alt={userName}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
          onError={(e) => {
            e.target.src = "/user.jpg";
          }}
        />
      </div>

      {/* Typing bubble */}
      <div className="flex flex-col gap-1">
        {/* User name(s) */}
        <span className="text-xs text-gray-500 ml-1 font-bold">
          {multipleUsers 
            && `1+`

          }
        </span>

        {/* Bubble with dots */}
        <div className="bg-gradient-to-br bg-white  rounded-xl  px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:0ms]"></span>
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:150ms]"></span>
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:300ms]"></span>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if typing users change
  const prevUsers = prevProps.typingUsers || [];
  const nextUsers = nextProps.typingUsers || [];
  
  if (prevUsers.length !== nextUsers.length) return false;
  
  // Compare user IDs
  const prevIds = prevUsers.map(u => u._id || u.id).sort().join(',');
  const nextIds = nextUsers.map(u => u._id || u.id).sort().join(',');
  
  return prevIds === nextIds;
});

export default TypingIndicator;
