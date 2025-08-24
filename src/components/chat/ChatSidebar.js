'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  UserCircleIcon,
  BellIcon,
  QrCodeIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../providers/SocketProvider';
import QRCodeModal from './QRCodeModal';
import UserProfile from './UserProfile';
import CreateGroupModal from './CreateGroupModal';
import FriendRequestsModal from './FriendRequestsModal';

export default function ChatSidebar({ conversations, onSelectConversation, isMobile = false }) {
  const { data: session } = useSession();
  const { socket, on, off } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('chats');

  useEffect(() => {
    if (session) {
      fetchUsers();
      fetchFriendRequestsCount();
    }
  }, [session]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.conversationId) {
        window.dispatchEvent(new CustomEvent('conversation-updated', { detail: data }));
      }
    };

    const handleConversationUpdated = (data) => {
      if (data.conversationId) {
        window.dispatchEvent(new CustomEvent('conversation-updated', { detail: data }));
      }
    };

    const handleMessageDeleted = (data) => {
      if (data.conversationId) {
        window.dispatchEvent(new CustomEvent('message-deleted', { detail: data }));
      }
    };

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

    const handleProfileUpdated = (data) => {
      if (data.userId === session?.user?.id) {
        window.location.reload();
      }
    };

    const handleFriendRequest = (data) => {
      setFriendRequestsCount(prev => prev + 1);
    };

    on('new-message', handleNewMessage);
    on('conversation-updated', handleConversationUpdated);
    on('message-deleted', handleMessageDeleted);
    on('user-online', handleUserOnline);
    on('user-offline', handleUserOffline);
    on('user-profile-updated', handleProfileUpdated);
    on('friend-request', handleFriendRequest);

    return () => {
      off('new-message', handleNewMessage);
      off('conversation-updated', handleConversationUpdated);
      off('message-deleted', handleMessageDeleted);
      off('user-online', handleUserOnline);
      off('user-offline', handleUserOffline);
      off('user-profile-updated', handleProfileUpdated);
      off('friend-request', handleFriendRequest);
    };
  }, [socket, on, off, session]);

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

  const fetchFriendRequestsCount = async () => {
    try {
      const response = await fetch('/api/friend-requests/count');
      if (response.ok) {
        const data = await response.json();
        setFriendRequestsCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching friend requests count:', error);
    }
  };

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
        const newConversation = await response.json();
        onSelectConversation(newConversation);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const formatLastMessage = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { content, type, senderName } = conversation.lastMessage;
    if (type === 'image') return `${senderName}: 📷 Image`;
    if (type === 'video') return `${senderName}: 🎥 Video`;
    if (type === 'audio') return `${senderName}: 🎵 Audio`;
    if (type === 'document') return `${senderName}: 📄 Document`;
    return `${senderName}: ${content}`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants?.some(p => p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="w-full h-full bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Chats</h1>
            <div className="flex gap-2">
              {isMobile ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                      >
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setShowProfileModal(true);
                              setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <UserCircleIcon className="w-4 h-4" />
                            Profile
                          </button>
                          <button
                            onClick={() => {
                              setShowFriendRequestsModal(true);
                              setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <BellIcon className="w-4 h-4" />
                            Friend Requests
                            {friendRequestsCount > 0 && (
                              <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {friendRequestsCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowQRModal(true);
                              setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <QrCodeIcon className="w-4 h-4" />
                            Add Friends
                          </button>
                          <button
                            onClick={() => {
                              setShowGroupModal(true);
                              setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <UserGroupIcon className="w-4 h-4" />
                            Create Group
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowProfileModal(true)}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    title="Profile"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowFriendRequestsModal(true)}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors relative"
                    title="Friend Requests"
                  >
                    <BellIcon className="w-5 h-5" />
                    {friendRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {friendRequestsCount}
                      </span>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowQRModal(true)}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    title="Add Friends"
                  >
                    <QrCodeIcon className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowGroupModal(true)}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    title="Create Group"
                  >
                    <UserGroupIcon className="w-5 h-5" />
                  </motion.button>
                </>
              )}
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white text-opacity-80" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 text-white placeholder-white placeholder-opacity-80 text-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'chats'
                ? 'text-green-600 border-b-2 border-green-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-2" />
            Chats
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-green-600 border-b-2 border-green-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <UserGroupIcon className="w-4 h-4 inline mr-2" />
            Users
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' && (
            <div>
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No conversations yet</p>
                  <p className="text-sm">Start chatting with friends!</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    whileHover={{ backgroundColor: '#f8f9fa' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectConversation(conversation)}
                    className="flex items-center gap-3 p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <div className="relative">
                      {conversation.isGroup ? (
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <>
                          <img
                            src={conversation.participants?.[0]?.user?.image || '/default-avatar.png'}
                            alt={conversation.participants?.[0]?.user?.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {onlineUsers.has(conversation.participants?.[0]?.user?.id) && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.name || conversation.participants?.[0]?.user?.name || 'Unknown User'}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {formatLastMessage(conversation)}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No users found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    whileHover={{ backgroundColor: '#f8f9fa' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCreateConversationWithUser(user.id)}
                    className="flex items-center gap-3 p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <div className="relative">
                      <img
                        src={user.image || '/default-avatar.png'}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {onlineUsers.has(user.id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                    <PlusIcon className="w-5 h-5 text-green-600" />
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} currentUser={session?.user} />
      <UserProfile isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <CreateGroupModal 
        isOpen={showGroupModal} 
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={(newGroup) => {
          // Assuming conversations state is managed by the parent component
          // For now, we'll just close the modal and let the parent handle updates
          setShowGroupModal(false);
        }}
      />
      <FriendRequestsModal 
        isOpen={showFriendRequestsModal} 
        onClose={() => setShowFriendRequestsModal(false)}
      />
    </>
  );
}
