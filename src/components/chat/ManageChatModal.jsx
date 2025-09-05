"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  UserGroupIcon,
  UsersIcon,
  PhotoIcon,
  LinkIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/layout/ToastContext";
import { useMediaFullView } from "@/components/layout/mediaFullViewContext";
import OverviewTab from "./chatSpareParts/overviewTab";
import MembersTab from "./chatSpareParts/membersTab";
import MediaTab from "./chatSpareParts/mediaTab";
import LinksTab from "./chatSpareParts/linksTab";
import { useSession } from 'next-auth/react';
import { useSocketEmit } from '@/lib/socket';

export default function ManageChatModal({
  isOpen,
  onClose,
  chat,
  onUpdated,
  isCreator,
  isAdmin,
  handleDemoteAdmin,handlePromoteAdmin
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [imageFile, setImageFile] = useState(null);
  const [editForm, setEditForm] = useState({
    name: chat?.name || "",
    description: chat?.description || "",
    image: chat?.avatar || chat?.image || "",
    privacy: chat?.privacy || "admin_only",
  });
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [links, setLinks] = useState([]);

  const participants = chat?.participants || [];
  const admins = chat?.admins || [];
  const isGroup = !!chat?.isGroup;
  const showToast = useToast?.() || (() => {});
  const { setMediaToView } = useMediaFullView();
  const { data: session } = useSession();
  const { emitAck } = useSocketEmit();

  const stats = useMemo(() => ({
    totalMembers: participants.length,
    totalAdmins: admins.length,
    onlineMembers: participants.filter(p => p.status === 'online').length,
    createdDate: chat?.createdAt ? new Date(chat.createdAt).toLocaleDateString() : 'Unknown',
  }), [participants, admins, chat?.createdAt]);

  // For DM chats, compute the other participant for overview
  const otherUser = useMemo(() => {
    if (isGroup) return null;
    const currentUserId = (typeof window !== 'undefined' && session?.user?.id) || null;
    const list = chat?.participantsDetailed || chat?.participants || [];
    // participants may be objects with _id/name/handle or just ids
    const items = list.map((p) => (typeof p === 'string' ? { _id: p } : p));
    return items.find((p) => (p?._id?.toString?.() || p?._id) !== currentUserId) || items[0] || null;
  }, [isGroup, chat?.participants, chat?.participantsDetailed, session?.user?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      generateInviteLink();
      fetchMedia();
      fetchLinks();
    }
  }, [isOpen]);

  const generateInviteLink = () => {
    if (chat?._id && isGroup) {
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/invite/${chat._id}`);
    } else {
      setInviteLink("");
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/users/friends");
      const data = await res.json();
      if (data.success) setFriends(data.data);
      else setFriends([]);
    } catch {
      setFriends([]);
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch(`/api/chats/${chat._id}/media`);
      if (res.ok) {
        const data = await res.json();
        setMediaFiles(data.media || []);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  const fetchLinks = async () => {
    try {
      const res = await fetch(`/api/chats/${chat._id}/links`);
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error("Error fetching links:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast({ text: "Image size should be less than 5MB" });
        return;
      }
      setImageFile(file);
      setEditForm({ ...editForm, image: URL.createObjectURL(file) });
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "image");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const saveSettings = async () => {
    if (!isGroup || !isAdmin) {
      showToast({ text: isGroup ? "Only admins can change group settings" : "No settings for direct chats" });
      return;
    }

    try {
      setLoading(true);
      let imageUrl = editForm.image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const res = await fetch(`/api/chats/${chat._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, image: imageUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ text: "Chat settings saved" });
        onUpdated?.(data.data);
      } else throw new Error(data.error || "Save failed");
    } catch (error) {
      showToast({ text: "Failed to save settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!isGroup || !isAdmin) {
      showToast({ text: "Only group admins can remove members" });
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await emitAck("chat:member:remove", { chatId: chat._id, userId });
      if (res?.success) {
        showToast({ text: "Member removed" });
        onUpdated?.(res.chat);
      } else setError(res?.error || "Failed to remove member");
    } catch {
      setError("Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async (userIds) => {
    if (!isGroup || !isAdmin) {
      showToast({ text: "Only group admins can add members" });
      return;
    }

    if (!userIds.length) return;
    try {
      setLoading(true);
      setError("");
      const res = await emitAck("chat:member:add", { chatId: chat._id, userIds });
      if (res?.success) {
        showToast({ text: "Members added" });
        onUpdated?.(res.chat);
      } else setError(res?.error || "Failed to add members");
    } catch {
      setError("Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!isGroup) return;
    if (isCreator) {
      showToast({ text: "Creator cannot leave the group" });
      return;
    }
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      setLoading(true);
      const res = await emitAck("chat:member:remove", { chatId: chat._id, userId: session.user.id });
      if (res?.success) {
        showToast({ text: "Left the group" });
        onClose();
        window.location.href = "/chats";
      } else {
        showToast({ text: res?.error || "Failed to leave group" });
      }
    } catch (error) {
      showToast({ text: "Failed to leave group" });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaClick = (mediaArray, initialIndex = 0) => {
    setMediaToView({ media: mediaArray, initialIndex });
  };

  const currentMemberIds = useMemo(
    () => new Set(chat?.participants?.map((p) => p._id) || []),
    [chat]
  );

  const filteredFriends = useMemo(() => {
    const q = search.toLowerCase();
    return friends.filter(
      (f) =>
        (f.name || "").toLowerCase().includes(q) ||
        (f.handle || "").toLowerCase().includes(q)
    );
  }, [friends, search]);

  const filteredParticipants = useMemo(() => {
    const q = memberSearch.toLowerCase();
    return participants.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.handle || "").toLowerCase().includes(q)
    );
  }, [participants, memberSearch]);

  if (!isOpen) return null;

  const tabs = isGroup
    ? [
        { id: "overview", label: "Overview", icon: EyeIcon },
        { id: "members", label: "Members", icon: UsersIcon },
        { id: "media", label: "Media", icon: PhotoIcon },
        { id: "links", label: "Links", icon: LinkIcon },
      ]
    : [
        { id: "overview", label: "Overview", icon: EyeIcon },
        { id: "media", label: "Media", icon: PhotoIcon },
        { id: "links", label: "Links", icon: LinkIcon },
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full h-auto max-w-6xl max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {chat?.name || (isGroup ? "Group Chat" : "Chat")}
              </h2>
              {isGroup && (
                <p className="text-sm text-gray-500">
                  {stats.totalMembers} members
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex  flex-col   h-[calc(92vh-120px)]">
            <nav className="p-2   w-fit flex justify-between">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center mx-2 my-2 p-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium pl-2 hidden md:block">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <OverviewTab
                    chat={chat}
                    groupStats={stats}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    imageFile={imageFile}
                    handleImageChange={handleImageChange}
                    saveSettings={saveSettings}
                    loading={loading}
                    isAdmin={isAdmin}
                    isCreator={isCreator}
                    participants={participants}
                    admins={admins}
                    inviteLink={inviteLink}
                    handleLeaveGroup={handleLeaveGroup}
                    isGroup={isGroup}
                    otherUser={otherUser}
                  />
                </motion.div>
              )}

              {isGroup && activeTab === "members" && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <MembersTab
                    participants={filteredParticipants}
                    memberSearch={memberSearch}
                    setMemberSearch={setMemberSearch}
                    handleRemoveMember={handleRemoveMember}
                    isAdmin={isAdmin}
                    isCreator={isCreator}
                    chat={chat}
                    admins={admins}
                    friends={filteredFriends}
                    search={search}
                    setSearch={setSearch}
                    handleAddMembers={handleAddMembers}
                    currentMemberIds={currentMemberIds}
                    loading={loading}
                    error={error}
                    handlePromoteAdmin ={handlePromoteAdmin}
                    handleDemoteAdmin ={handleDemoteAdmin}
                    onPromoteDemoteApi={{
                      promoteEndpoint: `/api/chats/${chat._id}/admins`,
                    }}
                  />
                </motion.div>
              )}

              {activeTab === "media" && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <MediaTab
                    mediaFiles={mediaFiles}
                    onMediaClick={handleMediaClick}
                  />
                </motion.div>
              )}

              {activeTab === "links" && (
                <motion.div
                  key="links"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <LinksTab links={links} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


