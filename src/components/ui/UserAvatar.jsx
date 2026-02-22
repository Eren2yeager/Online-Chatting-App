'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { useMediaFullView } from "@/components/layout/mediaFullViewContext";

/**
 * Enhanced user avatar with online status and click handlers
 */
export default function UserAvatar({
  user,
  size = "md",
  showStatus = true,
  showName = false,
  clickable = true,
  className = "",
  onlineUsers = [],
}) {
  const router = useRouter();
  const { openMediaFullView } = useMediaFullView();
  const [imageError, setImageError] = useState(false);

  if (!user) return null;

  const userId = user._id || user.id;
  const isOnline = onlineUsers.includes(String(userId));
  const userName = user.name || "Unknown User";
  const userHandle = user.handle || "";
  const userImage = user.image;

  const handleAvatarClick = () => {
    if (!clickable) return;
    
    if (userImage && !imageError) {
      openMediaFullView({
        media: [{
          type: "image",
          url: userImage,
          name: `${userName}'s Profile Picture`,
          mime: "image/jpeg"
        }],
        initialIndex: 0
      });
    }
  };

  const handleNameClick = (e) => {
    e.stopPropagation();
    if (!clickable) return;
    
    if (userHandle) {
      router.push(`/profile/${userHandle}`);
    }
  };

  const statusSizeClasses = {
    xs: "w-2.5 h-2.5 sm:w-3 sm:h-3",
    sm: "w-3 h-3 sm:w-3.5 sm:h-3.5",
    md: "w-3.5 h-3.5 sm:w-4 sm:h-4", 
    lg: "w-4 h-4 sm:w-4.5 sm:h-4.5",
    xl: "w-4.5 h-4.5 sm:w-5 sm:h-5",
    "2xl": "w-5 h-5 sm:w-6 sm:h-6",
  };

  return (
    <div className={`flex items-center gap-1 sm:gap-2 ${className}`}>
      {/* Avatar with status */}
      <div className="relative flex-shrink-0 z-0">
        <Avatar
          src={userImage}
          alt={userName}
          size={size}
          className={`${clickable && userImage ? "cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all" : ""}`}
          onClick={handleAvatarClick}
          onError={() => setImageError(true)}
        />
        
        {/* Online status indicator */}
        {showStatus && (
          <div
            className={`absolute -top-1 -right-1 ${statusSizeClasses[size]} rounded-full border-2 border-white shadow-lg z-20 ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
            title={isOnline ? "Online" : "Offline"}
          />
        )}
      </div>

      {/* Name (clickable) */}
      {showName && (
        <div className="min-w-0 flex-1">
          <button
            onClick={handleNameClick}
            className={`text-left truncate font-medium ${
              clickable
                ? "text-blue-600 hover:text-blue-700 hover:underline"
                : "text-gray-900"
            }`}
            disabled={!clickable}
          >
            {userName}
          </button>
          {userHandle && (
            <p className="text-xs text-gray-500 truncate">@{userHandle}</p>
          )}
        </div>
      )}
    </div>
  );
}