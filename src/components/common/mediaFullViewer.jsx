"use client"
import React, { memo, useState,  useEffect, useRef  } from 'react';
import { useMediaFullView } from '@/components/layout/mediaFullViewContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentIcon, PlayIcon, PhotoIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
  import { HiOutlineDocumentText, HiOutlineSpeakerWave } from "react-icons/hi2";
  import { HiOutlineDownload } from "react-icons/hi";
  import { HiOutlinePlay } from "react-icons/hi2";
// Helper to determine media type
function getMediaType(media) {
  if (!media?.type && media?.url) {
    // fallback: guess from url
    if (media.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (media.url.match(/\.(mp4|webm|mov)$/i)) return 'video';
    if (media.url.match(/\.(mp3|wav|ogg)$/i)) return 'audio';
    return 'document';
  }
  if (media?.type?.startsWith('image/')) return 'image';
  if (media?.type?.startsWith('video/')) return 'video';
  if (media?.type?.startsWith('audio/')) return 'audio';
  return 'document';
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
                  <span className="text-xs">{media.filename || 'Audio'}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <DocumentIcon className="w-10 h-10 mb-2 opacity-80" />
                  <span className="text-xs">{media.filename || 'Document'}</span>
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
        {/* Close button row */}
        <div className="flex items-center justify-end w-full px-2 sm:px-4 pt-3 pb-1">
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
                {/* HiOutlineSpeakerWave for audio icon */}
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
          {type === 'document' && (
            <div className="flex flex-col items-center w-full">
              {/* HiOutlineDocumentText for document icon */}
              <HiOutlineDocumentText className="w-20 h-20 text-purple-400 mb-3" />
              <div className="text-white text-lg font-semibold mb-2 text-center break-all">
                {media.filename || media.url?.split('/').pop() || 'Document'}
              </div>
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition mb-2"
                download={media.filename}
              >
                <HiOutlineDownload className="w-5 h-5" />
                Download
              </a>
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 underline text-sm break-all"
              >
                Open in new tab
              </a>
            </div>
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

  // Always define mediaArray and initialIndex, even if mediaToView is null
  const mediaArray = (mediaToView && Array.isArray(mediaToView.media)) ? mediaToView.media : [];
  const initialIndex = (mediaToView && typeof mediaToView.initialIndex === 'number')
    ? mediaToView.initialIndex
    : 0;

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
          onSelect={handleSelect}z
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