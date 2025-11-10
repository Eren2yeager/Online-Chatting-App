"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import CustomChatIcon from "@/components/icons/CustomChatIcon";
import ChatSidebar from "../../../components/chat/ChatSidebar";
import CreateGroupModal from "../../../components/chat/CreateGroupModal.jsx";
import FriendRequestsModal from "../../../components/chat/FriendRequestsModal.jsx";
import AddFriendModal from "../../../components/friends/AddFriendModal.jsx";
import ResizableLayout from "../../../components/chat/ResizableLayout";
import { useSocket } from "@/lib/socket";
import { Loader } from "@/components/ui";
/**
 * Main chats page - shows sidebar and a placeholder for selected chat on desktop, sidebar only on mobile
 */
export default function ChatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  // Fetch chats on mount ONLY (not on every session change)
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/signin");
      return;
    }
    // Only fetch if chats are empty
    if (chats.length === 0) {
      fetchChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status]);

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
      console.log(data);
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

  // Socket listeners for real-time chat updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages to update lastMessage in sidebar
    const handleMessageNew = (data) => {
      const { message, chatId } = data;

      console.log("📨 New message received:");
      console.log("  - chatId:", chatId);
      console.log("  - message._id:", message._id);
      console.log("  - message.text:", message.text);
      console.log("  - message.sender:", message.sender);
      console.log("  - message.sender.name:", message.sender?.name);
      console.log("  - message.sender._id:", message.sender?._id);

      setChats((prevChats) => {
        // Find the chat
        const chatIndex = prevChats.findIndex((c) => c._id === chatId);

        if (chatIndex === -1) {
          // Chat not in list, might be a new chat - ignore for now
          // It will be added via chat:created event if needed
          console.log("⚠️ Chat not found in list, ignoring...");
          return prevChats;
        }

        // Update the chat with new lastMessage and move to top
        const updatedChats = [...prevChats];
        const chat = { ...updatedChats[chatIndex] };

        // Update lastMessage with proper structure
        chat.lastMessage = {
          _id: message._id,
          text: message.text || "",
          sender: message.sender,
          media: message.media || [],
          type: message.type || "text",
          isDeleted: message.isDeleted || false,
          createdAt: message.createdAt || new Date().toISOString(),
        };
        chat.lastActivity = message.createdAt || new Date().toISOString();

        console.log("✅ Updated chat lastMessage:", chat.lastMessage);

        // Remove from current position and add to top
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift(chat);

        return updatedChats;
      });
    };

    // Listen for message edits
    const handleMessageEdit = (data) => {
      const { message, chatId } = data;

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat._id === chatId && chat.lastMessage?._id === message._id) {
            return {
              ...chat,
              lastMessage: message,
            };
          }
          return chat;
        })
      );
    };

    // Listen for message deletes
    const handleMessageDelete = (data) => {
      const { messageId, chatId, deleteForEveryone } = data;

      if (deleteForEveryone) {
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat._id === chatId && chat.lastMessage?._id === messageId) {
              return {
                ...chat,
                lastMessage: {
                  ...chat.lastMessage,
                  isDeleted: true,
                  text: "",
                  media: [],
                },
              };
            }
            return chat;
          })
        );
      }
    };

    // Listen for chat updates (name, image, participants)
    const handleChatUpdated = (data) => {
      const { chat: updatedChat } = data;

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === updatedChat._id ? { ...chat, ...updatedChat } : chat
        )
      );
    };

    // Listen for new chats (when added to a group)
    const handleChatCreated = (data) => {
      const { chat: newChat } = data;

      setChats((prevChats) => {
        // Check if chat already exists
        if (prevChats.some((c) => c._id === newChat._id)) {
          return prevChats;
        }
        return [newChat, ...prevChats];
      });
    };

    // Listen for chat left/removed
    const handleChatLeft = (data) => {
      const { chatId } = data;

      setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));
    };

    // Register all socket listeners
    socket.on("message:new", handleMessageNew);
    socket.on("message:edit", handleMessageEdit);
    socket.on("message:delete", handleMessageDelete);
    socket.on("chat:updated", handleChatUpdated);
    socket.on("chat:created", handleChatCreated);
    socket.on("chat:left", handleChatLeft);

    // Cleanup
    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("message:edit", handleMessageEdit);
      socket.off("message:delete", handleMessageDelete);
      socket.off("chat:updated", handleChatUpdated);
      socket.off("chat:created", handleChatCreated);
      socket.off("chat:left", handleChatLeft);
    };
  }, [socket, isConnected]);

  const filteredChats =
    chats && Array.isArray(chats)
      ? chats.filter((chat) => {
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
        })
      : [];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile Sidebar */}
        <div className="w-full md:hidden h-full border-r border-gray-200 bg-white flex flex-col">
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
              onShowAddFriend={() => setShowAddFriend(true)}
              loading={loading}
              friendRequestCount={friendRequestCount}
            />
          </div>
        </div>

        {/* Desktop Resizable Layout */}
        <div className="hidden md:flex flex-1 w-full">
          <ResizableLayout
            sidebar={
              <ChatSidebar
                chats={filteredChats}
                selectedChat={null}
                onChatSelect={handleChatSelect}
                onNewMessage={handleNewMessage}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onCreateGroup={() => setShowCreateGroup(true)}
                onShowFriendRequests={() => setShowFriendRequests(true)}
                onShowAddFriend={() => setShowAddFriend(true)}
                loading={loading}
                friendRequestCount={friendRequestCount}
              />
            }
            main={
              <div className="flex-1 flex items-center justify-center">
                <div className="max-w-full w-full px-8 py-12 rounded-2xl flex flex-col items-center">
                  <div className="h-30 w-30 rounded-3xl flex items-center justify-center">
                    <CustomChatIcon className="h-30 w-30" />
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={(newChat) => {
          console.log("Group created:", newChat);
          setChats((prev) => {
            console.log("Adding new chat to list");
            return [newChat, ...prev];
          });
          setShowCreateGroup(false);
          console.log("Navigating to new chat:", newChat._id);
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

      <AddFriendModal
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onFriendAdded={() => setShowAddFriend(false)}
      />
    </>
  );
}
