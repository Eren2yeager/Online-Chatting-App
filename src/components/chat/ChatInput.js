'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  PhotoIcon, 
  MicrophoneIcon, 
  PaperClipIcon,
  VideoCameraIcon,
  DocumentIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';

export default function ChatInput({ onSendMessage, onSendMedia }) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const mediaMenuRef = useRef(null);

  // Close media menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mediaMenuRef.current && !mediaMenuRef.current.contains(event.target)) {
        setShowMediaMenu(false);
      }
    };

    if (showMediaMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMediaMenu]);

  // Detect URLs in message
  const detectLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const links = detectLinks(message);
      onSendMessage(message.trim(), links);
      setMessage('');
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

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const mediaUrl = await uploadToCloudinary(file, type);
      if (mediaUrl) {
        onSendMedia(file, type, mediaUrl);
      }
      e.target.value = null;
      setShowMediaMenu(false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
  };

  const mediaOptions = [
    {
      icon: PhotoIcon,
      label: 'Photo',
      type: 'image',
      accept: 'image/*',
      color: 'text-green-600 hover:bg-green-50'
    },
    {
      icon: VideoCameraIcon,
      label: 'Video',
      type: 'video',
      accept: 'video/*',
      color: 'text-purple-600 hover:bg-purple-50'
    },
    {
      icon: MicrophoneIcon,
      label: 'Audio',
      type: 'audio',
      accept: 'audio/*',
      color: 'text-orange-600 hover:bg-orange-50'
    },
    {
      icon: DocumentIcon,
      label: 'Document',
      type: 'document',
      accept: '.pdf,.doc,.docx,.txt,.rtf,.odt,.pages,.epub,.mobi,.azw3,.cbr,.cbz,.zip,.rar,.7z,.tar,.gz,.mp3,.wav,.flac,.aac,.ogg,.m4a,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.3gp,.m4v,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.tiff,.ico,.psd,.ai,.eps,.raw,.cr2,.nef,.arw,.dng,.heic,.heif',
      color: 'text-blue-600 hover:bg-blue-50'
    }
  ];

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Media Upload Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => setShowMediaMenu(!showMediaMenu)}
            disabled={isUploading}
            className="p-3 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
            title="Attach media"
          >
            <PaperClipIcon className="w-6 h-6" />
          </motion.button>

          {/* Media Menu Dropdown */}
          <AnimatePresence>
            {showMediaMenu && (
              <motion.div
                ref={mediaMenuRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[280px] z-50"
              >
                <div className="grid grid-cols-2 gap-3">
                  {mediaOptions.map((option) => (
                    <motion.button
                      key={option.type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = option.accept;
                        input.onchange = (e) => handleFileChange(e, option.type);
                        input.click();
                        setShowMediaMenu(false);
                      }}
                      className={`flex flex-col items-center p-4 rounded-lg transition-colors ${option.color}`}
                    >
                      <option.icon className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={handleTyping}
            placeholder={isUploading ? "Uploading..." : "Type a message..."}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-base resize-none max-h-32"
            rows="1"
            disabled={isUploading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          {/* Emoji Button */}
          <button
            type="button"
            className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Send Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!message.trim() || isUploading}
          className={`p-3 rounded-full transition-colors ${
            message.trim() && !isUploading
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <PaperAirplaneIcon className="w-6 h-6" />
        </motion.button>
      </form>

      {/* Upload Progress */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3"
        >
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="text-sm text-gray-600">Uploading...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
