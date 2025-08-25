'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PaperClipIcon, 
  FaceSmileIcon, 
  PaperAirplaneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSocketEmit } from '../../lib/socket';
import { Picker } from 'emoji-mart';
// import 'emoji-mart/dist/basic.css';

/**
 * Chat input component with emoji picker and file upload
 */
export default function ChatInput({ onSendMessage, disabled = false }) {
  const { emit } = useSocketEmit();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Typing indicators
  useEffect(() => {
    if (typing) {
      emit('typing:start', { chatId: 'current' });
    } else {
      emit('typing:stop', { chatId: 'current' });
    }
  }, [typing, emit]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Typing indicator
    if (value.length > 0 && !typing) {
      setTyping(true);
    } else if (value.length === 0 && typing) {
      setTyping(false);
    }

    // Clear typing indicator after delay
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    if (disabled || uploading) return;

    try {
      setUploading(true);
      
      // Upload files first
      let uploadedMedia = [];
      if (selectedFiles.length > 0) {
        uploadedMedia = await uploadFiles(selectedFiles);
      }

      // Send message
      await onSendMessage(message, uploadedMedia);
      
      // Reset state
      setMessage('');
      setSelectedFiles([]);
      setTyping(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mov', 'video/avi',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      return file.size <= maxSize && allowedTypes.includes(file.type);
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files) => {
    const uploadedMedia = [];

    for (const file of files) {
      try {
        // Get upload signature
        const signatureResponse = await fetch('/api/uploads/signature');
        const signatureData = await signatureResponse.json();

        if (!signatureData.success) {
          throw new Error('Failed to get upload signature');
        }

        // Create form data for Cloudinary
        const formData = new FormData();
        Object.keys(signatureData.data).forEach(key => {
          formData.append(key, signatureData.data[key]);
        });
        formData.append('file', file);

        // Upload to Cloudinary
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.data.cloud_name}/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const uploadResult = await uploadResponse.json();

        if (uploadResult.secure_url) {
          uploadedMedia.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            mime: file.type,
            size: file.size,
            filename: file.name,
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    return uploadedMedia;
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="relative bg-gray-100 rounded-lg p-2 flex items-center space-x-2"
            >
              <span className="text-sm text-gray-600 truncate max-w-32">
                {file.name}
              </span>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        {/* File Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.txt,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || uploading}
            className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            maxLength={2000}
          />
          
          {/* Character Count */}
          {message.length > 1800 && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {message.length}/2000
            </div>
          )}
        </div>

        {/* Emoji Picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled || uploading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaceSmileIcon className="h-5 w-5" />
          </button>
          
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-full right-0 mb-2 z-10"
            >
              <Picker
                onSelect={addEmoji}
                theme="light"
                set="apple"
                showPreview={false}
                showSkinTones={false}
                emojiSize={20}
                perLine={8}
              />
            </motion.div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || uploading || (!message.trim() && selectedFiles.length === 0)}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <PaperAirplaneIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Uploading Indicator */}
      {uploading && (
        <div className="text-sm text-gray-500 text-center">
          Uploading files...
        </div>
      )}
    </div>
  );
}
