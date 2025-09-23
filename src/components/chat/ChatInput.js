"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PaperClipIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSocketEmitter } from "../../lib/socket";
import { Picker } from "emoji-mart";
// import 'emoji-mart/dist/basic.css';

/**
 * Chat input component with emoji picker and file upload
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
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Focus input when edit mode changes
  useEffect(() => {
    if (editMessage && textareaRef.current) {
      textareaRef.current.focus();
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
  }, [emit, chatId]);

  // Cleanup typing timeout and send typing:stop on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []); // Only run on mount/unmount

  // Stop typing when chatId changes or component unmounts
  // useEffect(() => {
  //   return () => {
  //     // Send typing:stop when chatId changes or component unmounts
  //     if (typing && chatId) {
  //       emit("typing:stop", { chatId });
  //     }
  //   };
  // }, [chatId, emit]);

  // Edit mode
  useEffect(() => {
    if (editMessage) {
      setMessage(editMessage.text || "");
      // Convert media objects to File-like objects for editing
      if (editMessage.media && editMessage.media.length > 0) {
        const mediaFiles = editMessage.media.map((media) => ({
          ...media,
          name: media.filename || media.publicId,
          type: media.mime,
          size: media.size,
          // Add a flag to identify this as an existing media item
          isExistingMedia: true,
          originalMedia: media,
        }));
        setSelectedFiles(mediaFiles);
      } else {
        setSelectedFiles([]);
      }
    }
  }, [editMessage]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Typing indicator logic - only change state when necessary
    const shouldBeTyping = value.length > 0;

    if (shouldBeTyping && !typing) {
      // Start typing - only set once when user starts typing
      setTyping(true);
    } else if (!shouldBeTyping && typing) {
      // Stop typing immediately when input is empty
      setTyping(false);
    }

    // Manage timeout for auto-stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (shouldBeTyping) {
      // Set timeout to stop typing after user stops typing for 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (
      !message.trim() &&
      (!Array.isArray(selectedFiles) || selectedFiles.length === 0)
    )
      return;
    if (disabled || uploading) return;

    try {
      setUploading(true);

      // Upload files first
      let uploadedMedia = [];
      if (Array.isArray(selectedFiles) && selectedFiles.length > 0) {
        uploadedMedia = await uploadFiles(selectedFiles);
      }

      // Send message
      await onSendMessage(message, uploadedMedia, replyToMessage?._id || null);

      // Reset state
      setMessage("");
      setSelectedFiles([]);

      // Clear typing timeout and stop typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTyping(false);

      onCancelReply?.();
      onCancelEdit?.();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/mov",
        "video/avi",
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/webm",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      return file.size <= maxSize && allowedTypes.includes(file.type);
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files) => {
    if (!Array.isArray(files)) return [];
    const uploadedMedia = [];

    for (const file of files) {
      try {
        // If this is existing media from edit mode, use it directly
        if (file && file.isExistingMedia && file.originalMedia) {
          uploadedMedia.push(file.originalMedia);
          continue;
        }

        // Determine file type for API
        let type = "image";
        if (file.type.startsWith("image/")) {
          type = "image";
        } else if (file.type.startsWith("video/")) {
          type = "video";
        } else if (file.type.startsWith("audio/")) {
          type = "audio";
        } else if (
          file.type === "application/pdf" ||
          file.type === "text/plain" ||
          file.type === "application/msword" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          type = "document";
        }

        // Prepare form data for /api/upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        // Upload to /api/upload endpoint
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResponse.ok && uploadResult.url) {
          uploadedMedia.push({
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            mime: file.type,
            size: uploadResult.size || file.size,
            filename: file.name,
            // width/height may not be present for all types
            width: uploadResult.width,
            height: uploadResult.height,
            type: uploadResult.type || type,
          });
        } else {
          throw new Error(uploadResult.error || "Failed to upload file");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    return uploadedMedia;
  };

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-3 flex flex-col relative">
      {replyToMessage && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-l-4 border-blue-500 rounded-md">
          <div className="text-sm text-gray-700 truncate">
            Replying to {replyToMessage.sender?.name || "User"}:{" "}
            {replyToMessage.text ||
              (replyToMessage.media?.length ? "Media" : "")}
          </div>
          <button
            onClick={onCancelReply}
            disabled={disabled || uploading}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {editMessage && (
        <div className="flex items-center justify-between px-3 py-2 bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
          <div className="text-sm text-gray-700 truncate">
            Editing:{" "}
            {editMessage.text || (editMessage.media?.length ? "Media" : "")}
          </div>
          <button
            onClick={onCancelEdit}
            disabled={disabled || uploading}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Selected Files Preview */}
      {/* {selectedFiles.length > 0 && (

      )} */}
      {selectedFiles.length > 0 && (
        <div className="w-full flex-col ">
                    <div className="ml-auto bg-gray-300 h-fit w-fit m-1  rounded-full self-end">
            <button
              onClick={() => setSelectedFiles([])}
              className="  px-2.5 py-0.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors "
              disabled={disabled || uploading}
            >
              {/* <XMarkIcon className="h-5 w-5 text-white" /> */}
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[200px]">
            {selectedFiles.map((file, index) => {
              // Support both File objects and media objects from Message model
              // File object: has .type, .name, .size, etc.
              // Media object: has .url, .mime, .filename, .publicId, etc.
              const isFileObject =
                file instanceof File ||
                (typeof File !== "undefined" && file instanceof File);
              const fileType = isFileObject ? file.type || "" : file.mime || "";
              const isImage = fileType.startsWith("image/");
              const isVideo = fileType.startsWith("video/");
              const isAudio = fileType.startsWith("audio/");
              let previewUrl = "";

              if (typeof window !== "undefined") {
                if (isFileObject && isImage) {
                  previewUrl = URL.createObjectURL(file);
                } else if (!isFileObject && isImage && file.url) {
                  previewUrl = file.url;
                }
              }

              // For name, prefer .name (File), fallback to .filename (media object), fallback to .publicId
              const displayName = isFileObject
                ? file.name
                : file.filename || file.publicId || "Media";

              return (
                <div
                  key={index}
                  className="relative bg-gray-100 rounded-lg p-2 flex flex-col items-center space-y-1 bg-gradient-to-br from-gray-200 to-zinc-300 text-gray-900 min-w-[100px] max-w-[140px]"
                >
                  <div className="w-full flex justify-end">
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center w-full">
                    {isImage && previewUrl && (
                      <img
                        src={previewUrl}
                        alt={displayName}
                        className="w-20 h-20 object-cover rounded mb-1 border"
                      />
                    )}
                    {isVideo && (
                      <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded mb-1 border">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 17.5v-11z"
                          />
                        </svg>
                      </div>
                    )}
                    {isAudio && (
                      <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded mb-1 border">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19V6l-2 2m0 0l-2-2m2 2v11m6-11v11m4-11v11"
                          />
                        </svg>
                      </div>
                    )}
                    {!isImage && !isVideo && !isAudio && (
                      <div className="flex items-center justify-center w-20 h-20 bg-gray-200 rounded mb-1 border">
                        <span className="text-xs text-gray-500">File</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600 truncate max-w-[120px] text-center">
                      {displayName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center justify-between px-2 py-2 gap-2">
        {/* File Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || uploading}
            className="w-full h-10 text-black border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed  "
            maxLength={2000}
          />

          {/* Character Count */}
          {message.length > 1800 && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {message.length}/2000
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={
            disabled ||
            uploading ||
            (!message.trim() && selectedFiles.length === 0)
          }
          className="p-2 bg-blue-500 self-text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <PaperAirplaneIcon className="h-5 w-5 transform -rotate-45" />
          )}
        </button>
      </div>
    </div>
  );
}
