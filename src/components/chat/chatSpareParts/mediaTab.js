import { PhotoIcon, DocumentIcon, PlayIcon, SpeakerWaveIcon } from "@heroicons/react/24/outline";

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
      <div className="text-center py-12">
        <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No media shared yet
        </h3>
        <p className="text-gray-500">
          When group members share photos, videos, audio, or files, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-900">Shared Media</h3>

      {/* Images */}
      {imageFiles.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Photos <span className="text-gray-400 font-normal">({imageFiles.length})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageFiles.map((media, idx) => (
              <button
                key={idx}
                onClick={() => onMediaClick(imageFiles, idx)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400 transition-all"
                title={media.filename || `Image ${idx + 1}`}
              >
                <div className="w-full h-full relative flex items-center justify-center bg-gray-200">
                  {/* Use native img tag instead of next/image */}
                  <img
                    src={media.url}
                    alt={media.filename || `image-${idx}`}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-2 py-1 truncate">
                  {media.filename || `Image`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videoFiles.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Videos <span className="text-gray-400 font-normal">({videoFiles.length})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {videoFiles.map((media, idx) => (
              <button
                key={idx}
                onClick={() => onMediaClick(videoFiles, idx)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400 transition-all"
                title={media.filename || `Video ${idx + 1}`}
              >
                {media.thumbnailUrl ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-gray-200">
                    <img
                      src={media.thumbnailUrl}
                      alt={media.filename || `video-${idx}`}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <PlayIcon className="w-10 h-10 text-white opacity-80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate flex items-center">
                  <PlayIcon className="w-4 h-4 mr-1 inline" />
                  {media.filename || "Video"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audio */}
      {audioFiles.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Audio <span className="text-gray-400 font-normal">({audioFiles.length})</span>
          </h4>
          <div className="space-y-2">
            {audioFiles.map((media, idx) => (
              <button
                key={idx}
                onClick={() => onMediaClick(audioFiles, idx)}
                className="w-full p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
                title={media.filename || `Audio ${idx + 1}`}
              >
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <SpeakerWaveIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {media.filename || "Audio File"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {media.size
                      ? `${(media.size / 1024 / 1024).toFixed(1)} MB`
                      : "Unknown size"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {documentFiles.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Files <span className="text-gray-400 font-normal">({documentFiles.length})</span>
          </h4>
          <div className="space-y-2">
            {documentFiles.map((file, idx) => (
              <button
                key={idx}
                onClick={() => onMediaClick([file], 0)}
                className="w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
                title={file.name || file.filename || `File ${idx + 1}`}
              >
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DocumentIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {file.name || file.filename || "Document"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {file.size
                      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                      : "Unknown size"}
                    {file.mime && ` • ${file.mime}`}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {file.createdAt
                    ? new Date(file.createdAt).toLocaleDateString()
                    : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}