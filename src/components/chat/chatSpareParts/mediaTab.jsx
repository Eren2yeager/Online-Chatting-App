'use client';

import { motion } from "framer-motion";
import { 
  PhotoIcon, 
  DocumentIcon, 
  PlayIcon, 
  SpeakerWaveIcon 
} from "@heroicons/react/24/outline";

export default function MediaTab({ mediaFiles, onMediaClick }) {
  // Categorize media
  const imageFiles = mediaFiles.filter(
    (m) => m.type?.startsWith("image/") || m.mime?.startsWith("image/")
  );
  const videoFiles = mediaFiles.filter(
    (m) => m.type?.startsWith("video/") || m.mime?.startsWith("video/")
  );
  const audioFiles = mediaFiles.filter(
    (m) => m.type?.startsWith("audio/") || m.mime?.startsWith("audio/")
  );
  const documentFiles = mediaFiles.filter(
    (m) =>
      m.type?.startsWith("application/") ||
      m.mime?.startsWith("application/") ||
      m.type?.startsWith("text/") ||
      m.mime?.startsWith("text/")
  );

  // If no media at all
  if (
    imageFiles.length === 0 &&
    videoFiles.length === 0 &&
    audioFiles.length === 0 &&
    documentFiles.length === 0
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
          <PhotoIcon className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No media shared yet
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          When group members share photos, videos, audio, or files, they'll appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Shared Media
      </h3>

      {/* Images */}
      {imageFiles.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-4">
            Photos <span className="text-gray-400 font-normal">({imageFiles.length})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageFiles.map((media, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMediaClick(imageFiles, idx)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all"
                title={media.filename || `Image ${idx + 1}`}
              >
                <img
                  src={media.url}
                  alt={media.filename || `image-${idx}`}
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs px-3 py-2 truncate transform translate-y-full group-hover:translate-y-0 transition-transform">
                  {media.filename || "Image"}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videoFiles.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-4">
            Videos <span className="text-gray-400 font-normal">({videoFiles.length})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {videoFiles.map((media, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMediaClick(videoFiles, idx)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-900 shadow-md hover:shadow-xl transition-all"
                title={media.filename || `Video ${idx + 1}`}
              >
                {media.thumbnailUrl ? (
                  <img
                    src={media.thumbnailUrl}
                    alt={media.filename || `video-${idx}`}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <PlayIcon className="w-12 h-12 text-white opacity-60" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <PlayIcon className="w-7 h-7 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs px-3 py-2 truncate">
                  {media.filename || "Video"}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Audio */}
      {audioFiles.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-4">
            Audio <span className="text-gray-400 font-normal">({audioFiles.length})</span>
          </h4>
          <div className="space-y-2">
            {audioFiles.map((media, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onMediaClick(audioFiles, idx)}
                className="w-full p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left flex items-center gap-4 bg-white shadow-sm hover:shadow-md"
                title={media.filename || `Audio ${idx + 1}`}
              >
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <SpeakerWaveIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {media.filename || "Audio File"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {media.size
                      ? `${(media.size / 1024 / 1024).toFixed(1)} MB`
                      : "Unknown size"}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {documentFiles.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-4">
            Files <span className="text-gray-400 font-normal">({documentFiles.length})</span>
          </h4>
          <div className="space-y-2">
            {documentFiles.map((file, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onMediaClick([file], 0)}
                className="w-full p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left flex items-center gap-4 bg-white shadow-sm hover:shadow-md"
                title={file.name || file.filename || `File ${idx + 1}`}
              >
                <div className="h-12 w-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <DocumentIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {file.name || file.filename || "Document"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {file.size
                      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                      : "Unknown size"}
                    {file.mime && ` • ${file.mime}`}
                  </div>
                </div>
                {file.createdAt && (
                  <div className="text-xs text-gray-400">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
