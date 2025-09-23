"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import ChatSidebar from "../../../components/chat/ChatSidebar";
import CreateGroupModal from "../../../components/chat/CreateGroupModal";
import FriendRequestsModal from "../../../components/chat/FriendRequestsModal";

/**
 * Main chats page - shows sidebar and a placeholder for selected chat on desktop, sidebar only on mobile
 */
export default function ChatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  // Fetch chats on mount or when session changes
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/signin");
      return;
    }
    fetchChats();
  }, [session, status]);

  // Handle ?friend=... param to start chat
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const friendId = urlParams.get("friend");
    if (friendId && session) {
      createOrFindChatWithFriend(friendId);
    }
    // eslint-disable-next-line
  }, [session]);

  // Fetch friend request count for badge
  useEffect(() => {
    const fetchFriendRequestCount = async () => {
      try {
        const response = await fetch("/api/friends/requests");
        const data = await response.json();
        if (data.success) {
          setFriendRequestCount(data.incoming?.length || 0);
        }
      } catch (error) {
        setFriendRequestCount(0);
      }
    };
    if (session) fetchFriendRequestCount();
  }, [session, showFriendRequests]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/chats");
      const data = await response.json();
      console.log(data)
      if (data.success && Array.isArray(data.data.chats)) {
        setChats(data.data.chats);
      } else {
        setChats([]);
      }
    } catch (error) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  const createOrFindChatWithFriend = async (friendId) => {
    try {
      // First check if a chat already exists
      const response = await fetch("/api/chats");
      const data = await response.json();
      if (data.success) {
        const existingChat = data.data.chats.find(
          (chat) =>
            !chat.isGroup &&
            chat.participants.length === 2 &&
            chat.participants.some(
              (p) => p._id === friendId || p === friendId
            ) &&
            chat.participants.some(
              (p) => p._id === session.user.id || p === session.user.id
            )
        );
        if (existingChat) {
          router.push(`/chats/${existingChat._id}`);
          return;
        }
      }
      // Create new chat
      const createResponse = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isGroup: false,
          participants: [friendId],
        }),
      });
      if (createResponse.ok) {
        const newChat = await createResponse.json();
        if (newChat.success) {
          router.push(`/chats/${newChat.data._id}`);
        }
      }
    } catch (error) {
      // Optionally show error
    }
  };

  const handleChatSelect = (chat) => {
    router.push(`/chats/${chat._id}`);
  };

  const handleNewMessage = (message) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat._id === message.chatId
          ? {
              ...chat,
              lastMessage: {
                content: message.text || "Media message",
                type: message.type,
                senderId: message.sender._id,
                createdAt: new Date(),
              },
            }
          : chat
      )
    );
  };

  const filteredChats = chats && Array.isArray(chats) ? chats.filter((chat) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (chat.isGroup) {
      return chat.name?.toLowerCase().includes(query);
    } else {
      const otherParticipant = chat.participants.find(
        (p) => p._id !== session?.user?.id
      );
      return (
        otherParticipant?.name?.toLowerCase().includes(query) ||
        otherParticipant?.handle?.toLowerCase().includes(query)
      );
    }
  }) : [];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-full md:w-80 h-full border-r border-gray-200 bg-white flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatSidebar
              chats={filteredChats}
              selectedChat={null}
              onChatSelect={handleChatSelect}
              onNewMessage={handleNewMessage}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onCreateGroup={() => setShowCreateGroup(true)}
              onShowFriendRequests={() => setShowFriendRequests(true)}
              loading={loading}
              friendRequestCount={friendRequestCount}
            />
          </div>
        </div>
        {/* Desktop Chat Placeholder */}
        <div className="hidden md:flex flex-1 items-center justify-center max-h-full">
          <div className="max-w-full  w-full px-8 py-12  rounded-2xl  flex flex-col items-center">
            <ChatBubbleLeftRightIcon className="h-20 w-20  mb-4 p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Select a conversation
            </h2>
            <p className="text-gray-500 text-center mb-6">
              Choose a chat from the sidebar to start messaging.<br />
          
            </p>
            <div className="flex gap-3">

              <button
                onClick={() => router.push("/friends")}
                className="inline-flex items-center px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
              >
                <UserIcon className="h-5 w-5 mr-2" />
                Go to Friends
                {friendRequestCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {friendRequestCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(newChat) => {
          setChats((prev) => [newChat, ...prev]);
          setShowCreateGroup(false);
          router.push(`/chats/${newChat._id}`);
        }}
      />

      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
        onRequestAccepted={() => {
          fetchChats();
        }}
      />
    </>
  );
}

