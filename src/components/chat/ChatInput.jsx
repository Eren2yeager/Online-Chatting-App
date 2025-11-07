"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpIcon,
  PaperClipIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import { useSocketEmitter } from "@/lib/socket";
import EmojiPicker from "../common/EmojiPicker";
import { useToast } from "@/components/layout/ToastContext";
import FileSettings from "@/lib/client/fileSettings";
/**
 * Modern Chat Input Component
 * Supports all Cloudinary file types with professional UI
 */
export default function ChatInput({
  onSendMessage,
  disabled = false,
  chatId,
  replyToMessage,
  onCancelReply,
  editMessage,
  onCancelEdit,
}) {
  const { emit } = useSocketEmitter();
  const showToast = useToast();

  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [typing, setTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { SUPPORTED_TYPES, MAX_FILE_SIZE, MAX_FILES } = FileSettings;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Edit mode
  useEffect(() => {
    if (editMessage) {
      setMessage(editMessage.text || "");
      if (editMessage.media && editMessage.media.length > 0) {
        const mediaFiles = editMessage.media.map((media) => ({
          ...media,
          name: media.filename || media.publicId,
          type: media.mime,
          size: media.size,
          isExistingMedia: true,
          originalMedia: media,
          preview: media.url,
        }));
        setSelectedFiles(mediaFiles);
      }
      textareaRef.current?.focus();
    }
  }, [editMessage]);

  // Typing indicators
  useEffect(() => {
    if (!chatId) return;
    if (typing) {
      emit("typing:start", { chatId });
    } else {
      emit("typing:stop", { chatId });
    }
  }, [typing, emit, chatId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Cleanup file previews when files change
  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        if (file.preview && file.preview.startsWith("blob:")) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    const shouldBeTyping = value.length > 0;
    if (shouldBeTyping && !typing) {
      setTyping(true);
    } else if (!shouldBeTyping && typing) {
      setTyping(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (shouldBeTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    }
  };

  const getFileType = (mimeType) => {
    // Check each category
    if (SUPPORTED_TYPES.images && SUPPORTED_TYPES.images.includes(mimeType)) {
      return "image";
    }
    if (SUPPORTED_TYPES.videos && SUPPORTED_TYPES.videos.includes(mimeType)) {
      return "video";
    }
    if (SUPPORTED_TYPES.audio && SUPPORTED_TYPES.audio.includes(mimeType)) {
      return "audio";
    }
    if (
      SUPPORTED_TYPES.documents &&
      SUPPORTED_TYPES.documents.includes(mimeType)
    ) {
      return "document";
    }
    if (
      SUPPORTED_TYPES.archives &&
      SUPPORTED_TYPES.archives.includes(mimeType)
    ) {
      return "archive";
    }

    // Fallback: check by MIME type prefix
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";

    return "document";
  };

  const isFileSupported = (file) => {
    const allTypes = Object.values(SUPPORTED_TYPES).flat();
    return allTypes.includes(file.type);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    if (selectedFiles.length + files.length > MAX_FILES) {
      showToast({ text: `Maximum ${MAX_FILES} files allowed` });
      return;
    }

    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      // Check if it's a valid File object
      if (!(file instanceof File)) {
        errors.push(`Invalid file object`);
        return;
      }

      if (!isFileSupported(file)) {
        errors.push(`${file.name}: Unsupported file type`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 100MB)`);
        return;
      }
      if (file.size === 0) {
        errors.push(`${file.name}: File is empty`);
        return;
      }

      // Create file object with preview
      const fileWithPreview = Object.assign(file, {
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });

      validFiles.push(fileWithPreview);
    });

    if (errors.length > 0) {
      showToast({ text: errors[0] });
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  // Drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeFile = (index) => {
    const file = selectedFiles[index];
    if (file.preview && file.preview.startsWith("blob:")) {
      URL.revokeObjectURL(file.preview);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files) => {
    const uploadedMedia = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // If existing media, use it directly
        if (file.isExistingMedia && file.originalMedia) {
          uploadedMedia.push(file.originalMedia);
          continue;
        }

        const type = getFileType(file.type);

        // Debug logging
        console.log("Uploading file:", {
          name: file.name,
          mimeType: file.type,
          detectedType: type,
          size: file.size,
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        setUploadProgress((prev) => ({ ...prev, [file.id]: 0 }));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success && result.url) {
          uploadedMedia.push({
            url: result.url,
            publicId: result.publicId,
            mime: file.type,
            size: result.size || file.size,
            filename: file.name,
            width: result.width,
            height: result.height,
            type: result.type || type,
          });
          setUploadProgress((prev) => ({ ...prev, [file.id]: 100 }));
        } else {
          console.error("Upload failed:", result);
          throw new Error(result.message || result.error || "Upload failed");
        }
      } catch (error) {
        console.error("Upload error:", error);
        showToast({ text: `Failed to upload ${file.name}` });
        // Remove failed file from selection
        setSelectedFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
    }

    return uploadedMedia;
  };

  const handleSend = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    if (disabled || uploading) return;

    try {
      setUploading(true);

      let uploadedMedia = [];
      if (selectedFiles.length > 0) {
        uploadedMedia = await uploadFiles(selectedFiles);
      }

      await onSendMessage(message, uploadedMedia, replyToMessage?._id || null);

      // Reset
      setMessage("");
      setSelectedFiles([]);
      setUploadProgress({});

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTyping(false);

      onCancelReply?.();
      onCancelEdit?.();
    } catch (error) {
      console.error("Send error:", error);
      showToast({ text: "Failed to send message" });
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Handle files from clipboard
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault(); // Prevent default paste behavior for files
      processFiles(files);
    }
    // If no files, let default paste behavior handle text
  };

  const addEmoji = (emoji) => {
    // Handle both string and object formats
    let emojiValue;
    if (typeof emoji === "string") {
      emojiValue = emoji;
    } else if (emoji && typeof emoji === "object") {
      emojiValue = emoji.emoji || emoji.native || emoji.colons || String(emoji);
    } else {
      emojiValue = String(emoji);
    }

    setMessage((prev) => prev + emojiValue);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const getFileIcon = (file) => {
    const type = file.type || file.mime || "";
    if (type.startsWith("image/")) return <PhotoIcon className="h-6 w-6" />;
    if (type.startsWith("video/"))
      return <VideoCameraIcon className="h-6 w-6" />;
    if (type.startsWith("audio/"))
      return <MusicalNoteIcon className="h-6 w-6" />;
    return <DocumentIcon className="h-6 w-6" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-2 relative">
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-2xl flex items-center justify-center z-10"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <PhotoIcon className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-600 font-semibold">Drop files here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyToMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-1 h-10 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-blue-600">
                  Replying to {replyToMessage.sender?.name}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {replyToMessage.text || "Media"}
                </div>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Preview */}
      <AnimatePresence>
        {editMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-1 h-10 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-orange-600">
                  Editing message
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {editMessage.text || "Media"}
                </div>
              </div>
            </div>
            <button
              onClick={onCancelEdit}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Previews */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <PaperClipIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {selectedFiles.length} file
                  {selectedFiles.length > 1 ? "s" : ""} attached
                </span>
              </div>
              <button
                onClick={() => {
                  selectedFiles.forEach((file) => {
                    if (file.preview && file.preview.startsWith("blob:")) {
                      URL.revokeObjectURL(file.preview);
                    }
                  });
                  setSelectedFiles([]);
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[250px] overflow-y-auto pr-1">
              {selectedFiles.map((file, index) => {
                const fileType = file.type || file.mime || "";
                const isImage = fileType.startsWith("image/");
                const isVideo = fileType.startsWith("video/");
                const isAudio = fileType.startsWith("audio/");
                const progress = uploadProgress[file.id] || 0;

                return (
                  <motion.div
                    key={file.id || index}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative group"
                  >
                    {/* Card */}
                    <div className="bg-white   rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-lg font-bold z-10 opacity-100 md:opacity-0  group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      >
                        ×
                      </button>

                      {/* Preview */}
                      <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200">
                        {isImage && file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}

                        {/* Fallback icon */}
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center text-gray-400"
                          style={{
                            display: isImage && file.preview ? "none" : "flex",
                          }}
                        >
                          {isImage ? (
                            <PhotoIcon className="h-10 w-10 mb-1" />
                          ) : isVideo ? (
                            <VideoCameraIcon className="h-10 w-10 mb-1" />
                          ) : isAudio ? (
                            <MusicalNoteIcon className="h-10 w-10 mb-1" />
                          ) : (
                            <DocumentIcon className="h-10 w-10 mb-1" />
                          )}
                          <span className="text-xs font-medium">
                            {fileType.split("/")[1]?.toUpperCase() || "FILE"}
                          </span>
                        </div>

                        {/* Upload progress overlay */}
                        {uploading && progress < 100 && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white animate-spin mb-2" />
                            <div className="text-white text-sm font-semibold">
                              {progress}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File info */}
                      <div className="p-2 bg-white">
                        <div
                          className="text-xs font-medium text-gray-900 truncate"
                          title={file.name}
                        >
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div
        className="flex items-end gap-2 p-3 bg-white rounded-2xl border border-gray-200 shadow-sm"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Attach files"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message..."
            disabled={disabled || uploading}
            className="w-full resize-none border-0 outline-none bg-transparent text-gray-900 placeholder-gray-500 text-sm leading-5 max-h-[120px] py-2"
            rows={1}
            maxLength={2000}
          />
          {message.length > 1800 && (
            <div className="absolute bottom-1 right-1 text-xs text-gray-400 bg-white px-1 rounded">
              {message.length}/2000
            </div>
          )}
        </div>

        {/* Emoji Button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled || uploading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Add emoji"
          >
            <FaceSmileIcon className="h-5 w-5" />
          </button>

          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={addEmoji}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={
            disabled ||
            uploading ||
            (!message.trim() && selectedFiles.length === 0)
          }
          className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Send message"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <ArrowUpIcon className="h-5 font-extrabold w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
