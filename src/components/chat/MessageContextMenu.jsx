'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ClipboardDocumentIcon,
  FaceSmileIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useSocketEmitter } from "@/lib/socket";
import EmojiPicker from "../common/EmojiPicker";
import { useToast } from "@/components/layout/ToastContext";
import { ContextPortal } from "@/components/ui";

/**
 * Enhanced Context Menu for Message Actions
 * Uses smart ContextPortal for automatic positioning
 */
export default function MessageContextMenu({
  isOpen,
  position,
  onClose,
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete,
  onReact,
}) {
  const { emit } = useSocketEmitter();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const showToast = useToast();

  const quickReactions = [ "❤️", "😂", "😮", "😢", "🎉", "🔥"];

  // Check if message is still within allowed time for edit/delete (e.g., 15 minutes)
  const isWithinTimeLimit = () => {
    if (!message?.createdAt) return false;
    const messageTime = new Date(message.createdAt);
    const now = new Date();
    const timeDiff = now - messageTime;
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
    return timeDiff <= fifteenMinutes;
  };

  const canEdit = isOwn && !message.isDeleted && isWithinTimeLimit();
  const canDeleteForEveryone = isOwn && !message.isDeleted && isWithinTimeLimit();

  const handleReact = async (emoji) => {
    try {
      emit("reaction:add", { messageId: message._id, emoji });
      onReact?.(emoji);
      showToast({ text: "Reaction added!" });
      onClose();
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleEmojiSelect = (emoji) => {
    // Handle both string and object formats
    let emojiValue;
    if (typeof emoji === 'string') {
      emojiValue = emoji;
    } else if (emoji && typeof emoji === 'object') {
      emojiValue = emoji.emoji || emoji.native || emoji.colons || String(emoji);
    } else {
      emojiValue = String(emoji);
    }
    
    if (!emojiValue || emojiValue === '[object Object]') return;
    handleReact(emojiValue);
    setShowEmojiPicker(false);
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      showToast({ text: "Message copied to clipboard!" });
      onClose();
    }
  };

  const handleDownloadMedia = async () => {
    if (!message.media || message.media.length === 0) return;

    for (const media of message.media) {
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
    }
    showToast({ text: "Download started!" });
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share && message.text) {
      try {
        await navigator.share({
          text: message.text,
        });
        onClose();
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      handleCopy();
    }
  };

  const handleMessageInfo = () => {
    const info = `
Message ID: ${message._id}
Sender: ${message.sender?.name || "Unknown"}
Time: ${new Date(message.createdAt).toLocaleString()}
${message.edited ? "Edited: Yes" : ""}
${message.reactions?.length ? `Reactions: ${message.reactions.length}` : ""}
    `.trim();

    alert(info);
    onClose();
  };

  if (!message) return null;

  return (
    <>
      <ContextPortal
        isOpen={isOpen}
        onClose={onClose}
        position={position}
        className="bg-white border border-gray-200 min-w-[240px] max-w-full md:max-w-[280px]"
      >
        {/* Quick Reactions */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">
              Quick Reactions
            </span>
            <button
              onClick={() => {setShowEmojiPicker(true); onClose()}}
              className="text-xs text-blue-600 font-medium flex items-center gap-1"
            >
              <FaceSmileIcon className="h-4 w-4" />
              More
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {quickReactions.map((emoji) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReact(emoji)}
                className="text-lg rounded-lg "
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="py-2 pb-safe">
          {/* Copy Text */}
          {message.text && (
            <MenuItem
              icon={<ClipboardDocumentIcon className="h-5 w-5" />}
              label="Copy Text"
              onClick={handleCopy}
            />
          )}

          {/* Reply */}
          <MenuItem
            icon={<ArrowUturnLeftIcon className="h-5 w-5" />}
            label="Reply"
            onClick={() => {
              onReply?.(message);
              onClose();
            }}
          />

          {/* Edit - only for own messages within time limit */}
          {canEdit && (
            <MenuItem
              icon={<PencilIcon className="h-5 w-5" />}
              label="Edit Message"
              onClick={() => {
                onEdit?.(message);
                onClose();
              }}
            />
          )}

          {/* Download Media */}
          {/* {message.media && message.media.length > 0 && (
            <MenuItem
              icon={<ArrowDownTrayIcon className="h-5 w-5" />}
              label={`Download ${message.media.length > 1 ? "All" : "Media"}`}
              onClick={handleDownloadMedia}
            />
          )} */}

          {/* Share */}
          {message.text && (
            <MenuItem
              icon={<ShareIcon className="h-5 w-5" />}
              label="Share"
            />
          )}

          {/* Message Info */}
          {/* <MenuItem
            icon={<InformationCircleIcon className="h-5 w-5" />}
            label="Message Info"
            onClick={handleMessageInfo}
          /> */}

          {/* Divider */}
          <div className="my-1 border-t border-gray-200" />

          {/* Delete for Me */}
          <MenuItem
            icon={<TrashIcon className="h-5 w-5" />}
            label="Delete for Me"
            onClick={() => {
              onDelete?.(message, false);
              onClose();
            }}
            danger
          />

          {/* Delete for Everyone - only for own messages within time limit */}
          {canDeleteForEveryone && (
            <MenuItem
              icon={<TrashIcon className="h-5 w-5" />}
              label="Delete for Everyone"
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to delete this message for everyone?"
                  )
                ) {
                  onDelete?.(message, true);
                  onClose();
                }
              }}
              danger
            />
          )}
      {/* Emoji Picker */}
        </div>

      </ContextPortal>

      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
      />

    </>
  );
}

/**
 * Menu Item Component
 */
function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm md:py-2.5 active:bg-gray-50 ${
        danger ? "text-red-600" : "text-gray-700"
      }`}
    >
      <span className={danger ? "text-red-500" : "text-gray-500"}>{icon}</span>
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}
