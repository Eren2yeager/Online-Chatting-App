'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  EllipsisVerticalIcon, 
  PlayIcon, 
  PauseIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../providers/SocketProvider';
import MessageContextMenu from './MessageContextMenu';

export default function ChatMessage({ message, onDelete, isOwnMessage }) {
  const { data: session } = useSession();
  const { emit } = useSocket();
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);

  // Detect URLs in text
  const detectLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleDeleteMessage = async (deleteFor = 'me') => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteFor }),
      });

      if (response.ok) {
        emit('delete-message', {
          conversationId: message.conversationId,
          messageId: message.id,
          deletedFor: deleteFor
        });

        if (onDelete) {
          onDelete(message.id, deleteFor);
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleReport = () => {
    console.log('Report message:', message);
    closeContextMenu();
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const handleAudioSeek = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const seekTime = (clickX / width) * audioRef.current.duration;
      audioRef.current.currentTime = seekTime;
    }
  };

  const renderTextContent = (text) => {
    const links = detectLinks(text);
    if (links.length === 0) {
      return <span className="text-gray-900">{text}</span>;
    }

    let lastIndex = 0;
    const elements = [];

    links.forEach((link, index) => {
      const linkIndex = text.indexOf(link, lastIndex);
      if (linkIndex > lastIndex) {
        elements.push(
          <span key={`text-${index}`} className="text-gray-900">
            {text.slice(lastIndex, linkIndex)}
          </span>
        );
      }
      elements.push(
        <a
          key={`link-${index}`}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {link}
        </a>
      );
      lastIndex = linkIndex + link.length;
    });

    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end" className="text-gray-900">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  const renderMediaContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <img
            src={message.mediaUrl}
            alt="Shared image"
            className="max-w-full sm:max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.mediaUrl, '_blank')}
          />
        );
      case 'video':
        return (
          <video
            src={message.mediaUrl}
            controls
            className="max-w-full sm:max-w-xs rounded-lg"
            preload="metadata"
          />
        );
      case 'audio':
        return (
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 max-w-full sm:max-w-xs">
            <button
              onClick={toggleAudio}
              className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              {audioPlaying ? (
                <PauseIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1">
              <div 
                className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
                onClick={handleAudioSeek}
              >
                <div 
                  className="h-2 bg-green-600 rounded-full transition-all duration-100"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>
            <audio
              ref={audioRef}
              src={message.mediaUrl}
              onTimeUpdate={handleAudioTimeUpdate}
              onEnded={() => setAudioPlaying(false)}
              preload="metadata"
            />
          </div>
        );
      case 'document':
        return (
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 max-w-full sm:max-w-xs">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Document</p>
              <p className="text-xs text-gray-500">Click to download</p>
            </div>
            <a
              href={message.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800"
            >
              Download
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  if (isDeleting) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">
          Message deleted
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 group`}
      >
        <div className={`max-w-full sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          <div
            className={`relative rounded-2xl px-4 py-2 ${
              isOwnMessage
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
            onContextMenu={handleContextMenu}
          >
            {/* Message content */}
            <div className="space-y-2">
              {message.content && (
                <div className="break-words">
                  {renderTextContent(message.content)}
                </div>
              )}
              {message.mediaUrl && renderMediaContent()}
            </div>

            {/* Timestamp and status */}
            <div className={`flex items-center justify-between mt-1 ${
              isOwnMessage ? 'text-green-100' : 'text-gray-500'
            }`}>
              <span className="text-xs">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {isOwnMessage && (
                <div className="flex items-center">
                  <CheckIcon className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Context menu button */}
            <button
              onClick={handleContextMenu}
              className={`absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                isOwnMessage ? 'text-green-100 hover:text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Context Menu */}
      <MessageContextMenu
        isVisible={contextMenu.visible}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={closeContextMenu}
        onCopy={handleCopy}
        onDelete={handleDeleteMessage}
        onReport={handleReport}
        isOwnMessage={isOwnMessage}
      />
    </>
  );
}
