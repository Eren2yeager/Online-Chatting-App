"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  EllipsisVerticalIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  CheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { UserAvatar } from "@/components/ui";
import { usePresence } from "@/lib/socket";
import { useMediaFullView } from "@/components/layout/mediaFullViewContext";
import MessageContextMenu from "./MessageContextMenu.jsx";

/**
 * Enhanced ChatMessage Component with comprehensive media support
 * Supports: Images, Videos, Audio, Documents (PDF, DOC, XLS, PPT, TXT, ZIP, etc.)
 */
export default function ChatMessage({
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete,
  onReact,
  showAvatar = true,
}) {
  const router = useRouter();
  const onlineUsers = usePresence();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [readBy, setReadBy] = useState(message.readBy || []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);

  const messageRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const { openMediaFullView } = useMediaFullView();

  const isSystem = message.type === "system";

  // Update readBy when message prop changes (handled by ChatWindow)
  useEffect(() => {
    setReadBy(message.readBy || []);
  }, [message.readBy]);
  const isDeleted = message.isDeleted === true;
  const hasMedia = message.media && message.media.length > 0;
  const hasText = message.text && message.text.trim().length > 0;

  // Audio player handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleContextMenu = (e) => {
    if (isSystem) return;
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleMediaClick = (mediaArray, index) => {
    const viewableMedia = mediaArray.filter((m) => isImage(m) || isVideo(m));
    const viewableIndex = viewableMedia.findIndex(
      (m) => m.url === mediaArray[index].url
    );
    openMediaFullView({
      media: viewableMedia,
      initialIndex: Math.max(0, viewableIndex),
    });
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * audioRef.current.duration;
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  const getFileIcon = (media) => {
    const ext = getFileExtension(media);
    const mime = media.mime || media.type || "";

    // Document types
    if (mime.includes("pdf") || ext === "pdf") {
      return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
    }
    if (mime.includes("word") || ["doc", "docx"].includes(ext)) {
      return <DocumentTextIcon className="h-8 w-8 text-blue-500" />;
    }
    if (
      mime.includes("sheet") ||
      mime.includes("excel") ||
      ["xls", "xlsx"].includes(ext)
    ) {
      return <DocumentTextIcon className="h-8 w-8 text-green-500" />;
    }
    if (
      mime.includes("presentation") ||
      mime.includes("powerpoint") ||
      ["ppt", "pptx"].includes(ext)
    ) {
      return <DocumentTextIcon className="h-8 w-8 text-orange-500" />;
    }
    if (
      mime.includes("text") ||
      ["txt", "md", "json", "xml", "csv"].includes(ext)
    ) {
      return <DocumentTextIcon className="h-8 w-8 text-gray-500" />;
    }
    if (
      mime.includes("zip") ||
      mime.includes("rar") ||
      mime.includes("7z") ||
      ["zip", "rar", "7z", "tar", "gz"].includes(ext)
    ) {
      return <ArchiveBoxIcon className="h-8 w-8 text-purple-500" />;
    }

    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  const getFileExtension = (media) => {
    const filename = media.filename || media.name || media.url || "";
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  };

  const isImage = (media) => {
    const mime = media.mime || media.type || "";
    const ext = getFileExtension(media);
    return (
      mime.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)
    );
  };

  const isVideo = (media) => {
    const mime = media.mime || media.type || "";
    const ext = getFileExtension(media);
    return (
      mime.startsWith("video/") ||
      ["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext)
    );
  };

  const isAudio = (media) => {
    const mime = media.mime || media.type || "";
    const ext = getFileExtension(media);
    return (
      mime.startsWith("audio/") ||
      ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)
    );
  };

  const isDocument = (media) => {
    return !isImage(media) && !isVideo(media) && !isAudio(media);
  };

  const downloadFile = async (media) => {
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = media.filename || media.name || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const renderMediaGrid = () => {
    if (!hasMedia) return null;

    const mediaItems = message.media;
    const imageVideos = mediaItems.filter((m) => isImage(m) || isVideo(m));
    const audioFiles = mediaItems.filter((m) => isAudio(m));
    const documents = mediaItems.filter((m) => isDocument(m));

    return (
      <div className="space-y-2 w-full max-w-full">
        {/* Images and Videos Grid */}
        {imageVideos.length > 0 && (
          <div
            className={`grid gap-1 sm:gap-1.5 md:gap-2 w-full ${
              imageVideos.length === 1
                ? "grid-cols-1 max-w-[140px] min-[400px]:max-w-[160px] sm:max-w-[200px] md:max-w-[250px]"
                : imageVideos.length === 2
                ? "grid-cols-2 max-w-[200px] min-[400px]:max-w-[220px] sm:max-w-[280px] md:max-w-[350px]"
                : imageVideos.length === 3
                ? "grid-cols-2 max-w-[200px] min-[400px]:max-w-[220px] sm:max-w-[280px] md:max-w-[350px]"
                : "grid-cols-2 max-w-[200px] min-[400px]:max-w-[220px] sm:max-w-[280px] md:max-w-[350px]"
            }`}
          >
            {imageVideos.slice(0, 4).map((media, idx) => (
              <div key={idx} className="relative group">
                {isImage(media) ? (
                  <button
                    onClick={() => handleMediaClick(imageVideos, idx)}
                    className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100"
                  >
                    <img
                      src={media.url}
                      alt={media.filename || "Image"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {imageVideos.length > 4 && idx === 3 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          +{imageVideos.length - 4}
                        </span>
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-900">
                    {!videoError ? (
                      <video
                        ref={videoRef}
                        src={media.url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        onError={() => setVideoError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white">
                        <PlayIcon className="h-12 w-12 mb-2 opacity-50" />
                        <p className="text-sm">Video unavailable</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Audio Files */}
        {audioFiles.map((media, idx) => (
          <div
            key={`audio-${idx}`}
            className={`flex items-center gap-1 min-[400px]:gap-1.5 sm:gap-2 p-1.5 min-[400px]:p-2 rounded-lg sm:rounded-xl min-w-0 w-full ${
              isOwn ? "bg-white/20 backdrop-blur-sm" : "bg-gray-100"
            }`}
          >
            <button
              onClick={toggleAudio}
              className={`flex-shrink-0 w-6 h-6 min-[400px]:w-7 min-[400px]:h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                isOwn ? "bg-white/30" : "bg-blue-500"
              }`}
            >
              {isPlaying ? (
                <PauseIcon
                  className={`h-3 w-3 min-[400px]:h-3.5 min-[400px]:w-3.5 sm:h-4 sm:w-4 ${
                    isOwn ? "text-white" : "text-white"
                  }`}
                />
              ) : (
                <PlayIcon
                  className={`h-3 w-3 min-[400px]:h-3.5 min-[400px]:w-3.5 sm:h-4 sm:w-4 ${
                    isOwn ? "text-white" : "text-white"
                  } ml-0.5`}
                />
              )}
            </button>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-col mb-0.5">
                <div
                  className={`text-[9px] min-[400px]:text-[10px] sm:text-xs font-medium truncate ${
                    isOwn ? "text-white" : "text-gray-700"
                  }`}
                >
                  {media.filename || "Audio"}
                </div>
                <div
                  className={`text-[8px] min-[400px]:text-[9px] sm:text-[10px] ${
                    isOwn ? "text-white/70" : "text-gray-500"
                  }`}
                >
                  {formatTime(audioRef.current?.currentTime || 0)} /{" "}
                  {formatTime(audioDuration)}
                </div>
              </div>
              <div
                className={`h-1.5 rounded-full cursor-pointer ${
                  isOwn ? "bg-white/20" : "bg-gray-200"
                }`}
                onClick={handleAudioSeek}
              >
                <div
                  className={`h-full rounded-full ${
                    isOwn ? "bg-white" : "bg-blue-500"
                  }`}
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>

            <audio ref={audioRef} src={media.url} preload="metadata" />
          </div>
        ))}

        {/* Documents */}
        {documents.map((media, idx) => (
          <div
            key={`doc-${idx}`}
            className={`flex items-center gap-1 min-[400px]:gap-1.5 sm:gap-2 p-1.5 min-[400px]:p-2 rounded-lg sm:rounded-xl min-w-0 w-full ${
              isOwn ? "bg-white/20 backdrop-blur-sm" : "bg-gray-100"
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 min-[400px]:w-9 min-[400px]:h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                isOwn ? "bg-white/20" : "bg-white"
              }`}
            >
              <div className="scale-[0.55] min-[400px]:scale-[0.65] sm:scale-75">
                {getFileIcon(media)}
              </div>
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div
                className={`text-[9px] min-[400px]:text-[10px] sm:text-xs font-medium truncate ${
                  isOwn ? "text-white" : "text-gray-900"
                }`}
              >
                {media.filename || media.name || "Document"}
              </div>
              <div
                className={`text-[8px] min-[400px]:text-[9px] sm:text-[10px] ${
                  isOwn ? "text-white/70" : "text-gray-500"
                }`}
              >
                {formatFileSize(media.size)} •{" "}
                {getFileExtension(media).toUpperCase()}
              </div>
            </div>

            <button
              onClick={() => downloadFile(media)}
              className={`flex-shrink-0 p-0.5 min-[400px]:p-1 sm:p-1.5 rounded-lg ${
                isOwn ? "bg-white/20 text-white" : "bg-blue-500 text-white"
              }`}
            >
              <ArrowDownTrayIcon className="h-3 w-3 min-[400px]:h-3.5 min-[400px]:w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;

    return (
      <div
        className={`mb-2 pl-3 border-l-2 ${
          isOwn ? "border-white/40" : "border-blue-500"
        }`}
      >
        <div
          className={`text-xs font-semibold ${
            isOwn ? "text-white/90" : "text-blue-600"
          }`}
        >
          {message.replyTo.sender?.name || "User"}
        </div>
        <div
          className={`text-xs ${
            isOwn ? "text-white/70" : "text-gray-600"
          } truncate`}
        >
          {message.replyTo.text || "Media"}
        </div>
      </div>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    // Group reactions by emoji
    const reactionGroups = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {});

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(reactionGroups).map(([emoji, reactions]) => (
          <button
            key={emoji}
            onClick={() => onReact?.(emoji)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              reactions.some((r) => r.user === message.sender?._id)
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                : "bg-white border border-gray-200 text-gray-700"
            }`}
          >
            <span>{emoji}</span>
            <span className="font-medium">{reactions.length}</span>
          </button>
        ))}
      </div>
    );
  };

  // System message
  if (isSystem) {
    const renderClickableName = (user, name) => {
      if (user?.handle) {
        return (
          <button
            onClick={() => router.push(`/profile/${user.handle}`)}
            className="font-semibold text-gray-800 hover:text-blue-600 hover:underline transition-colors"
          >
            {name || user.name || "Someone"}
          </button>
        );
      }
      return <span className="font-semibold text-gray-800">{name || "Someone"}</span>;
    };

    const renderSystemMessage = () => {
      if (!message.system) return message.text || "System message";

      const { event, targets, previous, next } = message.system;
      const sender = message.sender;
      const senderName = sender?.name || "Someone";

      switch (event) {
        case "member_added":
          if (targets && targets.length > 0) {
            return (
              <>
                {renderClickableName(sender, senderName)} added{" "}
                {targets.map((target, index) => (
                  <span key={target._id || index}>
                    {index > 0 && ", "}
                    {renderClickableName(target, target.name)}
                  </span>
                ))}
              </>
            );
          }
          return <>{renderClickableName(sender, senderName)} added a member</>;

        case "member_removed":
          if (targets && targets.length > 0) {
            return (
              <>
                {renderClickableName(sender, senderName)} removed{" "}
                {targets.map((target, index) => (
                  <span key={target._id || index}>
                    {index > 0 && ", "}
                    {renderClickableName(target, target.name)}
                  </span>
                ))}
              </>
            );
          }
          return <>{renderClickableName(sender, senderName)} removed a member</>;

        case "name_changed":
          return (
            <>
              {renderClickableName(sender, senderName)} changed the group name
              {previous && ` from "${previous}"`}
              {next && ` to "${next}"`}
            </>
          );

        case "image_changed":
          return <>{renderClickableName(sender, senderName)} changed the group icon</>;

        case "admin_promoted":
          if (targets && targets.length > 0) {
            return (
              <>
                {renderClickableName(sender, senderName)} promoted{" "}
                {targets.map((target, index) => (
                  <span key={target._id || index}>
                    {index > 0 && ", "}
                    {renderClickableName(target, target.name)}
                  </span>
                ))}{" "}
                to admin
              </>
            );
          }
          return <>{renderClickableName(sender, senderName)} promoted a member to admin</>;

        case "admin_demoted":
          if (targets && targets.length > 0) {
            return (
              <>
                {renderClickableName(sender, senderName)} demoted{" "}
                {targets.map((target, index) => (
                  <span key={target._id || index}>
                    {index > 0 && ", "}
                    {renderClickableName(target, target.name)}
                  </span>
                ))}{" "}
                from admin
              </>
            );
          }
          return <>{renderClickableName(sender, senderName)} demoted an admin</>;

        default:
          return message.text || "System message";
      }
    };

    return (
      <div className="flex justify-center my-2 sm:my-3 px-2">
        <div className="px-2 min-[400px]:px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-full shadow-sm max-w-[90%] min-[400px]:max-w-[85%]">
          <p className="text-[9px] min-[400px]:text-[10px] leading-tight text-gray-600 text-center font-medium break-words">
            {renderSystemMessage()}
          </p>
        </div>
      </div>
    );
  }

  // Deleted message
  if (isDeleted) {
    return (
      <div
        ref={messageRef}
        className={`flex gap-1 min-[400px]:gap-1.5 sm:gap-2 mb-2 sm:mb-3 ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="flex-shrink-0 mt-1">
            <UserAvatar
              user={message.sender}
              size="sm"
              showStatus={false}
              showName={false}
              onlineUsers={onlineUsers}
            />
          </div>
        )}

        {/* Deleted Message Content */}
        <div
          className={`flex flex-col ${
            isOwn ? "items-end" : "items-start"
          } max-w-[90%] min-[400px]:max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] min-w-0`}
        >
          {/* Sender Name - Clickable */}
          {!isOwn && (
            <button
              onClick={() => {
                if (message.sender?.handle) {
                  router.push(`/profile/${message.sender.handle}`);
                }
              }}
              className="text-[9px] min-[400px]:text-[10px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline mb-0.5 sm:mb-1 px-0.5 sm:px-1 truncate max-w-full text-left"
            >
              {message.sender?.name || "Unknown"}
            </button>
          )}

          {/* Deleted Message Bubble */}
          <div className="flex flex-row items-end w-full max-w-full">
            <div
              className={`relative rounded-xl sm:rounded-2xl px-2 min-[400px]:px-2.5 sm:px-3 py-1.5 sm:py-2 w-full ${
                isOwn
                  ? "bg-gray-200 text-gray-600"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              } shadow-sm`}
            >
              {/* Deleted Icon and Text */}
              <div className="flex items-center gap-1 min-[400px]:gap-1.5 sm:gap-2">
                <svg
                  className="w-2.5 h-2.5 min-[400px]:w-3 min-[400px]:h-3 text-gray-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <p className="text-[9px] min-[400px]:text-[10px] sm:text-xs italic">
                  This message was deleted
                </p>
              </div>

              {/* Timestamp with read status and edited indicator */}
              <div className="flex items-center gap-1 text-[8px] min-[400px]:text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 text-gray-500">
                <span>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {message.editedAt && (
                  <span className="italic">(edited)</span>
                )}
                {isOwn && (
                  <div className="flex items-center ml-1">
                    {readBy && readBy.length > 0 ? (
                      <CheckCircleIcon className="w-2.5 h-2.5 text-blue-500" title={`Read by ${readBy.length} user(s)`} />
                    ) : (
                      <CheckIcon className="w-2.5 h-2.5 text-gray-400" title="Sent" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular message
  return (
    <div
      ref={messageRef}
      className={`flex gap-1 min-[400px]:gap-1.5 sm:gap-2 mb-2 sm:mb-3 ${
        isOwn ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0 mt-1">
          <UserAvatar
            user={message.sender}
            size="sm"
            showStatus={false}
            showName={false}
            onlineUsers={onlineUsers}
          />
        </div>
      )}

      {/* Message Content */}
      <div
        className={`flex flex-col ${
          isOwn ? "items-end" : "items-start"
        } max-w-[90%] min-[400px]:max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] min-w-0`}
        onContextMenu={handleContextMenu}
      >
        {/* Sender Name - Clickable */}
        {!isOwn && (
          <button
            onClick={() => {
              if (message.sender?.handle) {
                router.push(`/profile/${message.sender.handle}`);
              }
            }}
            className="text-[9px] min-[400px]:text-[10px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline mb-0.5 sm:mb-1 px-0.5 sm:px-1 truncate max-w-full text-left"
          >
            {message.sender?.name || "Unknown"}
          </button>
        )}

        {/* Message Bubble */}
        <div className="flex flex-row items-end w-full max-w-full">
          <div
            className={`relative group rounded-xl sm:rounded-2xl px-2 min-[400px]:px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 w-full break-words ${
              isOwn
                ? "bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white"
                : "bg-gradient-to-br from-white to-gray-50 text-gray-900 border border-gray-200"
            } shadow-sm`}
          >
            {/* Reply Preview */}
            {renderReplyPreview()}

            {/* Media */}
            {hasMedia && <div className="mb-2">{renderMediaGrid()}</div>}

            {/* Text */}
            {hasText && (
              <p className="text-[10px] min-[400px]:text-[11px] sm:text-xs md:text-sm whitespace-pre-wrap message-text leading-snug w-full break-words overflow-wrap-anywhere">
                {message.text}
              </p>
            )}

            {/* Timestamp with read status and edited indicator */}
            <div
              className={`flex items-center gap-1 text-[8px] min-[400px]:text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 ${
                isOwn ? "text-white/70" : "text-gray-500"
              }`}
            >
              <span>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {message.editedAt && (
                <span className="italic">(edited)</span>
              )}
              {isOwn && (
                <div className="flex items-center ml-1">
                  {readBy && readBy.length > 0 ? (
                    <CheckCircleIcon className={`w-2.5 h-2.5 ${isOwn ? "text-white/80" : "text-blue-500"}`} title={`Read by ${readBy.length} user(s)`} />
                  ) : (
                    <CheckIcon className={`w-2.5 h-2.5 ${isOwn ? "text-white/60" : "text-gray-400"}`} title="Sent" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Reactions */}
        {renderReactions()}
      </div>

      {/* Context Menu */}
      <MessageContextMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        position={menuPosition}
        message={message}
        isOwn={isOwn}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onReact={onReact}
      />
    </div>
  );
}
