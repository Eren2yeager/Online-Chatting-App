'use client';

import { useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatWindow({ 
  conversation, 
  messages, 
  onSendMessage, 
  onSendMedia, 
  onMessageDeleted,
  isMobile = false
}) {
  const { data: session } = useSession();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    if (conversation.isGroup) {
      return conversation.participants?.map(p => p.user?.name).join(', ') || 'Group Chat';
    }
    return conversation.participants?.[0]?.user?.name || 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (conversation.isGroup) {
      return (
        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
      );
    }
    
    const participant = conversation.participants?.[0]?.user;
    if (participant?.image) {
      return (
        <img
          src={participant.image}
          alt={participant.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
        <span className="text-white font-semibold text-lg">
          {participant?.name?.charAt(0) || 'U'}
        </span>
      </div>
    );
  };

  if (!conversation) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex items-center justify-center bg-gray-50"
      >
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Chat</h2>
          <p className="text-gray-600">Select a conversation to start messaging</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-gray-50 overflow-hidden"
    >
      {/* Header - Only show on desktop since mobile has its own header */}
      {!isMobile && (
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center p-4">
            {getConversationAvatar()}
            <div className="flex-1 ml-3">
              <h2 className="font-semibold text-gray-900">
                {getConversationName()}
              </h2>
              <p className="text-sm text-gray-500">
                {conversation.isGroup 
                  ? `${conversation.participants?.length || 0} members` 
                  : 'Online'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-sm text-gray-400">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ChatMessage
                  message={message}
                  onDelete={onMessageDeleted}
                  isOwnMessage={message.senderId === session?.user?.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        <ChatInput
          onSendMessage={onSendMessage}
          onSendMedia={onSendMedia}
        />
      </div>
    </motion.div>
  );
}
