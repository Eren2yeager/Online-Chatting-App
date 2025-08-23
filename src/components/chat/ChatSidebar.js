'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { PlusIcon, UserGroupIcon, QrCodeIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../providers/SocketProvider';
import QRCodeModal from './QRCodeModal';
import UserProfile from './UserProfile';

export default function ChatSidebar({ conversations, onSelectConversation, onCreateConversation }) {
  const { data: session } = useSession();
  const { socket, on, off } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages and conversation updates
    const handleNewMessage = (data) => {
      if (data.conversationId) {
        // Update conversation list in parent component
        window.dispatchEvent(new CustomEvent('conversation-updated', { detail: data }));
      }
    };

    const handleConversationUpdated = (data) => {
      if (data.conversationId) {
        // Update conversation list in parent component
        window.dispatchEvent(new CustomEvent('conversation-updated', { detail: data }));
      }
    };

    const handleMessageDeleted = (data) => {
      if (data.conversationId) {
        // Update conversation list in parent component
        window.dispatchEvent(new CustomEvent('message-deleted', { detail: data }));
      }
    };

    // Listen for user online/offline status
    const handleUserOnline = (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    // Listen for profile updates
    const handleProfileUpdated = (data) => {
      if (data.userId === session?.user?.id) {
        // Refresh user data
        window.location.reload();
      }
    };

    // Set up event listeners
    on('new-message', handleNewMessage);
    on('conversation-updated', handleConversationUpdated);
    on('message-deleted', handleMessageDeleted);
    on('user-online', handleUserOnline);
    on('user-offline', handleUserOffline);
    on('user-profile-updated', handleProfileUpdated);

    // Cleanup
    return () => {
      off('new-message', handleNewMessage);
      off('conversation-updated', handleConversationUpdated);
      off('message-deleted', handleMessageDeleted);
      off('user-online', handleUserOnline);
      off('user-offline', handleUserOffline);
      off('user-profile-updated', handleProfileUpdated);
    };
  }, [socket, on, off, session?.user?.id]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants?.some(p => p.user.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateConversationWithUser = async (userId) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds: [userId],
          isGroup: false
        }),
      });

      if (response.ok) {
        const conversation = await response.json();
        onSelectConversation(conversation);
        setShowUsers(false);
        setSearchTerm('');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Helper function to format last message
  const formatLastMessage = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { content, type, senderName } = conversation.lastMessage;
    if (type === 'image') return `${senderName || 'Someone'} sent an image`;
    if (type === 'audio') return `${senderName || 'Someone'} sent an audio`;
    return content || 'No messages yet';
  };

  return (
    <>
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 bg-white border-r border-gray-200 flex flex-col h-full"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Chats</h2>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowProfileModal(true)}
                className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Profile"
              >
                <UserCircleIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowQRModal(true)}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Add Friends"
              >
                <QrCodeIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowUsers(!showUsers)}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Find Users"
              >
                <UserGroupIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCreateConversation}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="New Chat"
              >
                <PlusIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder={showUsers ? "Search users..." : "Search conversations..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showUsers ? (
            // Users List
            <div>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Find Users to Chat</h3>
              </div>
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No users found' : 'No users available'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    whileHover={{ backgroundColor: '#f8fafc' }}
                    onClick={() => handleCreateConversationWithUser(user.id)}
                    className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        {/* Online Status Indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          onlineUsers.has(user.id) ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          {onlineUsers.has(user.id) ? '🟢 Online' : '⚫ Offline'}
                        </p>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors">
                        Chat
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            // Conversations List
            <div>
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No conversations found' : 'No conversations yet'}
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    whileHover={{ backgroundColor: '#f8fafc' }}
                    onClick={() => onSelectConversation(conversation)}
                    className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {conversation.isGroup ? (
                            <UserGroupIcon className="w-6 h-6 text-white" />
                          ) : (
                            <span className="text-white font-semibold text-lg">
                              {conversation.participants?.[0]?.user?.name?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        {/* Online Status for 1-on-1 chats */}
                        {!conversation.isGroup && conversation.participants?.[0]?.user?.id && (
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            onlineUsers.has(conversation.participants[0].user.id) ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.name || conversation.participants?.map(p => p.user.name).join(', ')}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {formatLastMessage(conversation)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{session?.user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
              <p className="text-xs text-green-600">🟢 Online</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        currentUser={session?.user}
      />

      {/* User Profile Modal */}
      <UserProfile
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}
