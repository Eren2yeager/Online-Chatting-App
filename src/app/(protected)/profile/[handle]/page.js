"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UserIcon,
  QrCodeIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  UserPlusIcon,
  PencilIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";

import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

function dateFormatter(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Relationship status enums
const RELATIONSHIP = {
  NONE: "none", // no relationship
  FRIEND: "friend",
  OUTGOING: "outgoing", // you sent request, waiting for them
  INCOMING: "incoming", // they sent request, waiting for you
  BLOCKED: "blocked",
  YOU_BLOCKED: "you_blocked",
  THEY_BLOCKED: "they_blocked",
  SELF: "self",
};

export default function ProfileByHandlePage() {
  const params = useParams();
  const router = useRouter();
  const { handle } = params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState(null);

  // New state for current user and relationship status
  const [currentUser, setCurrentUser] = useState(null);
  const [relationship, setRelationship] = useState(RELATIONSHIP.NONE);
  const [pendingRequestId, setPendingRequestId] = useState(null); // for cancel/reject

  // Fetch user and current user
  useEffect(() => {
    if (!handle) return;
    fetchUserByHandle();
    fetchCurrentUser();
  }, [handle]);

  // Fetch the profile being viewed
  const fetchUserByHandle = async () => {
    try {
      const res = await fetch(`/api/users/by-handle/${handle}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setEditForm({
          name: data.name || "",
          bio: data.bio || "",
          image: data.image || "",
        });
      } else {
        setUser(null);
        toast.error("User not found");
      }
    } catch (err) {
      setUser(null);
      toast.error("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  // Fetch the currently logged-in user
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
    }
  };

  // Check relationship status when both users are loaded
  useEffect(() => {
    if (!user || !currentUser) {
      setRelationship(RELATIONSHIP.NONE);
      setPendingRequestId(null);
      return;
    }
    if (user._id === currentUser._id) {
      setRelationship(RELATIONSHIP.SELF);
      setPendingRequestId(null);
      return;
    }
    checkExistingRelationship(user._id);
    // eslint-disable-next-line
  }, [user, currentUser]);

  // Check relationship between current user and target user
  const checkExistingRelationship = async (targetUserId) => {
    // Check block status first
    const youBlocked = (currentUser.blocked || []).some(
      (id) => (typeof id === "string" ? id : id._id) === targetUserId
    );
    const theyBlocked = (user.blocked || []).some(
      (id) => (typeof id === "string" ? id : id._id) === currentUser._id
    );
    if (youBlocked) {
      setRelationship(RELATIONSHIP.YOU_BLOCKED);
      setPendingRequestId(null);
      return;
    }
    if (theyBlocked) {
      setRelationship(RELATIONSHIP.THEY_BLOCKED);
      setPendingRequestId(null);
      return;
    }

    // Check if already friends
    const friendIds = (currentUser.friends || []).map((f) =>
      typeof f === "string" ? f : f._id
    );
    if (friendIds.includes(targetUserId)) {
      setRelationship(RELATIONSHIP.FRIEND);
      setPendingRequestId(null);
      return;
    }

    // Check for pending requests (either direction)
    try {
      const requestsRes = await fetch("/api/friends/requests");
      if (requestsRes.ok) {
        const { incoming = [], outgoing = [] } = await requestsRes.json();

        // Outgoing: you sent request to them
        const outgoingReq = outgoing.find(
          (req) => req.to._id === targetUserId && req.status === "pending"
        );
        if (outgoingReq) {
          setRelationship(RELATIONSHIP.OUTGOING);
          setPendingRequestId(outgoingReq._id);
          return;
        }

        // Incoming: they sent request to you
        const incomingReq = incoming.find(
          (req) => req.from._id === targetUserId && req.status === "pending"
        );
        if (incomingReq) {
          setRelationship(RELATIONSHIP.INCOMING);
          setPendingRequestId(incomingReq._id);
          return;
        }
      }
    } catch (error) {
      // ignore
    }
    setRelationship(RELATIONSHIP.NONE);
    setPendingRequestId(null);
  };

  const copyProfileHandle = () => {
    navigator.clipboard.writeText(`@${user.handle}`);
    toast.success("Profile handle copied to clipboard!");
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/invite/${user.handle}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  // Friend request actions
  const sendFriendRequest = async () => {
    try {
      const res = await fetch(`/api/friends/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json();
      if (res.ok && data) {
        toast.success("Friend request sent");
        setRelationship(RELATIONSHIP.OUTGOING);
        setPendingRequestId(data._id || null);
        await checkExistingRelationship(user._id);
      } else {
        toast.error(data?.error || "Failed to send request");
      }
    } catch {
      toast.error("Failed to send request");
    }
  };

  const cancelFriendRequest = async () => {
    if (!pendingRequestId) return;
    try {
      const res = await fetch(`/api/friends/requests/${pendingRequestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      // The API returns { message: "..."} on success, not { success: true }
      if (res.ok && data && data.message) {
        toast.success("Friend request cancelled");
        setRelationship(RELATIONSHIP.NONE);
        setPendingRequestId(null);
        // Re-check relationship to ensure UI is in sync with backend
        await checkExistingRelationship(user._id);
      } else {
        toast.error(data?.error || "Failed to cancel request");
      }
    } catch {
      toast.error("Failed to cancel request");
    }
  };

  const acceptFriendRequest = async () => {
    if (!pendingRequestId) return;
    try {
      const res = await fetch(`/api/friends/requests/${pendingRequestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = await res.json();
      // The API returns { message: "..."} on success
      if (res.ok && data && data.message) {
        toast.success("Friend request accepted");

        setRelationship(RELATIONSHIP.FRIEND);
        setPendingRequestId(null);
        // Re-check relationship to ensure UI is in sync with backend

      } else {
        toast.error(data?.error || "Failed to accept request");
      }
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const rejectFriendRequest = async () => {
    if (!pendingRequestId) return;
    try {
      const res = await fetch(`/api/friends/requests/${pendingRequestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      // The API returns the updated request object on success
      if (res.ok && data && data.status === "rejected") {
        toast.success("Friend request rejected");
        setRelationship(RELATIONSHIP.NONE);
        setPendingRequestId(null);
        // Re-check relationship to ensure UI is in sync with backend
        await checkExistingRelationship(user._id);
      } else {
        toast.error(data?.error || "Failed to reject request");
      }
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    try {
      const response = await fetch(`/api/users/friends/${friendId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Friend removed successfully");
        setRelationship(RELATIONSHIP.NONE);
      } else {
        toast.error("Failed to remove friend");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  // Block/unblock
  const blockUser = async () => {
    try {
      const res = await fetch(`/api/users/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRelationship(RELATIONSHIP.YOU_BLOCKED);
        toast.success("User blocked");
      } else {
        toast.error(data?.error || "Failed to block");
      }
    } catch {
      toast.error("Failed to block");
    }
  };

  const unblockUser = async () => {
    try {
      const res = await fetch(`/api/users/block?userId=${user._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRelationship(RELATIONSHIP.NONE);
        toast.success("User unblocked");
      } else {
        toast.error(data?.error || "Failed to unblock");
      }
    } catch {
      toast.error("Failed to unblock");
    }
  };

  const shareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${user.handle}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Add ${user.name} as a friend`,
          text: `Scan my QR code or use my handle: @${user.handle}`,
          url: profileUrl,
        });
      } catch (error) {
        navigator.clipboard.writeText(profileUrl);
        toast.success("Profile link copied!");
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied!");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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

  const handleSave = async () => {
    if (relationship !== RELATIONSHIP.SELF) return;
    try {
      setUploading(true);
      let imageUrl = editForm.image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, image: imageUrl }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setIsEditing(false);
        setImageFile(null);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  const startChat = async () => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: user._id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/chats/${data.data._id}`);
      } else {
        toast.error("Failed to start chat");
      }
    } catch {
      toast.error("Failed to start chat");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <UserIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The user with handle <span className="font-mono">@{handle}</span>{" "}
            does not exist.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Action button rendering logic
  function renderActionButtons() {
    switch (relationship) {
      case RELATIONSHIP.SELF:
        return (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              Edit Profile
            </button>
            <button
              onClick={() => router.push("/friends")}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Manage Friends
            </button>
          </>
        );
      case RELATIONSHIP.FRIEND:
        return (
          <button
            onClick={() => removeFriend(user._id)}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
          >
            <UserMinusIcon className="w-5 h-5 mr-2" />
            Remove Friend
          </button>
        );
      case RELATIONSHIP.OUTGOING:
        return (
          <button
            onClick={cancelFriendRequest}
            className="w-full flex items-center justify-center px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition-colors"
          >
            <UserMinusIcon className="w-5 h-5 mr-2" />
            Cancel Friend Request
          </button>
        );
      case RELATIONSHIP.INCOMING:
        return (
          <div className="flex flex-col gap-2">
            <button
              onClick={acceptFriendRequest}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Accept Friend Request
            </button>
            <button
              onClick={rejectFriendRequest}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              <XCircleIcon className="w-5 h-5 mr-2" />
              Reject Friend Request
            </button>
          </div>
        );
      case RELATIONSHIP.YOU_BLOCKED:
        return (
          <button
            onClick={unblockUser}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            <ShieldCheckIcon className="w-5 h-5 mr-2" />
            Unblock User
          </button>
        );
      case RELATIONSHIP.THEY_BLOCKED:
        return (
          <div className="w-full flex items-center justify-center px-4 py-3 bg-gray-200 text-gray-500 rounded-lg font-medium">
            <ShieldExclamationIcon className="w-5 h-5 mr-2" />
            You are blocked by this user
          </div>
        );
      case RELATIONSHIP.NONE:
      default:
        return (
          <>
            <button
              onClick={sendFriendRequest}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <UserPlusIcon className="w-5 h-5 mr-2" />
              Add Friend
            </button>
            <button
              onClick={blockUser}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              Block User
            </button>
          </>
        );
    }
  }

  return (
    <div className="overflow-auto  h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl h-auto  mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-2xl">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-16 h-16" />
              )}
            </div>
            <div
              className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg ${
                user.status === "online" ? "bg-green-500" : "bg-gray-400"
              }`}
            ></div>
            {relationship === RELATIONSHIP.SELF && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-2 -left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mt-6 mb-2">
            {user.name}
          </h1>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-3">
            @{user.handle}
          </div>
          {user.email && (
            <p className="text-gray-600 flex items-center justify-center gap-2">
              <EnvelopeIcon className="w-4 h-4" />
              {user.email}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              Joined {dateFormatter(user.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  user.status === "online" ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              {user.status === "online"
                ? "Online"
                : `Last seen ${dateFormatter(user.lastSeen)}`}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                About
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {user.bio ||
                  (relationship === RELATIONSHIP.SELF
                    ? "Add a bio to tell others about yourself!"
                    : "No bio added yet.")}
              </p>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">
                    {user.friends?.length || 0}
                  </div>
                  <div className="text-sm text-blue-600">Friends</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    {user.blocked?.length || 0}
                  </div>
                  <div className="text-sm text-purple-600">Blocked</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    {user.emailVerified ? "✓" : "✗"}
                  </div>
                  <div className="text-sm text-green-600">Verified</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.floor(
                      (new Date() - new Date(user.createdAt)) /
                        (1000 * 60 * 60 * 24)
                    )}
                  </div>
                  <div className="text-sm text-orange-600">Days Active</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                {renderActionButtons()}
                {/* Always show chat if not self and not blocked */}
                {relationship !== RELATIONSHIP.SELF &&
                  relationship !== RELATIONSHIP.THEY_BLOCKED &&
                  relationship !== RELATIONSHIP.YOU_BLOCKED && (
                    <button
                      onClick={startChat}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                      Go to Chat
                    </button>
                  )}
              </div>
            </motion.div>

            {/* Share Profile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <QrCodeIcon className="w-5 h-5 mr-2" />
                Share Profile
              </h3>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-gray-600 mb-2">Profile Handle</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-gray-900 truncate flex-1 mr-2">
                    @{user.handle}
                  </span>
                  <button
                    onClick={copyProfileHandle}
                    className="flex-shrink-0 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  <QrCodeIcon className="w-5 h-5 mr-2" />
                  {showQR ? "Hide QR Code" : "Show QR Code"}
                </button>

                <button
                  onClick={shareProfile}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <GlobeAltIcon className="w-5 h-5 mr-2" />
                  Share Profile
                </button>
              </div>

              {showQR && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 p-4 bg-white border rounded-lg"
                >
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={`${window.location.origin}/profile/${user.handle}`}
                      size={128}
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Scan to view profile
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Account Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldExclamationIcon className="w-5 h-5 mr-2" />
                Account Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member since:</span>
                  <span className="text-gray-900 font-medium">
                    {dateFormatter(user.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Email verified:</span>
                  <span className="text-gray-900">
                    {user.emailVerified ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-red-500" />
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === "online"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.status === "online" ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && relationship === RELATIONSHIP.SELF && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsEditing(false)}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative"
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Edit Profile
            </h2>

            {/* Image Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden mb-4">
                {editForm.image ? (
                  <img
                    src={editForm.image}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <PhotoIcon className="w-10 h-10" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="profile-image-upload"
              />
              <label
                htmlFor="profile-image-upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
              >
                Change Photo
              </label>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength="50"
                placeholder="Your name"
              />
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-1">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Tell us about yourself..."
                maxLength="200"
              />
            </div>

            {/* Save/Cancel */}
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
