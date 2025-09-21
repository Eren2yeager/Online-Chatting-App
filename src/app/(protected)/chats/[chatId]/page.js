'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import ChatSidebar from '../../../../components/chat/ChatSidebar';
import ChatWindow from '../../../../components/chat/ChatWindow';
import CreateGroupModal from '../../../../components/chat/CreateGroupModal';
import FriendRequestsModal from '../../../../components/chat/FriendRequestsModal';
import { useSearchParams } from 'next/navigation';

/**
 * Individual chat page with responsive layout
 * Handles chat list, chat window, and mobile navigation
 */
export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {chatId} = useParams()
  // const chatId = c;
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

  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c._id === chatId);
      if (chat) {
        setSelectedChat(chat);
      }
    }
  }, [chatId, chats]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chats');
      const data = await response.json();

      if (data.success && Array.isArray(data.data.chats)) {
        setChats(data.data.chats);
        
        // If we have a chatId in params, select that chat
        if (chatId) {
          const chat = data.data.chats.find(c => c._id === chatId);
          if (chat) {
            setSelectedChat(chat);
          }
        } else if (data.data.chats.length > 0) {
          // Select first chat if none selected
          setSelectedChat(data.data.chats[0]);
        }
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    // Update URL for mobile view
    router.push(`/chats/${chat._id}`);
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

  const handleBackToChats = () => {
    router.push('/chats');
  };

  if (status === 'loading') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute md:hidden z-20 w-80 bg-white border-r border-gray-200 flex flex-col"
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
              onBack={handleBackToChats}
              onNewMessage={handleNewMessage}
              onChatUpdated={(updated) => {
                setChats(prev => prev.map(c => c._id === updated._id ? updated : c));
                setSelectedChat(updated);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-20 w-20 text-white mb-4 p-4 bg-gradient-to-r rounded-full from-blue-500 to-purple-600" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation to start chatting
                </h3>
                <p className="text-gray-500">
                  Choose from your conversations or create a new group
                </p>
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
          // Navigate to the new chat
          router.push(`/chats/${newChat._id}`);
        }}
      />

      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
        onRequestAccepted={() => {
          // Refresh chats when friend request is accepted
          fetchChats();
        }}
      />
    </div>
  );
}
