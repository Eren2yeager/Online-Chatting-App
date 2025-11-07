"use client";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  FunnelIcon,
  PlusIcon,
  Cog6ToothIcon,
  BellIcon,
  UserPlusIcon,
  ArrowsUpDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import dateFormatter from "@/functions/dateFormattor";
import {
  Avatar,
  UserAvatar,
  Badge,
  NotificationBadge,
  Input,
  Spinner,
} from "@/components/ui";
import { usePresence } from "@/lib/socket";
import { useUnreadCount } from "@/components/layout/UnreadCountContext";
import UnreadBadge from "./UnreadBadge";
/**
 * Chat sidebar component displaying chat list with search and actions
 */
export default function ChatSidebar({
  chats,
  selectedChat,
  onChatSelect,
  searchQuery,
  onSearchChange,
  loading,
  onCreateGroup,
  onShowFriendRequests,
}) {
  const { data: session } = useSession();
  const { getChatUnread, totalUnreadCount } = useUnreadCount();
  const onlineUsers = usePresence();
  const [showActions, setShowActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("all"); // 'all', 'groups', 'direct'
  const [sortBy, setSortBy] = useState("recent"); // 'recent', 'unread', 'name'
  const router = useRouter();

  // Get unread count for a chat
  // const getUnreadCount = (chat) => {
  //   return getChatUnread(chat._id);
  // };
  const getChatDisplayName = (chat) => {
    if (!chat) return "Unknown Chat";
    if (chat.isGroup) {
      return chat.name || "Group Chat";
    } else {
      const otherParticipant = Array.isArray(chat.participants)
        ? chat.participants.find((p) => p._id !== session?.user?.id)
        : null;
      return otherParticipant?.name || "Unknown User";
    }
  };

  const getChatAvatar = (chat) => {
    if (!chat) return null;
    if (chat.isGroup) {
      return chat.image || null;
    } else {
      const otherParticipant = Array.isArray(chat.participants)
        ? chat.participants.find((p) => p._id !== session?.user?.id)
        : null;
      return otherParticipant?.image || null;
    }
  };

  const getLastMessagePreview = (chat) => {
    if (!chat?.lastMessage) return "No messages yet";

    const lastMsg = chat.lastMessage;

    // Handle deleted messages
    if (lastMsg.isDeleted) {
      return "🚫 This message was deleted";
    }

    // Get sender info - handle both populated and unpopulated sender
    let senderName = "";
    if (lastMsg.sender) {
      const senderId = lastMsg.sender._id || lastMsg.sender;
      if (senderId === session?.user?.id) {
        senderName = "You";
      } else if (typeof lastMsg.sender === "object" && lastMsg.sender.name) {
        senderName = lastMsg.sender.name;
      }
    }

    // Determine content based on type
    let content = "";
    if (lastMsg.type === "system") {
      content = "System message";
    } else if (
      lastMsg.type === "image" ||
      (lastMsg.media &&
        lastMsg.media.length > 0 &&
        lastMsg.media[0].mime?.startsWith("image/"))
    ) {
      content = "📷 Image";
    } else if (
      lastMsg.type === "video" ||
      (lastMsg.media &&
        lastMsg.media.length > 0 &&
        lastMsg.media[0].mime?.startsWith("video/"))
    ) {
      content = "🎥 Video";
    } else if (
      lastMsg.type === "audio" ||
      (lastMsg.media &&
        lastMsg.media.length > 0 &&
        lastMsg.media[0].mime?.startsWith("audio/"))
    ) {
      content = "🎧 Audio";
    } else if (lastMsg.media && lastMsg.media.length > 0) {
      content = "📁 File";
    } else {
      content = lastMsg.text || "Sent a message";
    }

    return `${senderName ? senderName + ": " : ""}${content}`;
  };

  const getUnreadCount = (chat) => {
    if (!chat) return 0;
    // Use the UnreadCountContext which updates in real-time via socket
    return getChatUnread(chat._id);
  };

  // Filter and sort chats
  const filteredAndSortedChats = useMemo(() => {
    if (!chats) return [];

    let filtered = [...chats];

    // Apply type filter
    if (filterType === "groups") {
      filtered = filtered.filter((chat) => chat.isGroup);
    } else if (filterType === "direct") {
      filtered = filtered.filter((chat) => !chat.isGroup);
    }

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((chat) => {
        const name = getChatDisplayName(chat).toLowerCase();
        return name.includes(query);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "unread") {
        const unreadA = getUnreadCount(a);
        const unreadB = getUnreadCount(b);
        if (unreadA !== unreadB) return unreadB - unreadA;
      } else if (sortBy === "name") {
        const nameA = getChatDisplayName(a).toLowerCase();
        const nameB = getChatDisplayName(b).toLowerCase();
        return nameA.localeCompare(nameB);
      }

      // Default: sort by recent (lastMessage time)
      const timeA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const timeB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return timeB - timeA;
    });

    return filtered;
  }, [chats, filterType, sortBy, searchQuery, session?.user?.id]);

  // totalUnread is now coming from UnreadCountContext via totalUnreadCount prop

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
        <div className="p-4  border-b border-gray-100">
          <div className="animate-pulse mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                <div className="h-4 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
              </div>
              <div className="h-6 w-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-xl">
                <div className="h-14 w-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header with gradient */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        {/* Title and Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Messages
            </h1>
            {totalUnreadCount > 0 && <UnreadBadge count={totalUnreadCount} />}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters || filterType !== "all" || sortBy !== "recent"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              title="Filter & Sort"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>

            {/* Quick Actions */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                onBlur={() => setShowActions(false)}
                className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100 transition-colors"
                title="Quick Actions"
              >
                <PlusIcon className="h-5 w-5" />
              </button>

              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                  >
                    <button
                      onClick={() => {
                        onCreateGroup?.();
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                    >
                      <UserGroupIcon className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium">Create Group</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push("/friends");
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                    >
                      <UserPlusIcon className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">Add Friends</span>
                    </button>
                    {/* <button
                      onClick={() => {
                        onShowFriendRequests?.();
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                    >
                      <BellIcon className="h-5 w-5 text-purple-500" />
                      <span className="text-sm font-medium">
                        Friend Requests
                      </span>
                    </button> */}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        router.push("/settings");
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                    >
                      <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium">Settings</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Search */}
        <Input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          iconPosition="left"
          className="mb-0 text-black"
        />

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3"
            >
              {/* Type Filter */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Filter by Type
                </label>
                <div className="flex gap-2">
                  {[
                    {
                      value: "all",
                      label: "All",
                      icon: ChatBubbleLeftRightIcon,
                    },
                    { value: "groups", label: "Groups", icon: UserGroupIcon },
                    { value: "direct", label: "Direct", icon: UserIcon },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setFilterType(value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                        filterType === value
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Sort by
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "recent", label: "Recent" },
                    { value: "unread", label: "Unread" },
                    { value: "name", label: "Name" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSortBy(value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                        sortBy === value
                          ? "bg-purple-500 text-white shadow-md"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {sortBy === value && <CheckIcon className="h-3 w-3" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Results Info */}
        {(filterType !== "all" || sortBy !== "recent" || searchQuery) &&
          filteredAndSortedChats.length > 0 && (
            <div className="px-2 py-2 mb-2">
              <p className="text-xs text-gray-500">
                {filteredAndSortedChats.length}{" "}
                {filteredAndSortedChats.length === 1
                  ? "conversation"
                  : "conversations"}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          )}

        {filteredAndSortedChats.length === 0 ? (
          <div className="p-8 flex flex-col justify-center items-center h-full">
            <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Conversations Yet
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-xs">
              Start chatting by adding friends or creating a group
            </p>
            <button
              onClick={() => router.push("/friends")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <UserIcon className="h-5 w-5" />
              Add Friends
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedChats.map((chat, index) => {
              const isSelected = selectedChat?._id === chat._id;
              const unreadCount = getUnreadCount(chat);

              return (
                <button
                  key={chat._id}
                  onClick={() => onChatSelect(chat)}
                  className={`w-full p-3 text-left rounded-xl transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg scale-[1.02]"
                      : "bg-white bg hover:bg-gray-50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with status */}
                    <div className="relative flex-shrink-0">
                      {chat.isGroup ? (
                        <Avatar
                          src={getChatAvatar(chat)}
                          alt={getChatDisplayName(chat)}
                          size="md"
                          fallback={<UserGroupIcon className="h-6 w-6" />}
                        />
                      ) : (
                        <UserAvatar
                          user={chat.participants?.find(
                            (p) => p._id !== session?.user?.id
                          )}
                          size="md"
                          showStatus={true}
                          showName={false}
                          onlineUsers={onlineUsers}
                        />
                      )}
                      {chat.isGroup && (
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white">
                          <UserGroupIcon className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-sm font-semibold truncate ${
                            isSelected ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {getChatDisplayName(chat)}
                        </h3>
                        {chat.lastMessage?.createdAt && (
                          <span
                            className={`text-xs ${
                              isSelected ? "text-white/80" : "text-gray-500"
                            }`}
                          >
                            {dateFormatter(
                              new Date(chat.lastMessage.createdAt)
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs truncate ${
                            isSelected
                              ? "text-white/90"
                              : unreadCount > 0
                              ? "text-gray-900 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {getLastMessagePreview(chat)}
                        </p>
                        {!isSelected && (
                          <UnreadBadge
                            count={unreadCount}
                            className="ml-2 flex-shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
