'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import CreateGroupModal from '../../components/chat/CreateGroupModal';
import FriendRequestsModal from '../../components/chat/FriendRequestsModal';

/**
 * Main chats page with responsive layout
 * Handles chat list, chat window, and mobile navigation
 */
export default function ChatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/signin');
      return;
    }

    fetchChats();
  }, [session, status]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chats');
      const data = await response.json();

      if (data.success) {
        setChats(data.data);
        // Select first chat if none selected
        if (!selectedChat && data.data.length > 0) {
          setSelectedChat(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleNewMessage = (message) => {
    // Update chat's last message
    setChats(prevChats => 
      prevChats.map(chat => 
        chat._id === message.chatId 
          ? {
              ...chat,
              lastMessage: {
                content: message.text || 'Media message',
                type: message.type,
                senderId: message.sender._id,
                createdAt: new Date()
              }
            }
          : chat
      )
    );
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (chat.isGroup) {
      return chat.name?.toLowerCase().includes(query);
    } else {
      const otherParticipant = chat.participants.find(
        p => p._id !== session?.user?.id
      );
      return otherParticipant?.name?.toLowerCase().includes(query) ||
             otherParticipant?.handle?.toLowerCase().includes(query);
    }
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {showSidebar ? (
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-600" />
            )}
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Chats</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFriendRequests(true)}
            className="p-2 rounded-lg hover:bg-gray-100 relative"
          >
            <UserIcon className="h-6 w-6 text-gray-600" />
            {/* Add notification badge here if needed */}
          </button>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <UserGroupIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute md:relative z-20 w-80 bg-white border-r border-gray-200 flex flex-col"
            >
              <ChatSidebar
                chats={filteredChats}
                selectedChat={selectedChat}
                onChatSelect={handleChatSelect}
                onNewMessage={handleNewMessage}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onCreateGroup={() => setShowCreateGroup(true)}
                onShowFriendRequests={() => setShowFriendRequests(true)}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-80 bg-white border-r border-gray-200 flex flex-col">
          <ChatSidebar
            chats={filteredChats}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            onNewMessage={handleNewMessage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateGroup={() => setShowCreateGroup(true)}
            onShowFriendRequests={() => setShowFriendRequests(true)}
            loading={loading}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              onBack={() => setSelectedChat(null)}
              onNewMessage={handleNewMessage}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a chat
                </h3>
                <p className="text-gray-500 mb-6">
                  Choose a conversation from the sidebar to start messaging
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    Create Group
                  </button>
                  <button
                    onClick={() => setShowFriendRequests(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Add Friends
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {showSidebar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(newChat) => {
          setChats(prev => [newChat, ...prev]);
          setSelectedChat(newChat);
          setShowCreateGroup(false);
        }}
      />

      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
        onRequestAccepted={() => {
          // Refresh chats to show new friend
          fetchChats();
        }}
      />
    </div>
  );
}
