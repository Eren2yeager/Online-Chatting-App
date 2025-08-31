"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  UserGroupIcon,
  UserPlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/layout/ToastContext";

export default function ManageGroupModal({
  isOpen,
  onClose,
  chat,
  onUpdated,
  isCreator,
  isAdmin,
}) {
  const [imageFile, setImageFile] = useState(null);
  const [promoteId, setPromoteId] = useState("");
  const [demoteId, setDemoteId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeTab, setActiveTab] = useState("settings"); // settings, members, add, activity

  const [editForm, setEditForm] = useState({
    name: chat.name || "",
    description: chat.description || "",
    image: chat?.avatar || chat?.image || "",
    privacy: chat.privacy || "admin_only", // admin_only, member_invite
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

  const participants = chat?.participants || [];
  const admins = chat?.admins || [];
  const showToast = useToast?.() || (() => {});

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size should be less than 5MB");
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
    try {
      setLoading(true);
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const res = await fetch(`/api/chats/${chat._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...editForm , image : imageUrl}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ text: "Group settings saved" });
        onUpdated?.(data.data);
      } else throw new Error(data.error || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const promote = async () => {
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
    } catch {} finally {
      setLoading(false);
    }
  };

  const demote = async () => {
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
    } catch {} finally {
      setLoading(false);
    }
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

  const handleAddMembers = async (userIds) => {
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

  const handleRemoveMember = async (userId) => {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full h-auto max-w-4xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Group
              </h2>
              <p className="text-sm text-gray-500">
                {chat?.name || "Group Chat"}
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

        {/* Group Statistics */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{groupStats.totalMembers}</div>
              <div className="text-xs text-gray-600">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{groupStats.totalAdmins}</div>
              <div className="text-xs text-gray-600">Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{groupStats.onlineMembers}</div>
              <div className="text-xs text-gray-600">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{groupStats.createdDate}</div>
              <div className="text-xs text-gray-600">Created</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {/* Settings */}
          <div className="p-4 sm:p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Group Settings
            </h3>
            {isAdmin ? (
              <>                  
                <div className="relative flex items-center justify-center w-24 h-24 mb-2">
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
                </div>
              
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input value={editForm.name} onChange={ (e)=>{

                 setEditForm({ ...editForm, name: e.target.value })}} className="w-full text-black p-2 border rounded-md text-sm" />
                </div>
       
                <button onClick={saveSettings} disabled={loading} className="w-full rounded-full sm:w-auto bg-blue-600 text-white px-4 py-2">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <div className="text-xs text-gray-500">
                Only admins can change settings.
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Admin Management
              </h4>
              {/* Promote list */}
              <div className="space-y-2 mb-4">
                {participants.filter(
                  (p) => !admins.some((a) => a._id === p._id)
                ).length === 0 ? (
                  <div className="text-xs text-gray-500">
                    All participants are admins.
                  </div>
                ) : (
                  (showAllPromote
                    ? participants.filter(
                        (p) => !admins.some((a) => a._id === p._id)
                      )
                    : participants
                        .filter((p) => !admins.some((a) => a._id === p._id))
                        .slice(0, 5)
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
                          <div className="text-sm font-medium text-gray-900">
                            {p.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            @{p.handle}
                          </div>
                        </div>
                      </div>
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
                    </div>
                  ))
                )}
              </div>
              {participants.filter((p) => !admins.some((a) => a._id === p._id))
                .length > 5 && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => setShowAllPromote((v) => !v)}
                  disabled={loading}
                >
                  {showAllPromote ? "Show less" : "View all"}
                </button>
              )}

              {/* Demote list */}
              {isCreator && (
                <div className="space-y-2">
                  {admins.filter((a) => a._id !== chat?.createdBy?._id)
                    .length === 0 ? (
                    <div className="text-xs text-gray-500">
                      No admins to demote.
                    </div>
                  ) : (
                    (showAllDemote
                      ? admins.filter((a) => a._id !== chat?.createdBy?._id)
                      : admins
                          .filter((a) => a._id !== chat?.createdBy?._id)
                          .slice(0, 5)
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
                            <div className="text-sm font-medium text-gray-900">
                              {a.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              @{a.handle}
                            </div>
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
                </div>
              )}
              {admins.filter((a) => a._id !== chat?.createdBy?._id).length >
                5 && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                  onClick={() => setShowAllDemote((v) => !v)}
                >
                  {showAllDemote ? "Show less" : "View all"}
                </button>
              )}
            </div>
          </div>

          {/* Current Members */}
          <div className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Current Members
            </h3>
            <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto">
              {(chat?.participants || []).map((p) => {
                const isCreator = chat?.createdBy?._id === p._id;
                return (
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
                        <div className="text-sm font-medium text-gray-900">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500">@{p.handle}</div>
                      </div>
                    </div>
                    {isAdmin &&
                      (isCreator ? (
                        <span className="px-2 py-1 text-xs rounded-md text-gray-500 border border-gray-200 bg-gray-50 flex items-center">
                          Creator
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRemoveMember(p._id)}
                          disabled={loading}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-700 rounded-md hover:bg-red-50 flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" /> Remove
                        </button>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Friends */}
          <div className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Add Friends
            </h3>
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search friends..."
                className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto">
              {filteredFriends.map((f) => {
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
                        <div className="text-sm font-medium text-gray-900">
                          {f.name}
                        </div>
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
                      <UserPlusIcon className="h-4 w-4 mr-1" />{" "}
                      {isMember ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
            {error && <div className="text-xs text-red-600 mt-3">{error}</div>}
          </div>
        </div>
      </motion.div>

    </div>
  );
}
