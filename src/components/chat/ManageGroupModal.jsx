


"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
  import { FaCrown } from "react-icons/fa";

import {
  XMarkIcon,
  UserGroupIcon,
  UserPlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  DocumentIcon,
  LinkIcon,
  CalendarIcon,
  UsersIcon,
  CogIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/layout/ToastContext";
import { useMediaFullView } from "@/components/layout/mediaFullViewContext";

export default function ManageGroupModal({
  isOpen,
  onClose,
  chat,
  onUpdated,
  isCreator,
  isAdmin,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [imageFile, setImageFile] = useState(null);
  const [promoteId, setPromoteId] = useState("");
  const [demoteId, setDemoteId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
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
  const [showAllPromote, setShowAllPromote] = useState(false);
  const [showAllDemote, setShowAllDemote] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [links, setLinks] = useState([]);

  const participants = chat?.participants || [];
  const admins = chat?.admins || [];
  const showToast = useToast?.() || (() => {});
  const { setMediaToView } = useMediaFullView();

  // Group statistics
  const groupStats = useMemo(() => ({
    totalMembers: participants.length,
    totalAdmins: admins.length,
    onlineMembers: participants.filter(p => p.status === 'online').length,
    createdDate: chat?.createdAt ? new Date(chat.createdAt).toLocaleDateString() : 'Unknown',
  }), [participants, admins, chat?.createdAt]);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      generateInviteLink();
      fetchGroupMedia();
      fetchGroupLinks();
    }
  }, [isOpen]);

  const generateInviteLink = () => {
    if (chat?._id) {
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/invite/${chat._id}`);
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

  const fetchGroupMedia = async () => {
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

  const fetchGroupLinks = async () => {
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
    if (!isAdmin) {
      showToast({ text: "Only admins can change group settings" });
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
        showToast({ text: "Group settings saved" });
        onUpdated?.(data.data);
      } else throw new Error(data.error || "Save failed");
    } catch (error) {
      showToast({ text: "Failed to save settings" });
    } finally {
      setLoading(false);
    }
  };

  const promote = async () => {
    if (!isAdmin) {
      showToast({ text: "Only admins can promote members" });
      return;
    }

    setLoading(true);
    if (!promoteId) return;
    try {
      const res = await fetch(`/api/chats/${chat._id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: promoteId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ text: "Promoted to admin" });
        onUpdated?.(data.data);
      } else throw new Error(data.error || "Promote failed");
    } catch (error) {
      showToast({ text: "Failed to promote member" });
    } finally {
      setLoading(false);
    }
  };

  const demote = async () => {
    if (!isCreator) {
      showToast({ text: "Only the creator can demote admins" });
      return;
    }

    setLoading(true);
    if (!demoteId) return;
    try {
      const res = await fetch(`/api/chats/${chat._id}/admins`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: demoteId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ text: "Admin demoted" });
        onUpdated?.(data.data);
      } else throw new Error(data.error || "Demote failed");
    } catch (error) {
      showToast({ text: "Failed to demote admin" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!isAdmin) {
      showToast({ text: "Only admins can remove members" });
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/chats/${chat._id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ text: "Member removed" });
        onUpdated?.(data.data);
      } else setError(data.error || "Failed to remove member");
    } catch {
      setError("Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async (userIds) => {
    if (!isAdmin) {
      showToast({ text: "Only admins can add members" });
      return;
    }

    if (!userIds.length) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/chats/${chat._id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ text: "Member added" });
        onUpdated?.(data.data);
      } else setError(data.error || "Failed to add members");
    } catch {
      setError("Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (isCreator) {
      showToast({ text: "Creator cannot leave the group" });
      return;
    }

    if (!confirm("Are you sure you want to leave this group?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/chats/${chat._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast({ text: "Left the group" });
        onClose();
        // Redirect to chats list
        window.location.href = "/chats";
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

  const tabs = [
    { id: "overview", label: "Overview", icon: EyeIcon },
    { id: "members", label: "Members", icon: UsersIcon },
    { id: "media", label: "Media", icon: PhotoIcon },
    { id: "files", label: "Files", icon: DocumentIcon },
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="h-6 w-6 text-blue-500" />
            <div>
            <h2 className="text-xl font-semibold text-gray-900">
                {chat?.name || "Group Chat"}
            </h2>
              <p className="text-sm text-gray-500">
                {groupStats.totalMembers} members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(92vh-120px)]">
          {/* Left Sidebar - Navigation */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <nav className="p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium hidden md:block">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Content Area */}
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
                    groupStats={groupStats}
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
                    promote={promote}
                    demote={demote}
                    promoteId={promoteId}
                    setPromoteId={setPromoteId}
                    demoteId={demoteId}
                    setDemoteId={setDemoteId}
                    showAllPromote={showAllPromote}
                    setShowAllPromote={setShowAllPromote}
                    showAllDemote={showAllDemote}
                    setShowAllDemote={setShowAllDemote}
                    inviteLink={inviteLink}
                    handleLeaveGroup={handleLeaveGroup}
                  />
                </motion.div>
              )}

              {activeTab === "members" && (
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
                    friends={filteredFriends}
                    search={search}
                    setSearch={setSearch}
                    handleAddMembers={handleAddMembers}
                    currentMemberIds={currentMemberIds}
                    loading={loading}
                    error={error}
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

              {activeTab === "files" && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6"
                >
                  <FilesTab
                    mediaFiles={mediaFiles.filter(m => m.type?.startsWith('application/') || m.mime?.startsWith('application/'))}
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

// Tab Components
function OverviewTab({
  chat,
  groupStats,
  editForm,
  setEditForm,
  imageFile,
  handleImageChange,
  saveSettings,
  loading,
  isAdmin,
  isCreator,
  participants,
  admins,
  promote,
  demote,
  promoteId,
  setPromoteId,
  demoteId,
  setDemoteId,
  showAllPromote,
  setShowAllPromote,
  showAllDemote,
  setShowAllDemote,
  inviteLink,
  handleLeaveGroup,
}) {
  const showToast = useToast?.() || (() => {});

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Group Information</h3>
      
      {/* Group Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{groupStats.totalMembers}</div>
          <div className="text-xs text-gray-600">Total Members</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{groupStats.totalAdmins}</div>
          <div className="text-xs text-gray-600">Admins</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{groupStats.onlineMembers}</div>
          <div className="text-xs text-gray-600">Online</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{groupStats.createdDate}</div>
          <div className="text-xs text-gray-600">Created</div>
        </div>
      </div>

      {/* Group Settings */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-700">Group Settings</h4>
        
        {/* Profile Picture */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-4">
                  {editForm.image ? (
                    <motion.img
                      src={editForm.image}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                      <PhotoIcon className="w-10 h-10 text-gray-400" />
                    </motion.div>
                  )}
          {isAdmin && (
            <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="dialog-image-upload"
                  />
                  <label
                    htmlFor="dialog-image-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    style={{ lineHeight: 0 }}
                  >
                    <PhotoIcon className="w-6 h-6" />
                  </label>
            </>
          )}
                </div>
              
        {/* Group Name */}
                <div>
          <label className="block text-sm text-gray-600 mb-1">Group Name</label>
          <input
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="w-full text-black p-2 border rounded-md text-sm"
            disabled={!isAdmin}
            placeholder={isAdmin ? "Enter group name" : "Only admins can change"}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Description</label>
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full text-black p-2 border rounded-md text-sm"
            rows={3}
            disabled={!isAdmin}
            placeholder={isAdmin ? "Enter group description" : "Only admins can change"}
          />
                </div>
       
        {/* Privacy Settings */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Privacy</label>
          <select
            value={editForm.privacy}
            onChange={(e) => setEditForm({ ...editForm, privacy: e.target.value })}
            className="w-full text-black p-2 border rounded-md text-sm"
            disabled={!isAdmin}
          >
            <option value="admin_only">Only admins can invite</option>
            <option value="member_invite">Members can invite</option>
          </select>
        </div>

        {/* Save Button */}
        {isAdmin && (
          <button
            onClick={saveSettings}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
                </button>
        )}

        {/* Invite Link */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Invite Link</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 p-2 border rounded-md text-sm bg-gray-50"
              placeholder="Generating invite link..."
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                showToast({ text: "Invite link copied!" });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Leave Group */}
        {!isCreator && (
          <div className="pt-4 border-t">
            <button
              onClick={handleLeaveGroup}
              disabled={loading}
              className="w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Leave Group
            </button>
              </div>
            )}
      </div>

      {/* Admin Management */}
            <div className="pt-4 border-t">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Admin Management</h4>
        
        {/* Promote Members */}
              <div className="space-y-2 mb-4">
          <h5 className="text-sm font-medium text-gray-600">Promote to Admin</h5>
          {participants.filter(p => !admins.some(a => a._id === p._id)).length === 0 ? (
            <div className="text-xs text-gray-500">All participants are admins.</div>
                ) : (
                  (showAllPromote
              ? participants.filter(p => !admins.some(a => a._id === p._id))
              : participants.filter(p => !admins.some(a => a._id === p._id)).slice(0, 5)
                  ).map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-2 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-600">
                              {p.name?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                        <div>
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">@{p.handle}</div>
                          </div>
                          </div>
                {isAdmin ? (
                      <button
                        onClick={() => {
                          setPromoteId(p._id);
                          promote();
                        }}
                        disabled={loading}
                        className="px-2 py-1 text-xs rounded-md text-green-700 border border-green-200 hover:bg-green-50"
                      >
                        Promote
                      </button>
                ) : (
                  <span className="text-xs text-gray-400">Admin only</span>
                )}
                    </div>
                  ))
                )}
          {participants.filter(p => !admins.some(a => a._id === p._id)).length > 5 && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => setShowAllPromote((v) => !v)}
                  disabled={loading}
                >
                  {showAllPromote ? "Show less" : "View all"}
                </button>
              )}
        </div>

        {/* Demote Admins */}
              {isCreator && (
                <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-600">Demote Admin</h5>
            {admins.filter(a => a._id !== chat?.createdBy?._id).length === 0 ? (
              <div className="text-xs text-gray-500">No admins to demote.</div>
                  ) : (
                    (showAllDemote
                ? admins.filter(a => a._id !== chat?.createdBy?._id)
                : admins.filter(a => a._id !== chat?.createdBy?._id).slice(0, 5)
                    ).map((a) => (
                      <div
                        key={a._id}
                        className="flex items-center justify-between p-2 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            {a.image ? (
                              <img
                                src={a.image}
                                alt={a.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-gray-600">
                                {a.name?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div>
                      <div className="text-sm font-medium text-gray-900">{a.name}</div>
                      <div className="text-xs text-gray-500">@{a.handle}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setDemoteId(a._id);
                            demote();
                          }}
                          disabled={loading}
                          className="px-2 py-1 text-xs rounded-md text-red-700 border border-red-200 hover:bg-red-50"
                        >
                          Demote
                        </button>
                      </div>
                    ))
                  )}
            {admins.filter(a => a._id !== chat?.createdBy?._id).length > 5 && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                  onClick={() => setShowAllDemote((v) => !v)}
                >
                  {showAllDemote ? "Show less" : "View all"}
                </button>
              )}
            </div>
        )}
          </div>
    </div>
  );
}

function MembersTab({
  participants,
  memberSearch,
  setMemberSearch,
  handleRemoveMember,
  isAdmin,
  isCreator,
  chat,
  friends,
  search,
  setSearch,
  handleAddMembers,
  currentMemberIds,
  loading,
  error,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Members ({participants.length})
            </h3>
        {isAdmin && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <UserPlusIcon className="h-4 w-4 inline mr-2" />
            Add Members
          </button>
        )}
      </div>

      {/* Search Members */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Members List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {participants.map((p) => {
                const isCreator = chat?.createdBy?._id === p._id;
                return (
                  <div
                    key={p._id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                    <span className="text-sm text-gray-600">
                            {p.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <div>
                  <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">@{p.handle}</div>
                  {p.status && (
                    <div className="text-xs text-green-600">{p.status}</div>
                  )}
                      </div>
                    </div>
              <div className="flex items-center space-x-2">
                {isCreator ? (
                        <span className="px-2 py-1 text-xs rounded-md text-gray-500 border border-gray-200 bg-gray-50 flex items-center">
                    <FaCrown className="h-3 w-3 mr-1" />
                          Creator
                        </span>
                ) : chat?.admins?.some(a => a._id === p._id) ? (
                  <span className="px-2 py-1 text-xs rounded-md text-blue-500 border border-blue-200 bg-blue-50 flex items-center">
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    Admin
                  </span>
                ) : null}
                {isAdmin && !isCreator && (
                        <button
                          onClick={() => handleRemoveMember(p._id)}
                          disabled={loading}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-700 rounded-md hover:bg-red-50 flex items-center"
                        >
                    <UserMinusIcon className="h-4 w-4 mr-1" />
                    Remove
                        </button>
                )}
              </div>
                  </div>
                );
              })}
          </div>

      {/* Add Members Section */}
      {isAdmin && (
        <div className="pt-6 border-t">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Add Friends</h4>
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search friends..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {friends.map((f) => {
                const isMember = currentMemberIds.has(f._id);
                return (
                  <div
                    key={f._id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isMember
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {f.image ? (
                          <img
                            src={f.image}
                            alt={f.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-600">
                            {f.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <div>
                      <div className="text-sm font-medium text-gray-900">{f.name}</div>
                        <div className="text-xs text-gray-500">@{f.handle}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMembers([f._id])}
                      disabled={loading || isMember}
                      className={`px-2 py-1 text-xs rounded-md flex items-center ${
                        isMember
                          ? "text-gray-400 border border-gray-200 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                    <UserPlusIcon className="h-4 w-4 mr-1" />
                      {isMember ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
            {error && <div className="text-xs text-red-600 mt-3">{error}</div>}
          </div>
      )}
        </div>
  );
}

function MediaTab({ mediaFiles, onMediaClick }) {
  const imageFiles = mediaFiles.filter(m => 
    m.type?.startsWith('image/') || m.mime?.startsWith('image/')
  );
  const videoFiles = mediaFiles.filter(m => 
    m.type?.startsWith('video/') || m.mime?.startsWith('video/')
  );
  const audioFiles = mediaFiles.filter(m => 
    m.type?.startsWith('audio/') || m.mime?.startsWith('audio/')
  );

  if (mediaFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No media shared yet</h3>
        <p className="text-gray-500">When group members share photos, videos, or audio, they'll appear here.</p>
    </div>
  );
}

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Shared Media</h3>
      
      {/* Images */}
      {imageFiles.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Photos ({imageFiles.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageFiles.map((media, idx) => (
              <button
                key={idx}
                onClick={() => onMediaClick(imageFiles, idx)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400 transition-all"
              >
                <img
                  src={media.url}
                  alt={media.name || `image-${idx}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videoFiles.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Videos ({videoFiles.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {videoFiles.map((media, idx) => (
              <button
                key={idx}
                onClick={() => onMediaClick(videoFiles, idx)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-400 transition-all"
              >
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <PlayIcon className="w-8 h-8 text-white opacity-80" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                  {media.name || 'Video'}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audio */}
      {audioFiles.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Audio ({audioFiles.length})</h4>
          <div className="space-y-2">
            {audioFiles.map((media, idx) => (
              <button
                key={idx}
                onClick={() => onMediaClick(audioFiles, idx)}
                className="w-full p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <SpeakerWaveIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {media.name || 'Audio File'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {media.size ? `${(media.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilesTab({ mediaFiles, onMediaClick }) {
  const documentFiles = mediaFiles.filter(m => 
    m.type?.startsWith('application/') || m.mime?.startsWith('application/') ||
    m.type?.startsWith('text/') || m.mime?.startsWith('text/')
  );

  if (documentFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files shared yet</h3>
        <p className="text-gray-500">When group members share documents, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Shared Files</h3>
      
      <div className="space-y-2">
        {documentFiles.map((file, idx) => (
          <button
            key={idx}
            onClick={() => onMediaClick([file], 0)}
            className="w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <DocumentIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {file.name || file.filename || 'Document'}
                </div>
                <div className="text-xs text-gray-500">
                  {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                  {file.mime && ` • ${file.mime}`}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : ''}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function LinksTab({ links }) {
  if (links.length === 0) {
    return (
      <div className="text-center py-12">
        <LinkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No links shared yet</h3>
        <p className="text-gray-500">When group members share links, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Shared Links</h3>
      
      <div className="space-y-3">
        {links.map((link, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <LinkIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {link.title || 'Link'}
                </div>
                <div className="text-xs text-blue-600 truncate mb-2">
                  {link.url}
                </div>
                {link.description && (
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {link.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Shared by {link.sharedBy?.name || 'Unknown'} • {link.createdAt ? new Date(link.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                Open
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}