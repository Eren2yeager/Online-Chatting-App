'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useSocket } from '@/components/providers/SocketProvider';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import SecureLayout from '@/components/layout/SecureLayout';

export default function ChatPage() {
  const { data: session } = useSession();
  const { socket, on, off, emit } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

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
    }
  }, [selectedConversation, socket, emit]);

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
                  senderName: data.message.sender.name,
                  createdAt: new Date()
                } 
              }
            : conv
        )
      );
    };

    const handleConversationUpdated = (data) => {
      if (data.conversationId === selectedConversation?.id) {
        // Update conversation in list
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
        // Remove deleted message
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        
        // Update conversation list if needed
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

    // Listen for conversation updates from sidebar
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

    // Set up window event listeners
    window.addEventListener('conversation-updated', handleConversationUpdateEvent);
    window.addEventListener('message-deleted', handleMessageDeleteEvent);

    // Cleanup
    return () => {
      off('new-message', handleNewMessage);
      off('conversation-updated', handleConversationUpdated);
      off('message-deleted', handleMessageDeleted);
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

  const handleSendMessage = async (content) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          type: 'text'
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        
        // Add message to local state
        setMessages(prev => [...prev, newMessage]);
        
        // Emit message via socket for real-time updates
        emit('send-message', {
          conversationId: selectedConversation.id,
          message: newMessage
        });
        
        // Update conversation list
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
    if (!selectedConversation || !mediaUrl) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `Sent ${type}`,
          type,
          mediaUrl
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        
        // Add message to local state
        setMessages(prev => [...prev, newMessage]);
        
        // Emit message via socket for real-time updates
        emit('send-message', {
          conversationId: selectedConversation.id,
          message: newMessage
        });
        
        // Update conversation list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { 
                  ...conv, 
                  lastMessage: { 
                    content: `Sent ${type}`, 
                    type, 
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

  const handleMessageDeleted = (messageId, deleteFor) => {
    // Remove message from local state
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    // Update conversation list if message was deleted for everyone
    if (deleteFor === 'everyone') {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: null }
            : conv
        )
      );
    }
  };

  const handleCreateConversation = () => {
    // For now, create a simple 1-on-1 conversation
    // In a real app, you'd have a modal to select users
    const newConversation = {
      id: `temp-${Date.now()}`,
      name: 'New Chat',
      isGroup: false,
      participants: [
        { user: { id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image } }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
  };

  if (loading) {
    return (
      <SecureLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </SecureLayout>
    );
  }

  return (
    <SecureLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-screen bg-gray-100"
      >
        {/* Sidebar */}
        <ChatSidebar
          conversations={conversations}
          onSelectConversation={setSelectedConversation}
          onCreateConversation={handleCreateConversation}
        />

        {/* Chat Window */}
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendMedia={handleSendMedia}
          onMessageDeleted={handleMessageDeleted}
        />
      </motion.div>
    </SecureLayout>
  );
}
