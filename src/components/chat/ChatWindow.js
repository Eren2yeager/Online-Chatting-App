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
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import MessageContextMenu from "./MessageContextMenu";
import ManageChatModal from "./ManageChatModal";
import TypingIndicator from "./TypingIndicator";
import { useRouter } from "next/navigation";
import {
  fetchMessages as apiFetchMessages,
  markChatRead,
} from "../../lib/client/messages";

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
  const { socket, isConnected } = useSocket();
  const { emit, emitAck } = useSocketEmitter();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuMessage, setContextMenuMessage] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showActions, setShowActions] = useState(false);
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
  const isAdmin = (chat?.admins || []).some((a) => a._id === session?.user?.id);
  const isCreator = chat?.createdBy?._id === session?.user?.id;

  const typingUsers = useTypingIndicator(chat._id);

  const router = useRouter();

  // --- Friendship and Block Logic ---
  // Only applies to 1:1 chats
  const isOneToOne = useMemo(() => chat && !chat.isGroup && Array.isArray(chat.participants) && chat.participants.length === 2, [chat]);
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
    fetch('/api/users/friends')
      .then(res => res.json())
      .then(data => {
        if (data.success) setFriends(data.data || []);
      })
      .catch(() => setFriends([]));

    // Fetch blocked users
    fetch('/api/users/block')
      .then(res => res.json())
      .then(data => {
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

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Mark chat read whenever messages change
    if (messages.length > 0) {
      const lastId = messages[messages.length - 1]?._id;
      markChatRead({ chatId: chat._id, upToMessageId: lastId }).catch(() => {});
    }
  }, [messages]);

  // Fetch messages
  useEffect(() => {
    if (chat?._id) {
      fetchMessages();
    }
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
        setMessages((prev) => [...data.data, ...prev]);
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
        }
         else {
          console.error("Failed to send message:", res?.error);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
        try {
          const res = await emitAck("message:delete", {
            messageId: message._id,
            deleteForEveryone: false,
          });
          if (!res?.success) {
            console.error("Failed to delete message:", res?.error);
          }
        } catch (error) {
          console.error("Error deleting message:", error);
        }
        break;
      case "deleteForEveryone":
        try {
          const res = await emitAck("message:delete", {
            messageId: message._id,
            deleteForEveryone: true,
          });
          if (!res?.success) {
            console.error("Failed to delete message for everyone:", res?.error);
          }
        } catch (error) {
          console.error("Error deleting message for everyone:", error);
        }
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
      return chat.avatar || null;
    } else {
      const otherParticipant = chat.participants?.find(
        (p) => p._id !== session?.user?.id
      );
      return otherParticipant?.image || otherParticipant?.avatar || null;
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 relative rounded-b-lg ">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>

          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => {
                setShowManageGroup(true);
            }}
          >
            <div className="relative h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ">
              {getChatAvatar() ? (
                <img
                  src={getChatAvatar()}
                  alt={getChatDisplayName()}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <div className="h-6 w-6 text-gray-400">
                  {chat.isGroup ? (
                    <UserGroupIcon className="h-6 w-6 text-blue-400" />
                  ) : (
                    <UserIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              )}
              {chat.isGroup && (
                <div className="absolute bottom-0 right-0 h-5 w-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {getChatDisplayName()}
              </h2>
              {chat.isGroup && (
                <p className="text-xs text-gray-500">
                  {chat.participants?.length || 0} members
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                onClick={() => fetchMessages(messages[0]?._id)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2"
              >
                Load more messages
              </button>
            )}

            <AnimatePresence>
              {messages
                .filter(
                  (message) => !message.deletedFor?.includes(session?.user?.id)
                )
                .map((message) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChatMessage
                      message={message}
                      isOwn={message.sender._id === session?.user?.id}
                      onContextMenu={(e) =>
                        handleMessageContextMenu(e, message)
                      }
                    />
                  </motion.div>
                ))}
            </AnimatePresence>

            <div ref={messagesEndRef} />
            
            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />
          </>
        )}
      </div>

      {/* Input or Restriction Message */}
      <div
        className="border-t border-gray-200 rounded-t-lg p-2 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)]"
        onContextMenu={() => setShowContextMenu(false)}
      >
        {chatInputRestrictionMessage ? (
          <div className="text-center text-sm text-gray-500 py-4">
            {chatInputRestrictionMessage}
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
        onAction={handleMessageAction}
        message={contextMenuMessage}
        isOwnMessage={contextMenuMessage?.sender._id === session?.user?.id}
      />

      {(
        <ManageChatModal
          isOpen={showManageGroup}
          onClose={() => setShowManageGroup(false)}
          chat={chat}
          isCreator={isCreator}
          isAdmin={isAdmin}
          handlePromoteAdmin ={handlePromoteAdmin}
          handleDemoteAdmin = {handleDemoteAdmin}
          onUpdated={(updatedChat) => {
            setShowManageGroup(false);
            onChatUpdated?.(updatedChat);
          }}
        />
      )}
    </div>
  );
}
