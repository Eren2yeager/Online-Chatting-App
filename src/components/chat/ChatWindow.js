'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatWindow({ conversation, messages, onSendMessage, onSendMedia, onMessageDeleted }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!conversation) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex items-center justify-center bg-gray-50"
      >
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-4xl">💬</span>
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
      className="flex-1 flex flex-col bg-white"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {conversation.isGroup ? (
              <span className="text-white text-lg">👥</span>
            ) : (
              <span className="text-white font-semibold text-lg">
                {conversation.participants?.[0]?.user?.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">
              {conversation.name || conversation.participants?.map(p => p.user.name).join(', ')}
            </h2>
            <p className="text-sm text-gray-500">
              {conversation.isGroup ? 'Group chat' : 'Direct message'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              isLastMessage={index === messages.length - 1}
              onMessageDeleted={onMessageDeleted}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        onSendMedia={onSendMedia}
      />
    </motion.div>
  );
}
