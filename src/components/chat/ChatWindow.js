"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  useSocket,
  useSocketEmitter,
  useSocketListener,
  useTypingIndicator,
} from "../../lib/socket";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";
import MessageContextMenu from "./MessageContextMenu";
import ManageChatModal from "./ManageChatModal";
import TypingIndicator from "./TypingIndicator";
import { useRouter } from "next/navigation";
import {
  fetchMessages as apiFetchMessages,
  markChatRead,
} from "../../lib/client/messages";
import { Avatar, Badge, Button, Spinner } from "@/components/ui";
import { useToast } from "../layout/ToastContext";
import { useUnreadCount } from "../layout/UnreadCountContext";
/**
 * Chat window component for displaying and sending messages
 */
export default function ChatWindow({
  chat,
  onBack,
  onNewMessage,
  onChatUpdated,
}) {
  const { data: session } = useSession();
  const { isConnected } = useSocket();
  const { emit, emitAck } = useSocketEmitter();
  const { markChatAsRead } = useUnreadCount();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuMessage, setContextMenuMessage] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const isAdmin = (chat?.admins || []).some((a) => a._id === session?.user?.id);
  const isCreator = chat?.createdBy?._id === session?.user?.id;

  const typingUsers = useTypingIndicator(chat._id);
  const showToast = useToast();
  const router = useRouter();

  // --- Friendship and Block Logic ---
  // Only applies to 1:1 chats
  const isOneToOne = useMemo(
    () =>
      chat &&
      !chat.isGroup &&
      Array.isArray(chat.participants) &&
      chat.participants.length === 2,
    [chat]
  );
  const currentUserId = session?.user?.id;

  // Find the other participant (for 1:1)
  const otherParticipant = useMemo(() => {
    if (!isOneToOne || !chat || !Array.isArray(chat.participants)) return null;
    return chat.participants.find((p) => p._id !== currentUserId);
  }, [chat, isOneToOne, currentUserId]);

  // State for friends and blocked users
  const [friends, setFriends] = useState([]);
  const [blocked, setBlocked] = useState([]);

  // Fetch friends and blocked users from API
  useEffect(() => {
    if (!isOneToOne || !session?.user) return;

    // Fetch friends
    fetch("/api/users/friends")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setFriends(data.data || []);
      })
      .catch(() => setFriends([]));

    // Fetch blocked users
    fetch("/api/users/block")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBlocked(data.data || []);
      })
      .catch(() => setBlocked([]));
  }, [isOneToOne, session?.user?.id]);

  // Check if current user is friends with the other participant
  const isFriend = useMemo(() => {
    if (!isOneToOne || !otherParticipant) return true; // allow in group or if not loaded
    // Both must have each other in their friends list
    // Our friends list is from API, otherParticipant.friends may not be up-to-date, so just check if otherParticipant is in our friends
    return friends.some((f) => f._id === otherParticipant._id);
  }, [isOneToOne, otherParticipant, friends]);

  // Check if either user has blocked the other
  const isBlocked = useMemo(() => {
    if (!isOneToOne || !otherParticipant) return false;
    // Our blocked list is from API, otherParticipant.blocked may not be up-to-date, so just check if otherParticipant is in our blocked
    return blocked.some((b) => b._id === otherParticipant._id);
  }, [isOneToOne, otherParticipant, blocked]);

  // Scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Handle scroll detection
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Show button if user scrolled up more than 200px from bottom
    setShowScrollButton(distanceFromBottom > 200);

    // Track if user is manually scrolling
    if (distanceFromBottom > 100) {
      setIsUserScrolling(true);
    } else {
      setIsUserScrolling(false);
    }
  };

  // Auto-scroll only when not manually scrolling or when typing indicator appears
  useEffect(() => {
    if (!isUserScrolling && messages.length > 0) {
      scrollToBottom(true); // Changed to smooth scroll
    }

    // Mark chat read whenever messages change
    if (messages.length > 0) {
      const lastId = messages[messages.length - 1]?._id;
      markChatRead({ chatId: chat._id, upToMessageId: lastId }).catch(() => {});
    }
  }, [messages, isUserScrolling]);

  // Auto-scroll when typing indicator appears/disappears
  useEffect(() => {
    if (!isUserScrolling && typingUsers.length > 0) {
      // Smooth scroll to show typing indicator
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [typingUsers.length, isUserScrolling]);

  // Fetch messages and mark as read
  useEffect(() => {
    if (chat?._id) {
      fetchMessages();
      // Mark chat as read when opened
      markChatAsRead(chat._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat._id]);

  // Socket event listeners
  // useSocketListener is a custom React hook that subscribes to a socket event ("message:new" here)
  // and runs the callback whenever the server emits that event to this client.
  // In contrast, emit is used to send (emit) an event from the client to the server.
  // So: emit = client → server, useSocketListener = server → client.

  useSocketListener("message:new", (data) => {
    if (data.chatId === chat._id) {
      setMessages((prev) => [...prev, data.message]);
      onNewMessage?.(data.message);
    }
  });

  useSocketListener("message:edit", (data) => {
    if (data.chatId === chat._id) {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === data.message._id ? data.message : msg))
      );
    }
  });

  useSocketListener("message:delete", (data) => {
    if (data.chatId === chat._id) {
      if (data.deleteForEveryone) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId
              ? { ...msg, isDeleted: true, text: "", media: [] }
              : msg
          )
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
      }
    }
  });

  useSocketListener("reaction:update", (data) => {
    if (data.chatId === chat._id) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    }
  });

  // Listen for admin promotion and demotion events from the socket server
  useSocketListener("admin:promoted", (data) => {
    if (data.chatId === chat._id && data.chat) {
      // Update chat info (admins, participants, etc.) in parent if callback provided
      onChatUpdated?.(data.chat);
    }
  });

  useSocketListener("admin:demoted", (data) => {
    if (data.chatId === chat._id && data.chat) {
      // Update chat info (admins, participants, etc.) in parent if callback provided
      onChatUpdated?.(data.chat);
    }
  });

  // Listen for chat updates (member add/remove)
  useSocketListener("chat:updated", (data) => {
    if (data.chat._id === chat._id) {
      onChatUpdated?.(data.chat);
    }
  });

  // Listen for chat left event (when user leaves group)
  useSocketListener("chat:left", (data) => {
    if (data.chatId === chat._id) {
      // Redirect to chats page if current user left
      router.push("/chats");
    }
  });

  const fetchMessages = async (beforeId = null) => {
    try {
      setLoading(true);
      const data = await apiFetchMessages({
        chatId: chat._id,
        limit: 50,
        before: beforeId || undefined,
      });

      if (beforeId) {
        // Loading older messages - preserve scroll position
        const container = messagesContainerRef.current;
        const oldScrollHeight = container?.scrollHeight || 0;

        setMessages((prev) => [...data.data, ...prev]);

        // Restore scroll position after new messages are added
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - oldScrollHeight;
          }
        }, 0);
      } else {
        setMessages(data.data);
      }
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Promote a user to admin in a group chat
  const handlePromoteAdmin = async (userId) => {
    if (!chat?._id || !userId) return;
    if (!isCreator) {
      // Only the creator can promote admins
      return;
    }
    try {
      emit("admin:promote", { chatId: chat._id, userId });
    } catch (error) {
      console.error("Error promoting admin:", error);
    }
  };

  // Demote an admin in a group chat
  const handleDemoteAdmin = async (userId) => {
    if (!chat?._id || !userId) return;
    if (!isCreator) {
      // Only the creator can demote admins
      return;
    }
    try {
      emit("admin:demote", { chatId: chat._id, userId });
    } catch (error) {
      console.error("Error demoting admin:", error);
    }
  };

  const handleSendMessage = async (text, media = [], replyToId = null) => {
    if (!isConnected) {
      console.error("Socket not connected, cannot perform action:");
      return;
    }
    if (!text.trim() && media.length === 0) return;

    try {
      if (editMessage) {
        // Handle edit mode
        const res = await emitAck("message:edit", {
          messageId: editMessage._id,
          text: text.trim(),
          media,
        });
        if (res?.success) {
          setEditMessage(null);
        } else {
          console.error("Failed to edit message:", res?.error);
        }
      } else {
        // Handle new message
        const res = await emitAck("message:new", {
          chatId: chat._id,
          text: text.trim(),
          media,
          replyTo: replyToId || undefined,
        });
        if (res?.success) {
          if (replyToMessage) setReplyToMessage(null);
        } else {
          console.error("Failed to send message:", res?.error);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle message deletion with proper error handling and toast notifications
  const handleDeleteMessage = async (message, deleteForEveryone = false) => {
    if (!isConnected) {
      showToast({ text: "Not connected to server" });
      return;
    }

    try {
      const res = await emitAck("message:delete", {
        messageId: message._id,
        deleteForEveryone,
      });

      if (res?.success) {
        if (deleteForEveryone) {
          showToast({ text: "Message deleted for everyone" });
        } else {
          showToast({ text: "Message deleted for you" });
        }
      } else {
        // Show specific error message
        const errorMsg = res?.error || "Failed to delete message";
        showToast({ text: errorMsg });
        console.error("Failed to delete message:", res?.error);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      showToast({ text: "Failed to delete message" });
    }
  };

  const handleMessageAction = async (action, message) => {
    if (!isConnected) {
      console.error("Socket not connected, cannot perform action:", action);
      return;
    }

    switch (action) {
      case "edit":
        {
          setEditMessage(message);
          setTimeout(() => {
            const input = document.querySelector(
              'input[placeholder="Type a message..."]'
            );
            if (input) input.focus();
          }, 0);
        }
        break;
      case "delete":
        await handleDeleteMessage(message, false);
        break;
      case "deleteForEveryone":
        await handleDeleteMessage(message, true);
        break;
      case "reply":
        setReplyToMessage(message);
        setTimeout(() => {
          const input = document.querySelector(
            'input[placeholder="Type a message..."]'
          );
          if (input) input.focus();
        }, 0);
        break;

      default:
        break;
    }
    setShowContextMenu(false);
  };

  const handleMessageContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenuMessage(message);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const getOtherParticipantHandle = () => {
    if (chat.isGroup) {
      return;
    }
    const otherParticipant = chat.participants.find(
      (p) => p._id !== session?.user?.id
    );
    return otherParticipant?.handle;
  };

  const getChatDisplayName = () => {
    if (chat.isGroup) {
      return chat.name || "Group Chat";
    } else {
      const otherParticipant = chat.participants?.find(
        (p) => p._id !== session?.user?.id
      );
      return otherParticipant?.name || "Unknown User";
    }
  };

  const getChatAvatar = () => {
    if (chat.isGroup) {
      return chat.image || null;
    } else {
      const otherParticipant = chat.participants?.find(
        (p) => p._id !== session?.user?.id
      );
      return otherParticipant?.image || null;
    }
  };

  // --- UI for friendship/block restriction ---
  let chatInputRestrictionMessage = null;
  if (isOneToOne) {
    if (isBlocked) {
      chatInputRestrictionMessage =
        "You cannot send messages because you have blocked this user or they have blocked you.";
    } else if (!isFriend) {
      chatInputRestrictionMessage =
        "You can only chat with users who are your friends. Add this user as a friend to start chatting.";
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.05),transparent_50%)] pointer-events-none"></div>
      
      {/* Modern Header with Gradient */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/60 bg-gradient-to-r from-white/80 via-blue-50/50 to-purple-50/50 backdrop-blur-xl shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl hover:bg-white/80 active:bg-white transition-all hover:shadow-sm"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </button>

          {/* Chat Info */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            onClick={() => setShowManageGroup(true)}
          >
            <div className="relative">
              <Avatar
                src={getChatAvatar()}
                alt={getChatDisplayName()}
                size="md"
                fallback={
                  chat.isGroup ? (
                    <UserGroupIcon className="h-5 w-5" />
                  ) : undefined
                }
                className="ring-2 ring-white shadow-md group-hover:ring-blue-300 transition-all group-hover:shadow-lg"
              />
              {chat.isGroup && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 sm:h-7 sm:w-7 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                  <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {getChatDisplayName()}
              </h2>
              {chat.isGroup && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                    {chat.participants?.length || 0} members
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-2 sm:space-y-3 relative z-0 scroll-smooth"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.1)),
            repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(59,130,246,0.02) 50px, rgba(59,130,246,0.02) 51px)
          `,
          scrollBehavior: 'smooth'
        }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner size="lg" variant="primary" />
            <p className="mt-4 text-gray-500 font-medium">
              Loading messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center mb-4 shadow-lg ring-4 ring-white/50">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
              No messages yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 text-center max-w-xs px-4">
              {chat.isGroup
                ? "Start the conversation by sending the first message to the group"
                : "Send a message to start chatting"}
            </p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchMessages(messages[0]?._id)}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {loading ? "Loading..." : "Load more messages"}
                </Button>
              </div>
            )}

            {messages
              .filter(
                (message) => !message.deletedFor?.includes(session?.user?.id)
              )
              .map((message) => (
                <ChatMessage
                  key={message._id}
                  message={message}
                  isOwn={message.sender._id === session?.user?.id}
                  onReply={(msg) => setReplyToMessage(msg)}
                  onEdit={(msg) => {
                    setEditMessage(msg);
                  }}
                  onDelete={async (msg, deleteForEveryone) => {
                    try {
                      const res = await emitAck("message:delete", {
                        messageId: msg._id,
                        deleteForEveryone,
                      });
                      if (res?.success) {
                        showToast({
                          text: deleteForEveryone
                            ? "Message deleted for everyone"
                            : "Message deleted",
                        });
                      }
                    } catch (error) {
                      showToast({ text: "Failed to delete message" });
                    }
                  }}
                  onReact={(emoji) => {
                    emit("reaction:add", { messageId: message._id, emoji });
                  }}
                  showAvatar={
                    !chat.isGroup || message.sender._id !== session?.user?.id
                  }
                />
              ))}

            <div ref={messagesEndRef} />

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div>
                <TypingIndicator typingUsers={typingUsers} />
              </div>
            )}
          </>
        )}

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={() => {
              scrollToBottom(true);
              setIsUserScrolling(false);
            }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-8 z-20 p-2.5 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 ring-2 ring-white/50"
            aria-label="Scroll to bottom"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Input Area with Gradient Shadow */}
      <div
        className="border-t border-white/60 bg-gradient-to-r from-white/90 via-blue-50/40 to-purple-50/40 backdrop-blur-xl p-3 shadow-[0_-8px_32px_-8px_rgba(59,130,246,0.15)] relative z-10"
        onContextMenu={() => setShowContextMenu(false)}
      >
        {chatInputRestrictionMessage ? (
          <div className="text-center py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-xl border border-amber-200/60 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-700 font-medium">
              {chatInputRestrictionMessage}
            </p>
          </div>
        ) : (
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={!isConnected}
            chatId={chat._id}
            replyToMessage={replyToMessage}
            onCancelReply={() => setReplyToMessage(null)}
            editMessage={editMessage}
            onCancelEdit={() => setEditMessage(null)}
          />
        )}
      </div>

      {/* Context Menu */}
      <MessageContextMenu
        isOpen={showContextMenu}
        position={contextMenuPosition}
        onClose={() => setShowContextMenu(false)}
        message={contextMenuMessage}
        isOwn={contextMenuMessage?.sender._id === session?.user?.id}
        onReply={(msg) => setReplyToMessage(msg)}
        onEdit={(msg) => setEditMessage(msg)}
        onDelete={handleDeleteMessage}
        onReact={(emoji) => {
          // Reaction handled in MessageContextMenu
        }}
      />

      {
        <ManageChatModal
          isOpen={showManageGroup}
          onClose={() => setShowManageGroup(false)}
          chat={chat}
          isCreator={isCreator}
          isAdmin={isAdmin}
          handlePromoteAdmin={handlePromoteAdmin}
          handleDemoteAdmin={handleDemoteAdmin}
          onUpdated={(updatedChat) => {
            setShowManageGroup(false);
            onChatUpdated?.(updatedChat);
          }}
        />
      }
    </div>
  );
}
