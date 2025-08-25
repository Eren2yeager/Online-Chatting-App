'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  MagnifyingGlassIcon, 
  EllipsisVerticalIcon,
  PlusIcon,
  UserGroupIcon,
  QrCodeIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '@/components/providers/SocketProvider';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import SecureLayout from '@/components/layout/SecureLayout';

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, on, off, emit } = useSocket();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile navigation
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && isMobile) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [searchParams, conversations, isMobile]);

  // Fetch conversations on component mount
  useEffect(() => {
    if (session) {
      fetchConversations();
    }
  }, [session]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Join conversation room via socket
      if (socket) {
        emit('join-conversation', selectedConversation.id);
      }
      
      // Update URL for mobile navigation
      if (isMobile) {
        router.push(`/chat?conversation=${selectedConversation.id}`);
      }
    }
  }, [selectedConversation, socket, emit, isMobile, router]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.conversationId === selectedConversation?.id) {
        setMessages(prev => [...prev, data.message]);
      }
      
      // Update conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversationId 
            ? { 
                ...conv, 
                lastMessage: {
                  content: data.message.content,
                  type: data.message.type,
                  senderName: data.message.senderName,
                  createdAt: new Date()
                } 
              }
            : conv
        )
      );
    };

    const handleConversationUpdated = (data) => {
      if (data.conversationId === selectedConversation?.id) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === data.conversationId 
              ? { ...conv, lastMessage: data.lastMessage }
              : conv
          )
        );
      }
    };

    const handleMessageDeleted = (data) => {
      if (data.conversationId === selectedConversation?.id) {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        
        if (data.deletedFor === 'everyone') {
          setConversations(prev => 
            prev.map(conv => 
              conv.id === data.conversationId 
                ? { ...conv, lastMessage: null }
                : conv
            )
          );
        }
      }
    };

    const handleUserTyping = (data) => {
      console.log('User typing:', data);
    };

    const handleUserOnline = (data) => {
      console.log('User online:', data);
    };

    const handleUserOffline = (data) => {
      console.log('User offline:', data);
    };

    const handleConversationUpdateEvent = (event) => {
      const { detail } = event;
      if (detail.conversationId) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === detail.conversationId 
              ? { ...conv, lastMessage: detail.lastMessage }
              : conv
          )
        );
      }
    };

    const handleMessageDeleteEvent = (event) => {
      const { detail } = event;
      if (detail.conversationId === selectedConversation?.id) {
        setMessages(prev => prev.filter(msg => msg.id !== detail.messageId));
      }
    };

    // Set up socket event listeners
    on('new-message', handleNewMessage);
    on('conversation-updated', handleConversationUpdated);
    on('message-deleted', handleMessageDeleted);
    on('user-typing', handleUserTyping);
    on('user-online', handleUserOnline);
    on('user-offline', handleUserOffline);

    // Set up window event listeners
    window.addEventListener('conversation-updated', handleConversationUpdateEvent);
    window.addEventListener('message-deleted', handleMessageDeleteEvent);

    // Cleanup
    return () => {
      off('new-message', handleNewMessage);
      off('conversation-updated', handleConversationUpdated);
      off('message-deleted', handleMessageDeleted);
      off('user-typing', handleUserTyping);
      off('user-online', handleUserOnline);
      off('user-offline', handleUserOffline);
      window.removeEventListener('conversation-updated', handleConversationUpdateEvent);
      window.removeEventListener('message-deleted', handleMessageDeleteEvent);
    };
  }, [socket, on, off, selectedConversation]);

  // Cleanup when leaving conversation
  useEffect(() => {
    return () => {
      if (selectedConversation && socket) {
        emit('leave-conversation', selectedConversation.id);
      }
    };
  }, [selectedConversation, socket, emit]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (content, links = []) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          type: 'text',
          links
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        
        setMessages(prev => [...prev, newMessage]);
        
        emit('send-message', {
          conversationId: selectedConversation.id,
          message: newMessage
        });
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { 
                  ...conv, 
                  lastMessage: {
                    content: content.trim(),
                    type: 'text',
                    senderName: session?.user?.name,
                    createdAt: new Date()
                  } 
                }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendMedia = async (file, type, mediaUrl) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `Sent a ${type}`,
          type: type,
          mediaUrl: mediaUrl
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        
        setMessages(prev => [...prev, newMessage]);
        
        emit('send-message', {
          conversationId: selectedConversation.id,
          message: newMessage
        });
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { 
                  ...conv, 
                  lastMessage: {
                    content: `Sent a ${type}`,
                    type: type,
                    senderName: session?.user?.name,
                    createdAt: new Date()
                  } 
                }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error sending media:', error);
    }
  };

  const handleMessageDeleted = (messageId, deletedFor) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    if (deletedFor === 'everyone') {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation?.id 
            ? { ...conv, lastMessage: null }
            : conv
        )
      );
    }
  };

  const handleBackToSidebar = () => {
    setSelectedConversation(null);
    router.push('/chat');
  };

  if (loading) {
    return (
      <SecureLayout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SecureLayout>
    );
  }

  // Mobile: Show only sidebar or only chat window
  if (isMobile) {
    if (selectedConversation) {
      // Mobile: Show chat window with back button
      return (
        <SecureLayout>
          <div className="flex flex-col h-screen bg-gray-50">
            {/* Mobile Chat Header */}
            <div className="flex items-center p-4 bg-white border-b border-gray-200 shadow-sm">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBackToSidebar}
                className="p-2 mr-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </motion.button>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedConversation.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedConversation.isGroup ? 'Group' : 'Direct message'}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <EllipsisVerticalIcon className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>
            
            {/* Chat Window */}
            <div className="flex-1">
              <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                onSendMedia={handleSendMedia}
                onMessageDeleted={handleMessageDeleted}
                isMobile={true}
              />
            </div>
          </div>
        </SecureLayout>
      );
    } else {
      // Mobile: Show only sidebar
      return (
        <SecureLayout>
          <div className="h-screen bg-gray-50">
            <ChatSidebar
              conversations={conversations}
              onSelectConversation={setSelectedConversation}
              isMobile={true}
            />
          </div>
        </SecureLayout>
      );
    }
  }

  // Desktop: Show both sidebar and chat window
  return (
    <SecureLayout>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="flex-shrink-0 w-80">
          <ChatSidebar
            conversations={conversations}
            onSelectConversation={setSelectedConversation}
            isMobile={false}
          />
        </div>

        {/* Desktop Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendMedia={handleSendMedia}
              onMessageDeleted={handleMessageDeleted}
              isMobile={false}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Chat</h3>
                <p className="text-gray-600 mb-6">Select a conversation to start messaging</p>
                <button
                  onClick={() => setShowSidebar(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start a Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SecureLayout>
  );
}
