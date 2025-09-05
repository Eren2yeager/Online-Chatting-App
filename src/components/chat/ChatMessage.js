"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  HeartIcon,
  TrashIcon,
  PencilIcon,
  ReplyIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import dateFormatter from "@/functions/dateFormattor";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMediaFullView } from "../layout/mediaFullViewContext";

export default function ChatMessage({ message, isOwn, onContextMenu }) {
  const { data: session } = useSession();
  const [showReactions, setShowReactions] = useState(false);
  const { mediaToView, setMediaToView } = useMediaFullView();
  const router = useRouter();
  const handleContextMenu = (e) => {
    e.preventDefault();
    onContextMenu(e, message);
  };

  const handleReaction = (emoji) => {
    // Emit reaction via socket
    // This would be handled by the parent component
  };

  // WhatsApp-style system message in the middle with name
  const WhatsAppSystemMiddle = ({ children, name }) => (
    <div className="flex w-full justify-center my-2 select-none">
      <div className="relative flex items-center px-4 py-1 bg-white border border-gray-300 rounded-full shadow text-xs text-gray-700 font-medium">
        {name && (
          <span className="font-semibold text-green-700 mr-2">{name}</span>
        )}
        <span>{children}</span>
      </div>
    </div>
  );

  const getMessageContent = () => {
    // System messages: WhatsApp style in the middle with name
    if (message.type === "system") {
      let description = message.text;
      let name = "";
      if (!description && message.system) {
        const evt = message.system.event;
        const targets = message.system.targets || [];
        name = targets.length > 0
          ? (targets[0].name || targets[0].handle || "User")
          : "";
        const names = targets
          .map((t) => t.name || t.handle || "User")
          .join(", ");
        if (evt === "member_added") description = `added`;
        if (evt === "member_removed") description = `left`;
        if (evt === "name_changed")
          description = `changed group name to "${
            message.system.next?.name || ""
          }"`;
        if (evt === "image_changed") description = `updated group image`;
        if (evt === "admin_promoted") description = `is now an admin`;
        if (evt === "admin_demoted") description = `is no longer an admin`;
        // For multiple targets, show all names
        if (
          ["admin_promoted", "admin_demoted", "member_added", "member_removed"].includes(
            evt
          ) &&
          targets.length > 1
        ) {
          name = names;
        }
      }
      return (
        <WhatsAppSystemMiddle name={name}>
          {description || "Update"}
        </WhatsAppSystemMiddle>
      );
    }
    if (message.isDeleted) {
      return (
        <div className="text-gray-400 italic">🚫 This message was deleted</div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Reply to message */}
        {message.replyTo && (
          <div className="bg-gray-100 rounded-lg text-sm text-gray-600 border-l-4 p-2 border-green-500">
            <div className=" text-xs text-green-500 font-bold">
              <div className="flex items-center gap-2">
                <span>
                  Replying to{" "}
                  {message.sender?._id === message.replyTo.sender?._id ? (
                    "Self"
                  ) : message.replyTo.sender?._id === session?.user?.id ? (
                    "You"
                  ) : (
                    <>
                      {message.replyTo.sender?.image && (
                        <img
                          src={message.replyTo.sender.image}
                          alt={message.replyTo.sender.name || "User"}
                          className="w-6 h-6 rounded-full object-cover inline-block mr-1"
                        />
                      )}
                      <span className="text-purple-600 font-bold">
                        {message.replyTo.sender?.name || "User"}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Show reply media using the full viewer if more than one, or correct type */}
            {message.replyTo.media && message.replyTo.media.length > 0 && (
              <div className="flex gap-2 mt-2">
                {message.replyTo.media.slice(0, 3).map((media, idx) => {
                  // Helper for click: open full viewer at correct index
                  const handleReplyMediaClick = (e) => {
                    e.stopPropagation();
                    setMediaToView({
                      media: message.replyTo.media,
                      initialIndex: idx,
                    });
                  };

                  // Guess type
                  const mime = media.mime || media.type || "";
                  if (mime.startsWith("image/")) {
                    return (
                      <div key={idx} className="max-w-[80px] max-h-[80px]">
                        <img
                          src={media.url}
                          alt={media.filename || "Image"}
                          className="rounded-md shadow w-full h-full object-cover cursor-pointer"
                          onClick={handleReplyMediaClick}
                        />
                      </div>
                    );
                  }
                  if (mime.startsWith("video/")) {
                    return (
                      <div key={idx} className="max-w-[80px] max-h-[80px] relative cursor-pointer">
                        <video
                          src={media.url}
                          className="rounded-md shadow w-full h-full object-cover bg-black"
                          preload="metadata"
                          controls={false}
                          onClick={handleReplyMediaClick}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Video</span>
                        </div>
                      </div>
                    );
                  }
                  if (mime.startsWith("audio/")) {
                    return (
                      <div key={idx} className="max-w-[80px] max-h-[80px] flex items-center">
                        <div
                          className="w-full cursor-pointer"
                          onClick={handleReplyMediaClick}
                          title="Play audio"
                        >
                          <audio
                            src={media.url}
                            controls
                            className="w-full"
                            preload="metadata"
                            style={{ maxWidth: 70 }}
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    );
                  }
                  // Document/other
                  return (
                    <div key={idx} className="max-w-[80px] max-h-[80px] flex items-center">
                      <a
                        href={media.url}
                        download={media.filename}
                        className="flex items-center gap-1 text-blue-500 hover:underline truncate max-w-[70px]"
                        title="Download file"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="truncate max-w-[60px]">
                          {media.filename || media.url?.split("/").pop() || "File"}
                        </span>
                      </a>
                    </div>
                  );
                })}
                {message.replyTo.media.length > 3 && (
                  <div className="flex items-center justify-center w-[80px] h-[80px] bg-gray-200 rounded-md shadow text-gray-500 font-bold text-lg cursor-pointer"
                    onClick={e => {
                      e.stopPropagation();
                      setMediaToView({
                        media: message.replyTo.media,
                        initialIndex: 3,
                      });
                    }}
                  >
                    +{message.replyTo.media.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className="truncate">
              {message.replyTo.isDeleted
                ? "🚫 This message was deleted"
                : message.replyTo.text}
            </div>
          </div>
        )}

        {/* Media content */}
        {message.media && message.media.length > 0 && (
          <div className={
            message.media.length > 1
              ? "grid grid-cols-2 gap-2 max-w-xs mx-auto"
              : "space-y-3"
          }>
            {message.media.slice(0, 4).map((media, index) => {
              // For >4 media, only show first 4, last one with overlay
              const isLast = index === 3 && message.media.length > 4;
              const showOverlay = isLast;
              const overlayCount = message.media.length - 4;

              // Helper for click: open full viewer at correct index

              const handleMediaClick = (e) => {
                e.stopPropagation();
                setMediaToView({
                  media: message.media,
                  initialIndex: index,
                });
              };

              // Image
              if (media.mime.startsWith("image/")) {
                return (
                  <div
                    key={index}
                    className="relative group aspect-square overflow-hidden rounded-xl shadow-md cursor-pointer"
                    onClick={handleMediaClick}
                  >
                    <img
                      src={media.url}
                      alt={media.filename || "Image"}
                      className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                    />
                    {showOverlay && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          +{overlayCount}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              // Video
              if (media.mime.startsWith("video/")) {
                return (
                  <div
                    key={index}
                    className="relative group aspect-square overflow-hidden rounded-xl shadow-md bg-black cursor-pointer"
                    onClick={handleMediaClick}
                  >
                    <video
                      src={media.url}
                      className="object-cover w-full h-full"
                      preload="metadata"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-10 h-10 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <polygon points="9,7 9,17 16,12" fill="currentColor" />
                      </svg>
                    </div>
                    {showOverlay && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          +{overlayCount}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              // Audio
              if (media.mime.startsWith("audio/")) {
                return (
                  <div
                    key={index}
                    className="relative group aspect-square flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-md cursor-pointer"
                    onClick={handleMediaClick}
                  >
                    <span className="text-blue-500 text-3xl mb-2">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13" />
                        <circle cx="6" cy="18" r="3" fill="currentColor" />
                      </svg>
                    </span>
                    <div className="text-xs text-gray-900 font-semibold truncate px-2 w-full text-center">
                      {media.filename}
                    </div>
                    {showOverlay && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          +{overlayCount}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              // Document/Other
              return (
                <div
                  key={index}
                  className="relative group aspect-square flex flex-col items-center justify-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-md cursor-pointer"
                  onClick={handleMediaClick}
                >
                  <span className="text-blue-500 text-3xl mb-2">
                    <DocumentIcon className="w-8 h-8 text-black" />
                  </span>
                  <div className="text-xs text-gray-900 font-semibold truncate px-2 w-full text-center">
                    {media.filename}
                  </div>
                  {showOverlay && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        +{overlayCount}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {/* If only one media, show in old style (full width) */}
            {/* {message.media.length === 1 && (() => {
              const media = message.media[0];
              if (media.mime.startsWith("audio/")) {
                return (
                  <div className="flex max-w-[300px] items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-md mt-2">
                    <div className="flex-shrink-0 text-blue-500 text-2xl"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {media.filename}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(media.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                      <audio
                        src={media.url}
                        controls
                        className="w-full mt-1"
                        preload="metadata"
                      />
                    </div>
                  </div>
                );
              }
              if (
                !media.mime.startsWith("image/") &&
                !media.mime.startsWith("video/") &&
                !media.mime.startsWith("audio/")
              ) {
                return (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-md mt-2">
                    <div className="flex-shrink-0 text-blue-500 text-2xl">
                      <span role="img" aria-label="attachment">
                        <DocumentIcon className="text-black w-7" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {media.filename}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(media.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    <a
                      href={media.url}
                      download={media.filename}
                      className="text-blue-500 hover:text-blue-600"
                      title="Download file"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </a>
                  </div>
                );
              }
              return null;
            })()} */}
            {/* Overlay for clicking anywhere to open full viewer */}
            {message.media.length > 1 && (
              <button
                className="absolute inset-0 w-full h-full z-10 cursor-pointer bg-transparent"
                style={{ pointerEvents: "auto" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaToView({ media: message.media });
                }}
                tabIndex={-1}
                aria-label="View all media"
              />
            )}
          </div>
        )}

        {/* Text content */}
        {message.text && (
          <div className=" whitespace-pre-wrap break-words ">
            {message.text.split(/(\s+)/).map((part, idx) => {
              // Simple URL regex
              const urlRegex = /^(https?:\/\/[^\s]+)/;
              if (urlRegex.test(part)) {
                return (
                  <a
                    key={idx}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className=" underline break-all text-orange-600"
                  >
                    {part}
                  </a>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </div>
        )}
      </div>
    );
  };

  const getReactionCount = (emoji) => {
    return message.reactions?.filter((r) => r.emoji === emoji).length || 0;
  };

  const hasUserReacted = (emoji) => {
    const me = session?.user?.id;
    return message.reactions?.some(
      (r) => r.emoji === emoji && (r.by?._id === me || r.by === me)
    );
  };

  if (message.type === "system") {
    // Center system message in the middle of the window
    return (
      <div className="flex justify-center w-full my-2">
        {getMessageContent()}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-2" : "order-1"}`}>
        {/* Avatar */}
        {!isOwn && (
          <div
            className="flex items-center space-x-2 mb-1 cursor-pointer"
            onClick={() => {
              router.push(`/profile/${message.sender.handle}`);
            }}
          >
            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {message.sender.image ? (
                <img
                  src={message.sender.image}
                  alt={message.sender.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500">
                  {message.sender.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 font-semibold">
              {message.sender.name}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative rounded-lg px-3 py-2 flex flex-col ${
            isOwn
              ? "bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white"
              : "bg-gradient-to-br from-gray-200 to-zinc-300 text-black"
          }`}
          onContextMenu={handleContextMenu}
        >
          {getMessageContent()}

          {/* Timestamp */}
          <div
            className={`text-xs mt-1   ${
              isOwn ? "text-blue-100  ml-auto" : "text-gray-500 mr-auto"
            }`}
          >
            {dateFormatter(new Date(message.createdAt))}
          </div>

          <div className="flex justify-between w-full">
            {message.editedAt && (
              <div className={`text-xs mt-1 italic ${!isOwn && "ml-auto"}`}>
                Edited
              </div>
            )}

            {/* Read receipts */}
            {isOwn && message.readBy && message.readBy.length > 0 && (
              <div className="text-xs text-blue-100 ml-auto mt-1 font-bold">
                ✓✓
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(
              message.reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <div
                key={emoji}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                  hasUserReacted(emoji)
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
