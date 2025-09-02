"use client"
import React, { memo, useState, useEffect } from 'react';
import { useMediaFullView } from '@/components/layout/mediaFullViewContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentIcon, PlayIcon, PhotoIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

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
                  alt={media.name || `media-${idx}`}
                  className="object-cover w-full h-full group-hover:scale-105 transition"
                />
              ) : type === 'video' ? (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <PlayIcon className="w-10 h-10 mb-2 opacity-80" />
                  <span className="text-xs">{media.name || 'Video'}</span>
                </div>
              ) : type === 'audio' ? (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <SpeakerWaveIcon className="w-10 h-10 mb-2 opacity-80" />
                  <span className="text-xs">{media.name || 'Audio'}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <DocumentIcon className="w-10 h-10 mb-2 opacity-80" />
                  <span className="text-xs">{media.name || 'Document'}</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-xs text-white px-2 py-1 truncate">
                {media.name || media.url?.split('/').pop()}
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
  return (
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // onClick={onClose} 
    >
      <motion.div
        className="relative flex flex-col items-center bg-zinc-900/80 rounded-xl p-4 shadow-2xl max-w-[90vw] max-h-[90vh]"
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
        <div className="flex items-center justify-center w-full h-full min-h-[300px] min-w-[300px]">
          {type === 'image' && (
            <img
              src={media.url}
              alt={media.name || 'Image'}
              className="max-w-[80vw] max-h-[70vh] rounded-lg object-contain shadow-lg"
            />
          )}
          {type === 'video' && (
            <video
              src={media.url}
              controls
              className="max-w-[80vw] max-h-[70vh] rounded-lg shadow-lg bg-black"
            >
              Your browser does not support the video tag.
            </video>
          )}
          {type === 'audio' && (
            <div className="flex flex-col items-center w-full">
              <audio
                src={media.url}
                controls
                className="w-full max-w-md"
              >
                Your browser does not support the audio element.
              </audio>
              <div className="mt-2 text-white text-sm">{media.name || 'Audio'}</div>
            </div>
          )}
          {type === 'document' && (
            <div className="flex flex-col items-center w-full">
              <DocumentIcon className="w-16 h-16 text-white mb-2" />
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 underline text-lg break-all"
                download={media.name}
              >
                {media.name || media.url?.split('/').pop() || 'Document'}
              </a>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between w-full mt-4">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`px-4 py-2 rounded-lg font-bold text-white bg-black/30 hover:bg-blue-500 transition ${!hasPrev ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            Prev
          </button>
          <div className="text-white text-sm font-mono truncate w-full">
            {media.name || media.url?.split('/').pop()}
          </div>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`px-4 py-2 rounded-lg font-bold text-white bg-black/30 hover:bg-blue-500 transition ${!hasNext ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            Next
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