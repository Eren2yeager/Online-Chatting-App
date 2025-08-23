'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PaperAirplaneIcon, PhotoIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

export default function ChatInput({ onSendMessage, onSendMedia, isRecording = false, onStartRecording, onStopRecording }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
    }
  };

  const uploadToCloudinary = async (file, type) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const mediaUrl = await uploadToCloudinary(file, 'image');
      if (mediaUrl) {
        onSendMedia(file, 'image', mediaUrl);
      }
      e.target.value = null; // Reset input
    }
  };

  const handleAudioChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      const mediaUrl = await uploadToCloudinary(file, 'audio');
      if (mediaUrl) {
        onSendMedia(file, 'audio', mediaUrl);
      }
      e.target.value = null; // Reset input
    }
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const mediaUrl = await uploadToCloudinary(file, 'video');
      if (mediaUrl) {
        onSendMedia(file, 'video', mediaUrl);
      }
      e.target.value = null; // Reset input
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-t border-gray-200 bg-white p-4"
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {/* Media Upload Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Send image"
          >
            <PhotoIcon className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Send video"
          >
            {/* Use PhotoIcon as a placeholder for video, or replace with a video icon if available */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="5" width="15" height="14" rx="2" />
              <polygon points="16,7 22,12 16,17" fill="currentColor" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => audioInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Send audio"
          >
            <MicrophoneIcon className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
          className="hidden"
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={handleAudioChange}
          className="hidden"
        />

        {/* Message Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder={isUploading ? "Uploading..." : "Type a message..."}
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
            disabled={isRecording || isUploading}
          />

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!message.trim() || isRecording || isUploading}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
              message.trim() && !isRecording && !isUploading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Recording Button */}
        {isRecording && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onStopRecording}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors animate-pulse"
            title="Stop recording"
          >
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </motion.button>
        )}
      </form>

      {/* Upload Progress */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-blue-600 mt-2 flex items-center gap-2"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Uploading media...
        </motion.div>
      )}

      {/* Typing Indicator */}
      {isTyping && !isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-500 mt-2"
        >
          Typing...
        </motion.div>
      )}
    </motion.div>
  );
}
