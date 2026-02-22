'use client'
import React, { memo, useState, useEffect, useRef } from 'react';
import { useMediaFullView } from '@/components/layout/mediaFullViewContext';
import { motion, AnimatePresence } from 'framer-motion';
import {  HiOutlineDownload } from "react-icons/hi";
import { PlayIcon } from '@heroicons/react/24/outline';
import { HiOutlineSpeakerWave } from "react-icons/hi2";
// Helper to download file properly
async function downloadFile(media) {
  try {
    const response = await fetch(media.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = media.filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    window.open(media.url, '_blank');
  }
}

// Helper to determine media type
function getMediaType(media) {
  const mime = media?.mime || media?.type || '';
  const url = media?.url || '';
  
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  
  if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) return 'image';
  if (url.match(/\.(mp4|webm|mov|avi|mkv)$/i)) return 'video';
  if (url.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) return 'audio';
  
  return 'file';
}

// Helper to get file icon
function getFileIcon(media) {
  const mime = media?.mime || media?.type || '';
  const filename = media?.filename || '';
  
  if (mime === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) return '📄';
  if (mime.includes('word') || filename.match(/\.(doc|docx)$/i)) return '📝';
  if (mime.includes('excel') || mime.includes('spreadsheet') || filename.match(/\.(xls|xlsx)$/i)) return '📊';
  if (mime.includes('powerpoint') || mime.includes('presentation') || filename.match(/\.(ppt|pptx)$/i)) return '📊';
  if (mime.includes('zip') || mime.includes('compressed') || filename.match(/\.(zip|rar|7z)$/i)) return '🗜️';
  if (mime.includes('text') || filename.match(/\.(txt|md)$/i)) return '📃';
  return '📁';
}

// File Info Display Component
const FileInfoDisplay = ({ media, onDownload }) => {
  return (
    <div className="flex flex-col items-center w-full px-4">
      <div className="text-8xl mb-4">{getFileIcon(media)}</div>
      <div className="text-gray-900 text-xl font-semibold mb-2 text-center">
        {media.filename || media.url?.split('/').pop() || 'File'}
      </div>
      {media.size && (
        <div className="text-gray-600 text-sm mb-4">
          {(media.size / 1024 / 1024).toFixed(2)} MB
        </div>
      )}
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 backdrop-blur-sm text-white rounded-xl font-medium transition-all shadow-lg border border-blue-600"
      >
        <HiOutlineDownload className="w-5 h-5" />
        Download
      </button>
      <div className="mt-6 bg-gray-50 backdrop-blur-md rounded-xl p-4 w-full max-w-md border border-gray-200">
        <div className="text-gray-700 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium">{media.mime || media.type || 'Unknown'}</span>
          </div>
          {media.size && (
            <div className="flex justify-between">
              <span className="text-gray-600">Size:</span>
              <span className="font-medium">{(media.size / 1024).toFixed(2)} KB</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Thumbnail Belt Component
const ThumbnailBelt = ({ mediaArray, selectedIndex, onSelect }) => {
  const beltRef = useRef(null);

  useEffect(() => {
    if (beltRef.current && selectedIndex !== null) {
      const selectedThumb = beltRef.current.children[selectedIndex];
      if (selectedThumb) {
        selectedThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedIndex]);

  if (mediaArray.length <= 1) return null;

  return (
    <div className="w-full bg-gray-50 backdrop-blur-xl border-t border-gray-200">
      <div 
        ref={beltRef}
        className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {mediaArray.map((media, idx) => {
          const type = getMediaType(media);
          const isSelected = idx === selectedIndex;
          
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-300 ${
                isSelected 
                  ? 'ring-2 ring-blue-500 shadow-lg scale-110' 
                  : 'ring-1 ring-gray-300 hover:ring-gray-400 hover:scale-105 opacity-70 hover:opacity-100'
              }`}
            >
              {type === 'image' ? (
                <img
                  src={media.url}
                  alt={media.filename || `media-${idx}`}
                  className="object-cover w-full h-full"
                />
              ) : type === 'video' ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-600/40 to-blue-600/40 backdrop-blur-sm">
                  <PlayIcon className="w-8 h-8 text-white" />
                </div>
              ) : type === 'audio' ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-600/40 to-teal-600/40 backdrop-blur-sm">
                  <HiOutlineSpeakerWave className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 backdrop-blur-sm">
                  <div className="text-3xl">{getFileIcon(media)}</div>
                </div>
              )}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/20 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MediaFullDialog = ({ media, onClose, onPrev, onNext, hasPrev, hasNext, mediaArray, selectedIndex, onSelect }) => {
  const type = getMediaType(media);
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" && hasPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, onPrev, onNext, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-3xl"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <motion.div
        className="relative flex flex-col items-stretch w-full max-w-7xl max-h-[98vh] mx-2 sm:mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar - Glass morphism */}
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-t-2xl shadow-2xl">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="text-gray-900 text-sm sm:text-base font-medium truncate">
                {media.filename || media.url?.split('/').pop() || 'Media'}
              </div>
              {mediaArray.length > 1 && (
                <div className="text-gray-600 text-xs sm:text-sm font-medium whitespace-nowrap">
                  {selectedIndex + 1} / {mediaArray.length}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadFile(media)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 backdrop-blur-sm transition-all border border-gray-300 shadow-lg"
                aria-label="Download"
              >
                <HiOutlineDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline text-sm">Download</span>
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-red-500 hover:text-white backdrop-blur-sm transition-all border border-gray-300 shadow-lg text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area with Navigation Arrows */}
        <div className="relative flex items-center justify-center bg-white/90 backdrop-blur-xl border-x border-gray-200 overflow-hidden" style={{ minHeight: '300px', height: 'calc(98vh - 180px)', maxHeight: 'calc(98vh - 180px)' }}>
          {/* Left Arrow */}
          {hasPrev && (
            <button
              onClick={onPrev}
              className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-gray-100 backdrop-blur-md transition-all border border-gray-300 shadow-xl flex items-center justify-center text-gray-700 text-xl sm:text-2xl font-bold"
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          {/* Media Content - Scrollable Container */}
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-auto">
            <div className="w-full h-full flex items-center justify-center">
              {type === 'image' && (
                <img
                  src={media.url}
                  alt={media.filename || 'Image'}
                  className="max-h-full max-w-full w-auto h-auto rounded-xl object-contain shadow-2xl"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              )}
              {type === 'video' && (
                <video
                  src={media.url}
                  controls
                  className="max-h-full max-w-full w-auto h-auto rounded-xl shadow-2xl bg-black/50"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {type === 'audio' && (
                <div className="flex flex-col justify-center items-center w-full max-w-2xl px-4">
                  <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-100 to-teal-100 backdrop-blur-md flex items-center justify-center mb-3 sm:mb-4 border border-gray-300 shadow-xl">
                      <HiOutlineSpeakerWave className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
                    </div>
                    <div className="text-gray-900 text-base sm:text-lg font-semibold text-center px-4 break-words">
                      {media.filename || media.url?.split('/').pop() || 'Audio'}
                    </div>
                  </div>
                  <audio
                    src={media.url}
                    controls
                    className="w-full rounded-xl shadow-xl"
                    style={{ background: 'rgba(243, 244, 246, 1)' }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              {type === 'file' && (
                <FileInfoDisplay media={media} onDownload={() => downloadFile(media)} />
              )}
            </div>
          </div>

          {/* Right Arrow */}
          {hasNext && (
            <button
              onClick={onNext}
              className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-gray-100 backdrop-blur-md transition-all border border-gray-300 shadow-xl flex items-center justify-center text-gray-700 text-xl sm:text-2xl font-bold"
              aria-label="Next"
            >
              ›
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Belt */}
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-b-2xl shadow-2xl overflow-hidden">
          <ThumbnailBelt 
            mediaArray={mediaArray} 
            selectedIndex={selectedIndex} 
            onSelect={onSelect}
          />
          {mediaArray.length <= 1 && (
            <div className="text-center text-xs text-gray-500 py-3">
              Use ← → keys or swipe to navigate
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const MediaFullViewer = () => {
  const { mediaData, closeMediaFullView } = useMediaFullView();
  const [selectedIndex, setSelectedIndex] = useState(null);

  const mediaArray = (mediaData && Array.isArray(mediaData.media)) ? mediaData.media : [];

  const handleClose = () => {
    setSelectedIndex(null);
    closeMediaFullView();
  };

  const handleSelect = (idx) => {
    setSelectedIndex(idx);
  };

  const handlePrev = () => {
    setSelectedIndex((idx) => (idx > 0 ? idx - 1 : idx));
  };

  const handleNext = () => {
    setSelectedIndex((idx) => (idx < mediaArray.length - 1 ? idx + 1 : idx));
  };

  useEffect(() => {
    if (!mediaData || !Array.isArray(mediaData.media) || mediaData.media.length === 0) {
      setSelectedIndex(null);
      return;
    }
    if (mediaData.media.length === 1) {
      setSelectedIndex(0);
    } else if (
      typeof mediaData.initialIndex === 'number' &&
      mediaData.initialIndex >= 0 &&
      mediaData.initialIndex < mediaData.media.length
    ) {
      setSelectedIndex(mediaData.initialIndex);
    } else {
      setSelectedIndex(0);
    }
  }, [mediaData]);

  if (!mediaData || !Array.isArray(mediaData.media) || mediaData.media.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {typeof selectedIndex === 'number' && mediaArray[selectedIndex] && (
        <MediaFullDialog
          key="full"
          media={mediaArray[selectedIndex]}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < mediaArray.length - 1}
          mediaArray={mediaArray}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />
      )}
    </AnimatePresence>
  );
};

export default memo(MediaFullViewer);