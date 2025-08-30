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
export default function ChatMessage({ message, isOwn, onContextMenu }) {
  const { data: session } = useSession();
  const [showReactions, setShowReactions] = useState(false);
  const router = useRouter();
  const handleContextMenu = (e) => {
    e.preventDefault();
    onContextMenu(e, message);
  };

  const handleReaction = (emoji) => {
    // Emit reaction via socket
    // This would be handled by the parent component
  };

  const getMessageContent = () => {
    // System messages: show a compact neutral banner
    if (message.type === "system") {
      let description = message.text;
      if (!description && message.system) {
        const evt = message.system.event;
        const names = (message.system.targets || [])
          .map((t) => t.name || t.handle || "User")
          .join(", ");
        if (evt === "member_added") description = `${names} joined the group`;
        if (evt === "member_removed") description = `${names} left the group`;
        if (evt === "name_changed")
          description = `Group name changed to "${
            message.system.next?.name || ""
          }"`;
        if (evt === "image_changed") description = `Group image updated`;
        if (evt === "admin_promoted") description = `${names} is now an admin`;
        if (evt === "admin_demoted")
          description = `${names} is no longer an admin`;
      }
      return (
        <div className="w-full text-center text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-md px-2 py-1">
          {description || "Update"}
        </div>
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
            <div className="font-medium text-xs text-green-500">
              <div className="flex items-center gap-2">
                <span className="">
                  Replying to{" "}
                  {message.sender?._id === message.replyTo.sender?._id ? (
                    "Self"
                  ) : (
                    <>
                      {message.replyTo.sender?._id === session?.user?.id ? (
                        "You"
                      ) : (
                        <>
                          {message.replyTo.sender?.image && (
                            <img
                              src={message.replyTo.sender.image}
                              alt={message.replyTo.sender.name || "User"}
                              className="w-6 h-6 rounded-full object-cover  inline-block mr-1"
                            />
                          )}
                          <span className="text-purple-600 font-bold">
                            {message.replyTo.sender?.name || "User"}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </span>
              </div>
            </div>

            {message.replyTo.media && message.replyTo.media.length > 0 && (
              <div className="flex gap-2 mt-2">
                {message.replyTo.media.map((media, idx) => (
                  <div key={idx} className="max-w-[80px] max-h-[80px]">
                    {media.mime.startsWith("image/") ? (
                      <img
                        src={media.url}
                        alt={media.filename || "Image"}
                        className="rounded-md shadow w-full h-full object-cover cursor-pointer"
                        onClick={() => window.open(media.url, "_blank")}
                      />
                    ) : media.mime.startsWith("video/") ? (
                      <video
                        src={media.url}
                        className="rounded-md shadow w-full h-full object-cover bg-black"
                        preload="metadata"
                        controls={false}
                        onClick={() => window.open(media.url, "_blank")}
                      />
                    ) : media.mime.startsWith("audio/") ? (
                      <div className="flex items-center">
                        <audio
                          src={media.url}
                          controls
                          className="w-full"
                          preload="metadata"
                        />
                      </div>
                    ) : (
                      <a
                        href={media.url}
                        download={media.filename}
                        className="flex items-center gap-1 text-blue-500 hover:underline"
                        title="Download file"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="truncate max-w-[60px]">
                          {media.filename}
                        </span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="truncate">
              
              
              {(message.replyTo.isDeleted) ? "🚫 This message was deleted" : message.replyTo.text }</div>
          </div>
        )}

        {/* Media content */}
        {message.media && message.media.length > 0 && (
          <div className="space-y-3">
            {message.media.map((media, index) => (
              <div key={index} className=" max-w-xs  mx-auto">
                {media.mime.startsWith("image/") ? (
                  <div className="relative group">
                    <img
                      src={media.url}
                      alt={media.filename || "Image"}
                      className="rounded-xl shadow-md w-full h-auto cursor-pointer transition-transform duration-200 "
                      onClick={() => window.open(media.url, "_blank")}
                    />
                  </div>
                ) : media.mime.startsWith("video/") ? (
                  <div className="relative group">
                    <video
                      src={media.url}
                      controls
                      className="rounded-xl shadow-md max-w-full h-auto bg-black"
                      preload="metadata"
                    />
                  </div>
                ) : media.mime.startsWith("audio/") ? (
                  <div className="flex max-w-[300px] items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-md">
                    <div className="flex-shrink-0 text-blue-500 text-2xl">
                      {/* <span role="img" aria-label="audio">🎵</span> */}
                    </div>
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
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-md">
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
                )}
              </div>
            ))}
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
