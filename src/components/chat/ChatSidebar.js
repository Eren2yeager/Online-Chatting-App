'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  UserGroupIcon,
  UserIcon,
  EllipsisVerticalIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

/**
 * Chat sidebar component displaying chat list with search and actions
 */
export default function ChatSidebar({
  chats,
  selectedChat,
  onChatSelect,
  onNewMessage,
  searchQuery,
  onSearchChange,
  onCreateGroup,
  onShowFriendRequests,
  loading
}) {
  const { data: session } = useSession();
  const [showActions, setShowActions] = useState(false);

  const getChatDisplayName = (chat) => {
    if (chat.isGroup) {
      return chat.name || 'Group Chat';
    } else {
      const otherParticipant = chat.participants.find(
        p => p._id !== session?.user?.id
      );
      return otherParticipant?.name || 'Unknown User';
    }
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroup) {
      return chat.avatar || null;
    } else {
      const otherParticipant = chat.participants.find(
        p => p._id !== session?.user?.id
      );
      return otherParticipant?.image || otherParticipant?.avatar || null;
    }
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const sender = chat.participants.find(
      p => p._id === chat.lastMessage.senderId
    );
    const senderName = sender?._id === session?.user?.id ? 'You' : sender?.name;
    
    let content = chat.lastMessage.content;
    if (chat.lastMessage.type === 'image') {
      content = '📷 Image';
    } else if (chat.lastMessage.type === 'video') {
      content = '🎥 Video';
    } else if (chat.lastMessage.type === 'file') {
      content = '📎 File';
    }
    
    return `${senderName}: ${content}`;
  };

  const getUnreadCount = (chat) => {
    const unreadCount = chat.unreadCounts?.find(
      uc => uc.user === session?.user?.id
    );
    return unreadCount?.count || 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex-1 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
              >
                <button
                  onClick={() => {
                    onCreateGroup();
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  Create Group
                </button>
                <button
                  onClick={() => {
                    onShowFriendRequests();
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Friend Requests
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats?..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats?.length === 0 ? (
          <div className="p-8 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No chats yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start a conversation with friends or create a group
            </p>
            <div className="space-y-3">
              <button
                onClick={onCreateGroup}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserGroupIcon className="h-4 w-4 mr-2" />
                Create Group
              </button>
              <button
                onClick={onShowFriendRequests}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Add Friends
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {chats?.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              const unreadCount = getUnreadCount(chat);
              
              return (
                <motion.button
                  key={chat._id}
                  onClick={() => onChatSelect(chat)}
                  className={`w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {getChatAvatar(chat) ? (
                          <img
                            src={getChatAvatar(chat)}
                            alt={getChatDisplayName(chat)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      {chat.isGroup && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium truncate ${
                          unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {getChatDisplayName(chat)}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${
                        unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>
                        {getLastMessagePreview(chat)}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-xs font-medium text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
