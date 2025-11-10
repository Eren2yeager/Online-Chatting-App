'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import CustomChatIcon from '@/components/icons/CustomChatIcon';
import ChatSidebar from '../../../../components/chat/ChatSidebar';
import ChatWindow from '../../../../components/chat/ChatWindow';
import CreateGroupModal from '../../../../components/chat/CreateGroupModal.jsx';
import FriendRequestsModal from '../../../../components/chat/FriendRequestsModal.jsx';
import ResizableLayout from '../../../../components/chat/ResizableLayout';
import { useSocket } from '@/lib/socket';
import { Loader } from '@/components/ui';
/**
 * Individual chat page with responsive layout
 * Handles chat list, chat window, and mobile navigation
 */
export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
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

    // Only fetch if chats are empty
    if (chats.length === 0) {
      fetchChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status]);

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

  // Socket listeners for real-time chat updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages to update lastMessage in sidebar
    const handleMessageNew = (data) => {
      const { message, chatId: msgChatId } = data;
      
      console.log("📨 New message received:", { message, chatId: msgChatId });
      
      setChats((prevChats) => {
        // Find the chat
        const chatIndex = prevChats.findIndex((c) => c._id === msgChatId);
        
        if (chatIndex === -1) {
          // Chat not in list, might be a new chat - ignore for now
          // It will be added via chat:created event if needed
          console.log("⚠️ Chat not found in list, ignoring...");
          return prevChats;
        }

        // Update the chat with new lastMessage and move to top
        const updatedChats = [...prevChats];
        const chat = { ...updatedChats[chatIndex] };
        
        // Update lastMessage with proper structure
        chat.lastMessage = {
          _id: message._id,
          text: message.text || "",
          sender: message.sender,
          media: message.media || [],
          type: message.type || "text",
          isDeleted: message.isDeleted || false,
          createdAt: message.createdAt || new Date().toISOString(),
        };
        chat.lastActivity = message.createdAt || new Date().toISOString();
        
        console.log("✅ Updated chat lastMessage:", chat.lastMessage);
        
        // Remove from current position and add to top
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(chat);
        
        return updatedChats;
      });
    };

    // Listen for message edits
    const handleMessageEdit = (data) => {
      const { message, chatId: msgChatId } = data;
      
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat._id === msgChatId && chat.lastMessage?._id === message._id) {
            return {
              ...chat,
              lastMessage: message,
            };
          }
          return chat;
        })
      );
    };

    // Listen for message deletes
    const handleMessageDelete = (data) => {
      const { messageId, chatId: msgChatId, deleteForEveryone } = data;
      
      if (deleteForEveryone) {
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat._id === msgChatId && chat.lastMessage?._id === messageId) {
              return {
                ...chat,
                lastMessage: {
                  ...chat.lastMessage,
                  isDeleted: true,
                  text: "",
                  media: [],
                },
              };
            }
            return chat;
          })
        );
      }
    };

    // Listen for chat updates (name, image, participants)
    const handleChatUpdated = (data) => {
      const { chat: updatedChat } = data;
      
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === updatedChat._id ? { ...chat, ...updatedChat } : chat
        )
      );

      // Update selected chat if it's the one that was updated
      if (selectedChat?._id === updatedChat._id) {
        setSelectedChat({ ...selectedChat, ...updatedChat });
      }
    };

    // Listen for new chats (when added to a group)
    const handleChatCreated = (data) => {
      const { chat: newChat } = data;
      
      setChats((prevChats) => {
        // Check if chat already exists
        if (prevChats.some((c) => c._id === newChat._id)) {
          return prevChats;
        }
        return [newChat, ...prevChats];
      });
    };

    // Listen for chat left/removed
    const handleChatLeft = (data) => {
      const { chatId: leftChatId } = data;
      
      setChats((prevChats) => prevChats.filter((chat) => chat._id !== leftChatId));
      
      // If the current chat was left, redirect to chats page
      if (selectedChat?._id === leftChatId) {
        router.push('/chats');
      }
    };

    // Register all socket listeners
    socket.on("message:new", handleMessageNew);
    socket.on("message:edit", handleMessageEdit);
    socket.on("message:delete", handleMessageDelete);
    socket.on("chat:updated", handleChatUpdated);
    socket.on("chat:created", handleChatCreated);
    socket.on("chat:left", handleChatLeft);

    // Cleanup
    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("message:edit", handleMessageEdit);
      socket.off("message:delete", handleMessageDelete);
      socket.off("chat:updated", handleChatUpdated);
      socket.off("chat:created", handleChatCreated);
      socket.off("chat:left", handleChatLeft);
    };
  }, [socket, isConnected, selectedChat, router]);

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
           <Loader />
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

        {/* Desktop Resizable Layout */}
        <div className="hidden md:flex flex-1 w-full">
          <ResizableLayout
            sidebar={
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
            }
            main={
              selectedChat ? (
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
                    <div className="mx-auto rounded-2xl h-20 w-20 flex items-center justify-center">
                      <CustomChatIcon className="h-20 w-20" />
                    </div>
                  </div>
                </div>
              )
            }
          />
        </div>

        {/* Mobile Chat Area */}
        <div className="md:hidden flex-1 flex flex-col">
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
                <div className="mx-auto rounded-2xl h-20 w-20 flex items-center justify-center">
                  <CustomChatIcon className="h-20 w-20" />
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
          console.log("Group created:", newChat);
          setChats(prev => {
            console.log("Adding new chat to list");
            return [newChat, ...prev];
          });
          setSelectedChat(newChat);
          setShowCreateGroup(false);
          // Navigate to the new chat
          console.log("Navigating to new chat:", newChat._id);
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
