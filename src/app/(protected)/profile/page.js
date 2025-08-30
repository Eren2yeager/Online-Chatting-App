"use client";

import { useState, useEffect , useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UserIcon,
  PencilIcon,
  QrCodeIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  ClipboardDocumentIcon
} from "@heroicons/react/24/outline";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import dateFormatter from "@/functions/dateFormattor";
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const  [uploading, setUploading] = useState(false);
  const imageRef = useRef()
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchUserProfile();
    }
  }, [session]);

  const copyProfileHandle = () => {
    navigator.clipboard.writeText(`@${user.handle}`);
    toast.success("Profile handle copied to clipboard!");
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/profile`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setEditForm({
          name: userData.name || "",
          bio: userData.bio || "",
          image: userData.image || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
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

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.url;
    } else {
      throw new Error("Failed to upload image");
    }
  };

  const handleSave = async () => {
    try {
      setUploading(true);

      let imageUrl = editForm.image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          image: imageUrl,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        setImageFile(null);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  const shareProfile = async () => {
    const profileUrl = `${window.location.origin}/invite/${user.handle}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Add ${user.name} as a friend`,
          text: `Scan my QR code or use my handle: @${user.handle}`,
          url: profileUrl,
        });
      } catch (error) {
        console.log("Error sharing:", error);
        copyProfileLink();
      }
    } else {
      copyProfileLink();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Avatar Section */}
              <div className="flex flex-col md:flex-row items-center space-x-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-12 h-12" />
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${
                      user.status === "online" ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                </div>

                <div className="flex-1 min-w-0 self-start ">
                  <div className="flex flex-col justify-center space-x-3 mb-2">
                    <h2
                      className="text-2xl font-bold text-gray-900 truncate"
                      title={user.name}
                    >
                      {user.name}
                    </h2>
                    <div
                      className="px-3 py-1 max-w-fit bg-blue-100 text-blue-800 text-sm font-medium rounded-full truncate"
                      title={`@${user.handle}`}
                    >
                      @{user.handle}
                    </div>
                  </div>
                  <p
                    className="text-gray-600 mb-2 truncate max-w-xs"
                    title={user.email}
                  >
                    {user.email}
                  </p>
                  <div className="flex items-center space-x-4 min-w-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full max-w-fit truncate text-xs font-medium ${
                        user.status === "online"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.status === "online" ? "Online" : "Offline"}
                    </span>
                    <span
                      className="text-sm text-gray-500 truncate max-w-xs"
                      title={dateFormatter(new Date(user.lastSeen))}
                    >
                      Last Online: {dateFormatter(new Date(user.lastSeen))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2" />
                  Bio
                </h3>
                {isEditing ? (
                  <></>
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {user.bio || "No bio added yet. Click edit to add one!"}
                  </p>
                )}
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {user.friends?.length || 0}
                  </div>
                  <div className="text-sm text-blue-600">Friends</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {user.blocked?.length || 0}
                  </div>
                  <div className="text-sm text-purple-600">Blocked</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {user.emailVerified ? "✓" : "✗"}
                  </div>
                  <div className="text-sm text-green-600">Verified</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                {isEditing ? null : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Edit Profile Dialog */}
          {isEditing && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-xs bg-opacity-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              onClick={() => {
                setIsEditing(false);
              }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 40 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                layout
                onClick={(e) => {
                  // Keep clicks inside from closing the modal, but do not prevent default
                  // so label->input interaction (file picker) continues to work.
                  e.stopPropagation();
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 90, color: "#1e293b" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsEditing(false);
                    setImageFile(null);
                    setEditForm({
                      name: user.name || "",
                      bio: user.bio || "",
                      image: user.image || "",
                    });
                  }}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                  aria-label="Close"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <motion.path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </svg>
                </motion.button>
                <motion.h2
                  className="text-2xl font-bold text-gray-900 mb-6 text-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Edit Profile
                </motion.h2>
                {/* Image Upload */}
                <motion.div
                  className="flex flex-col items-center mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden mb-2 shadow-lg"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 0 0 4px #a78bfa44",
                    }}
                  >
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
                      >
                        <PhotoIcon className="w-10 h-10" />
                      </motion.div>
                    )}
                  </motion.div>
                  <div className="relative w-fit">


                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="dialog-image-upload"
                    />
                  <label
                    htmlFor="dialog-image-upload"
                    className="absolute bottom-0  bg-blue-600 text-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    style={{ lineHeight: 0 }}
                    >
                    <PhotoIcon className="w-6 h-6" />
                  </label>
                    </div>

                </motion.div>
                {/* Name */}
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  <label
                    className="block text-gray-700 font-medium mb-1"
                    htmlFor="edit-name"
                  >
                    Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength="50"
                    placeholder="Your name"
                  />
                </motion.div>
                {/* Bio */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.21 }}
                >
                  <label
                    className="block text-gray-700 font-medium mb-1"
                    htmlFor="edit-bio"
                  >
                    Bio
                  </label>
                  <textarea
                    id="edit-bio"
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Tell us about yourself..."
                    maxLength="200"
                  />
                </motion.div>
                {/* Save/Cancel */}
                <motion.div
                  className="flex space-x-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <motion.button
                    onClick={handleSave}
                    disabled={uploading}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    whileHover={
                      !uploading
                        ? { scale: 1.04, backgroundColor: "#2563eb" }
                        : {}
                    }
                    whileTap={!uploading ? { scale: 0.97 } : {}}
                  >
                    {uploading ? (
                      <>
                        <motion.div
                          className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            ease: "linear",
                          }}
                        ></motion.div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setIsEditing(false);
                      setImageFile(null);
                      setEditForm({
                        name: user.name || "",
                        bio: user.bio || "",
                        image: user.image || "",
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                    whileHover={{ scale: 1.04, backgroundColor: "#d1d5db" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Profile Sharing Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <QrCodeIcon className="w-5 h-5 mr-2" />
                Share Profile
              </h3>
              <div className="font-mono text-lg font-bold text-gray-900 my-2 flex items-center justify-between">
                  <span
                    className="truncate max-w-[10rem] sm:max-w-[14rem] md:max-w-[18rem] lg:max-w-[22rem] block  bg-gray-200 rounded-lg px-2"
                    title={`@${user.handle}`}
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    @{user.handle}
                  </span>
                  <button
                    onClick={copyProfileHandle}
                    className="ml-2 bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    style={{ minWidth: 0 }}
                  >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  </button>
                </div>
              <div className="space-y-3">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  {showQR ? "Hide QR" : "Show QR"}
                </button>
                <button
                  onClick={shareProfile}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Share Profile
                </button>
              </div>

              {showQR && (
                <div className="mt-4 p-4 bg-white border rounded-lg">
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={`${window.location.origin}/invite/${user.handle}`}
                      size={128}
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Scan to add as friend
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/friends")}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <UserGroupIcon className="w-5 h-5 mr-3 text-blue-600" />
                  Manage Friends
                </button>
                <button
                  onClick={() => router.push("/chats")}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <GlobeAltIcon className="w-5 h-5 mr-3 text-green-600" />
                  View Chats
                </button>
                <button
                  onClick={() => router.push("/settings")}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ShieldExclamationIcon className="w-5 h-5 mr-3 text-purple-600" />
                  Privacy Settings
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since:</span>
                  <span className="text-gray-900 font-medium">
                    {dateFormatter(new Date(user.createdAt))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Email verified:</span>
                  <span className="text-gray-900">
                    {user.emailVerified ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-red-500" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
