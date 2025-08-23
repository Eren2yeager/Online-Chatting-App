'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../providers/SocketProvider';

export default function ChatMessage({ message, isLastMessage, onMessageDeleted }) {
  const { data: session } = useSession();
  const { emit } = useSocket();
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isOwnMessage = message.senderId === session?.user?.id;

  const handleDeleteMessage = async (deleteFor = 'me') => {
    if (!confirm(`Are you sure you want to delete this message ${deleteFor === 'everyone' ? 'for everyone' : 'for you'}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteFor }),
      });

      if (response.ok) {
        // Emit deletion via socket
        emit('delete-message', {
          conversationId: message.conversationId,
          messageId: message.id,
          deletedFor: deleteFor
        });

        // Call parent callback
        if (onMessageDeleted) {
          onMessageDeleted(message.id, deleteFor);
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setIsDeleting(false);
      setShowOptions(false);
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <img
            src={message.mediaUrl}
            alt="Shared image"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.mediaUrl, '_blank')}
          />
        );
      case 'audio':
        return (
          <audio controls className="max-w-xs">
            <source src={message.mediaUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        );
      case 'video':
        return (
          <video
            controls
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={e => {
              // Prevent video controls click from opening in new tab
              e.stopPropagation();
            }}
            onDoubleClick={() => window.open(message.mediaUrl, '_blank')}
          >
            <source src={message.mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      default:
        return (
          <p className="text-gray-800 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: isLastMessage ? 0.1 : 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group relative`}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700">
              {message.sender?.name || 'Unknown User'}
            </span>
          </div>
        )}
        
        <div
            contextMenu={() => setShowOptions(true)}
          className={`px-4 py-2 rounded-lg relative ${
            isOwnMessage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-800 border border-gray-200'
          }`}

        >
          {/* Message Options Button */}
          {isOwnMessage && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: showOptions ? 1 : 0 }}
              whileHover={{ opacity: 1 }}
              
              onClick={() => setShowOptions(!showOptions)}
              className={`absolute -top-2 -right-2 p-1 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors ${
                showOptions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <EllipsisVerticalIcon className="w-4 h-4 text-gray-600 " />
            </motion.button>
          )}

          {/* Message Content */}
          {renderMessageContent()}

          {/* Message Options Menu */}
          <AnimatePresence>
            {showOptions && isOwnMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]"
              >
                <button
                  onClick={() => handleDeleteMessage('me')}
                  disabled={isDeleting}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete for me'}
                </button>
                <button
                  onClick={() => handleDeleteMessage('everyone')}
                  disabled={isDeleting}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 border-t border-gray-100"
                >
                  <TrashIcon className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete for everyone'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {format(new Date(message.createdAt), 'HH:mm')}
        </div>
      </div>
    </motion.div>
  );
}
