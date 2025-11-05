"use client"
import React, { memo, useState,  useEffect, useRef  } from 'react';
import { useMediaFullView } from '@/components/layout/mediaFullViewContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { HiOutlineSpeakerWave } from "react-icons/hi2";
import { HiOutlineDownload } from "react-icons/hi";

// File Info Display Component (for non-media files)
const FileInfoDisplay = ({ media, onDownload }) => {
  return (
    <div className="flex flex-col items-center w-full">
      {/* File icon based on type */}
      <div className="text-8xl mb-4">{getFileIcon(media)}</div>
      <div className="text-white text-xl font-semibold mb-2 text-center px-4">
        {media.filename || media.url?.split('/').pop() || 'File'}
      </div>
      {media.size && (
        <div className="text-gray-400 text-sm mb-4">
          {(media.size / 1024 / 1024).toFixed(2)} MB
        </div>
      )}
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-lg"
      >
        <HiOutlineDownload className="w-5 h-5" />
        Download
      </button>
      {/* File info */}
      <div className="mt-6 bg-zinc-800/50 rounded-lg p-4 w-full max-w-md">
        <div className="text-gray-300 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="font-medium">{media.mime || media.type || 'Unknown'}</span>
          </div>
          {media.size && (
            <div className="flex justify-between">
              <span className="text-gray-400">Size:</span>
              <span className="font-medium">{(media.size / 1024).toFixed(2)} KB</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
    // Fallback: open in new tab
    window.open(media.url, '_blank');
  }
}

// Helper to determine media type (only image, video, audio, or other)
function getMediaType(media) {
  const mime = media?.mime || media?.type || '';
  const url = media?.url || '';
  
  // Check MIME type first
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  
  // Check URL/filename extension
  if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) return 'image';
  if (url.match(/\.(mp4|webm|mov|avi|mkv)$/i)) return 'video';
  if (url.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) return 'audio';
  
  // Everything else is just a file
  return 'file';
}

// Helper to get file icon based on type
function getFileIcon(media) {
  const mime = media?.mime || media?.type || '';
  const filename = media?.filename || '';
  
  if (mime === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
    return '📄';
  }
  if (mime.includes('word') || filename.match(/\.(doc|docx)$/i)) {
    return '📝';
  }
  if (mime.includes('excel') || mime.includes('spreadsheet') || filename.match(/\.(xls|xlsx)$/i)) {
    return '📊';
  }
  if (mime.includes('powerpoint') || mime.includes('presentation') || filename.match(/\.(ppt|pptx)$/i)) {
    return '📊';
  }
  if (mime.includes('zip') || mime.includes('compressed') || filename.match(/\.(zip|rar|7z)$/i)) {
    return '🗜️';
  }
  if (mime.includes('text') || filename.match(/\.(txt|md)$/i)) {
    return '📃';
  }
  return '📁';
}

const MediaGalleryDialog = ({ mediaArray, onSelect, onClose }) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    // onClick={onClose}
  >
    <motion.div
      className="bg-white/10 rounded-xl p-6 max-w-2xl w-full m-4 max-h-screen overflow-y-auto shadow-2xl flex flex-col gap-4 relative"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white bg-black/40 hover:bg-red-500 rounded-full px-3 py-1 font-bold text-lg transition"
      >
        ×
      </button>
      <div className="text-center text-lg font-semibold text-white mb-2">Media Gallery</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {mediaArray.map((media, idx) => {
          const type = getMediaType(media);
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className="group relative rounded-lg overflow-hidden bg-zinc-900/60 hover:ring-2 hover:ring-blue-400 transition"
              style={{ aspectRatio: '1/1' }}
            >
              {type === 'image' ? (
                <img
                  src={media.url}
                  alt={media.filename || `media-${idx}`}
                  className="object-cover w-full h-full group-hover:scale-105 transition"
                />
              ) : type === 'video' ? (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <PlayIcon className="w-10 h-10 mb-2 opacity-80" />
                  <span className="text-xs">{media.filename || 'Video'}</span>
                </div>
              ) : type === 'audio' ? (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <SpeakerWaveIcon className="w-10 h-10 mb-2 opacity-80" />
                  <span className="text-xs truncate px-2">{media.filename || 'Audio'}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white bg-gradient-to-br from-gray-800/40 to-gray-700/40">
                  <div className="text-5xl mb-2">{getFileIcon(media)}</div>
                  <span className="text-xs truncate px-2">{media.filename || 'File'}</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-xs text-white px-2 py-1 truncate">
                {media.filename || media.url?.split('/').pop()}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  </motion.div>
);


const MediaFullDialog = ({ media, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  const type = getMediaType(media);
  const dialogRef = useRef(null);

  // Keyboard navigation for left/right arrow keys
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={dialogRef}
    >
      <motion.div
        className="relative flex flex-col items-stretch bg-zinc-900/90 rounded-xl shadow-2xl w-full max-w-3xl sm:max-w-4xl md:max-w-5xl max-h-[95vh] mx-2"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{
          minHeight: "320px",
          minWidth: "0",
        }}
      >
        {/* Header with download and close buttons */}
        <div className="flex items-center justify-between w-full px-2 sm:px-4 pt-3 pb-1">
          <button
            onClick={() => downloadFile(media)}
            className="flex items-center px-3 py-1 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition text-sm"
            aria-label="Download"
          >
            <HiOutlineDownload className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center px-3 py-1 rounded-lg font-bold text-white bg-black/40 hover:bg-red-500 transition text-lg"
            aria-label="Close"
          >
            × <span className="ml-1 text-base hidden sm:inline">Close</span>
          </button>
        </div>
        {/* Filename bar */}
        <div className="flex items-center justify-center w-full px-2 sm:px-4 pb-2">
          <div className="flex-1 text-white text-xs sm:text-sm font-mono truncate text-center px-2">
            {media.filename || media.url?.split('/').pop()}
          </div>
        </div>
        {/* Main media area, always same height for stability */}
        <div className="flex flex-1 items-center justify-center w-full min-h-[250px] max-h-[70vh] sm:max-h-[70vh] p-2 sm:p-4 relative"
          style={{
            minHeight: "250px",
            maxHeight: "70vh",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {type === 'image' && (
            <img
              src={media.url}
              alt={media.filename || 'Image'}
              className="max-h-full max-w-full w-auto h-auto rounded-lg object-contain shadow-lg mx-auto"
              style={{
                maxHeight: "60vh",
                maxWidth: "100%",
                width: "auto",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
          )}
          {type === 'video' && (
            <video
              src={media.url}
              controls
              className="max-h-full max-w-full w-auto h-auto rounded-lg shadow-lg bg-black mx-auto"
              style={{
                maxHeight: "60vh",
                maxWidth: "100%",
                width: "auto",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            >
              Your browser does not support the video tag.
            </video>
          )}
          {type === 'audio' && (
            <div className="flex flex-col justify-center items-center w-full">
              <div className="flex flex-col items-center justify-center mb-4">
                <HiOutlineSpeakerWave className="w-16 h-16 text-blue-400 mb-2" />
                <div className="text-white text-lg font-semibold mb-1 text-center">
                  {media.filename || media.url?.split('/').pop() || 'Audio'}
                </div>
              </div>
              <audio
                src={media.url}
                controls
                className="w-full max-w-md rounded-lg bg-zinc-800"
                style={{ background: "#18181b" }}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          {type === 'file' && (
            <FileInfoDisplay media={media} onDownload={() => downloadFile(media)} />
          )}
        </div>
        {/* Navigation and hint row */}
        <div className="flex  sm:flex-row items-center justify-between w-full px-2 sm:px-4 py-2 gap-2 border-t border-zinc-800 bg-zinc-900/80">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-white bg-black/30 hover:bg-blue-500 transition ${!hasPrev ? 'opacity-30 cursor-not-allowed' : ''}`}
            aria-label="Previous (Left Arrow)"
            style={{ minWidth: 64 }}
          >
            <span className="hidden sm:inline">&larr;&nbsp;</span>Prev
          </button>
          <div className="text-xs text-gray-400 text-center flex-1 py-1">
            <span>Use &larr; and &rarr; keys to navigate</span>
          </div>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`flex items-center px-4 py-2 rounded-lg font-bold text-white bg-black/30 hover:bg-blue-500 transition ${!hasNext ? 'opacity-30 cursor-not-allowed' : ''}`}
            aria-label="Next (Right Arrow)"
            style={{ minWidth: 64 }}
          >
            Next<span className="hidden sm:inline">&nbsp;&rarr;</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MediaFullViewer = () => {
  const { mediaToView, setMediaToView } = useMediaFullView();
  // Remove the console.log(mediaToView); for production

  // Fix: Don't use hooks conditionally! 
  // Move all hooks to the top level, and use state reset logic in useEffect.

  const [selectedIndex, setSelectedIndex] = useState(null);

  // Always define mediaArray, even if mediaToView is null
  const mediaArray = (mediaToView && Array.isArray(mediaToView.media)) ? mediaToView.media : [];

  // If only one media, open full dialog directly
  const showGallery = mediaArray.length > 1 && selectedIndex === null;
  const showFull = mediaArray.length === 1 || selectedIndex !== null;

  // Handlers
  const handleClose = () => {
    setSelectedIndex(null);
    setMediaToView(null);
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

  // Effect to set selectedIndex when mediaToView changes
  useEffect(() => {
    if (!mediaToView || !Array.isArray(mediaToView.media) || mediaToView.media.length === 0) {
      setSelectedIndex(null);
      return;
    }
    if (mediaToView.media.length === 1) {
      setSelectedIndex(0);
    } else if (
      typeof mediaToView.initialIndex === 'number' &&
      mediaToView.initialIndex >= 0 &&
      mediaToView.initialIndex < mediaToView.media.length
    ) {
      setSelectedIndex(mediaToView.initialIndex);
    } else {
      setSelectedIndex(null);
    }
  }, [mediaToView]);

  // If no mediaToView or no media array, don't show anything
  if (!mediaToView || !Array.isArray(mediaToView.media) || mediaToView.media.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {showGallery && (
        <MediaGalleryDialog
          key="gallery"
          mediaArray={mediaArray}
          onSelect={handleSelect}
          onClose={handleClose}
        />
      )}
      {showFull && typeof selectedIndex === 'number' && mediaArray[selectedIndex] && (
        <MediaFullDialog
          key="full"
          media={mediaArray[selectedIndex]}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < mediaArray.length - 1}
        />
      )}
    </AnimatePresence>
  );
};

export default memo(MediaFullViewer);