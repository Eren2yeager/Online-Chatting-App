'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  HeartIcon,
  TrashIcon,
  PencilIcon,
  ReplyIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

/**
 * Individual chat message component
 */
export default function ChatMessage({ message, isOwn, onContextMenu }) {
  const [showReactions, setShowReactions] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    onContextMenu(e, message);
  };

  const handleReaction = (emoji) => {
    // Emit reaction via socket
    // This would be handled by the parent component
  };

  const getMessageContent = () => {
    if (message.isDeleted) {
      return (
        <div className="text-gray-400 italic">
          This message was deleted
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Reply to message */}
        {message.replyTo && (
          <div className="bg-gray-100 rounded-lg p-2 text-sm text-gray-600 border-l-4 border-blue-500">
            <div className="font-medium">Replying to {message.replyTo.sender.name}</div>
            <div className="truncate">{message.replyTo.text}</div>
          </div>
        )}

        {/* Text content */}
        {message.text && (
          <div className="text-gray-900 whitespace-pre-wrap break-words">
            {message.text}
          </div>
        )}

        {/* Media content */}
        {message.media && message.media.length > 0 && (
          <div className="space-y-2">
            {message.media.map((media, index) => (
              <div key={index} className="max-w-xs">
                {media.mime.startsWith('image/') ? (
                  <img
                    src={media.url}
                    alt="Media"
                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(media.url, '_blank')}
                  />
                ) : media.mime.startsWith('video/') ? (
                  <video
                    src={media.url}
                    controls
                    className="rounded-lg max-w-full h-auto"
                    preload="metadata"
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
                    <div className="text-blue-500">
                      📎
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {media.filename}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(media.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    <a
                      href={media.url}
                      download={media.filename}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getReactionCount = (emoji) => {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0;
  };

  const hasUserReacted = (emoji) => {
    return message.reactions?.some(r => r.emoji === emoji && r.by === 'current-user-id');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onContextMenu={handleContextMenu}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        {!isOwn && (
          <div className="flex items-end space-x-2 mb-1">
            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {message.sender.image ? (
                <img
                  src={message.sender.image}
                  alt={message.sender.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500">
                  {message.sender.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {message.sender.name}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative rounded-lg px-3 py-2 ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {getMessageContent()}

          {/* Timestamp */}
          <div className={`text-xs mt-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </div>

          {/* Read receipts */}
          {isOwn && message.readBy && message.readBy.length > 0 && (
            <div className="text-xs text-blue-100 mt-1">
              ✓ Read
            </div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(
              message.reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <div
                key={emoji}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                  hasUserReacted(emoji)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick reaction buttons */}
        <div className={`flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}>
          <button
            onClick={() => handleReaction('❤️')}
            className={`p-1 rounded-full transition-colors ${
              hasUserReacted('❤️')
                ? 'text-red-500 bg-red-100'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            {hasUserReacted('❤️') ? (
              <HeartSolidIcon className="h-4 w-4" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={() => handleReaction('👍')}
            className="p-1 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            👍
          </button>
          
          <button
            onClick={() => handleReaction('😂')}
            className="p-1 rounded-full text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 transition-colors"
          >
            😂
          </button>
        </div>
      </div>

      {/* Context menu trigger for mobile */}
      <div className={`${isOwn ? 'order-1' : 'order-2'} flex items-start`}>
        <button
          onClick={(e) => onContextMenu(e, message)}
          className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
