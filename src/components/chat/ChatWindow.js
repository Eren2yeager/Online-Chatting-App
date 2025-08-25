'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
  EmojiHappyIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { useSocket, useSocketEmit, useSocketListener, useTypingIndicator } from '../../lib/socket';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import MessageContextMenu from './MessageContextMenu';

/**
 * Chat window component for displaying and sending messages
 */
export default function ChatWindow({ chat, onBack, onNewMessage }) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const { emit } = useSocketEmit();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuMessage, setContextMenuMessage] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const typingUsers = useTypingIndicator(chat._id);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  useEffect(() => {
    if (chat?._id) {
      fetchMessages();
    }
  }, [chat._id]);

  // Socket event listeners
  useSocketListener('message:new', (data) => {
    if (data.chatId === chat._id) {
      setMessages(prev => [...prev, data.message]);
      onNewMessage(data.message);
    }
  });

  useSocketListener('message:edit', (data) => {
    if (data.chatId === chat._id) {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.message._id ? data.message : msg
        )
      );
    }
  });

  useSocketListener('message:delete', (data) => {
    if (data.chatId === chat._id) {
      if (data.deleteForEveryone) {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, isDeleted: true, text: '', media: [] }
              : msg
          )
        );
      } else {
        setMessages(prev => 
          prev.filter(msg => msg._id !== data.messageId)
        );
      }
    }
  });

  useSocketListener('reaction:update', (data) => {
    if (data.chatId === chat._id) {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    }
  });

  const fetchMessages = async (beforeId = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        chatId: chat._id,
        limit: 50,
      });
      
      if (beforeId) {
        params.append('before', beforeId);
      }

      const response = await fetch(`/api/messages?${params}`);
      const data = await response.json();

      if (data.success) {
        if (beforeId) {
          setMessages(prev => [...data.data, ...prev]);
        } else {
          setMessages(data.data);
        }
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text, media = []) => {
    if (!text.trim() && media.length === 0) return;

    try {
      const messageData = {
        chatId: chat._id,
        text: text.trim(),
        media,
      };

      // Emit via socket for real-time delivery
      emit('message:new', messageData);

      // Also send via API for persistence
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMessageAction = (action, message) => {
    switch (action) {
      case 'edit':
        // Handle message editing
        break;
      case 'delete':
        emit('message:delete', {
          messageId: message._id,
          deleteForEveryone: false,
        });
        break;
      case 'deleteForEveryone':
        emit('message:delete', {
          messageId: message._id,
          deleteForEveryone: true,
        });
        break;
      case 'reply':
        // Handle reply functionality
        break;
      default:
        break;
    }
    setShowContextMenu(false);
  };

  const handleMessageContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenuMessage(message);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const getChatDisplayName = () => {
    if (chat.isGroup) {
      return chat.name || 'Group Chat';
    } else {
      const otherParticipant = chat.participants.find(
        p => p._id !== session?.user?.id
      );
      return otherParticipant?.name || 'Unknown User';
    }
  };

  const getChatAvatar = () => {
    if (chat.isGroup) {
      return chat.avatar || null;
    } else {
      const otherParticipant = chat.participants.find(
        p => p._id !== session?.user?.id
      );
      return otherParticipant?.image || otherParticipant?.avatar || null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {getChatAvatar() ? (
                <img
                  src={getChatAvatar()}
                  alt={getChatDisplayName()}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 text-gray-400">
                  {chat.isGroup ? '👥' : '👤'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {getChatDisplayName()}
              </h2>
              {typingUsers.length > 0 && (
              <p className="text-sm text-gray-500">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </p>
              )}
            </div>
          </div>
        </div>

        <button className="p-2 rounded-lg hover:bg-gray-100">
          <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                onClick={() => fetchMessages(messages[0]?._id)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2"
              >
                Load more messages
              </button>
            )}
            
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                  key={message._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
              >
                <ChatMessage
                  message={message}
                    isOwn={message.sender._id === session?.user?.id}
                    onContextMenu={(e) => handleMessageContextMenu(e, message)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
        />
      </div>

      {/* Context Menu */}
      <MessageContextMenu
        isOpen={showContextMenu}
        position={contextMenuPosition}
        onClose={() => setShowContextMenu(false)}
        onAction={handleMessageAction}
        message={contextMenuMessage}
        isOwnMessage={contextMenuMessage?.sender._id === session?.user?.id}
      />
    </div>
  );
}
