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
} from "@heroicons/react/24/outline";
// Add icon (UserPlusIcon) and circle tick icon (CheckCircleIcon) from Heroicons
import { UserPlusIcon } from "@heroicons/react/24/outline";

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

export default function ProfileByHandlePage() {
  const params = useParams();
  const router = useRouter();
  const { handle } = params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // New state for current user and friendship status
  const [currentUser, setCurrentUser] = useState(null);
  const [isFriend, setIsFriend] = useState(false);

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

  // Check friendship status when both users are loaded
  useEffect(() => {
    if (!user || !currentUser) {
      setIsFriend(false);
      return;
    }
    // Check if the viewed user is in the current user's friends list
    // Friends can be array of objects or ids, so check both
    const friendIds = (currentUser.friends || []).map(f =>
      typeof f === "string" ? f : f._id
    );
    setIsFriend(friendIds.includes(user._id));
  }, [user, currentUser]);

  const copyProfileHandle = () => {
    navigator.clipboard.writeText(`@${user.handle}`);
    toast.success("Profile handle copied to clipboard!");
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/invite/${user.handle}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
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
        navigator.clipboard.writeText(profileUrl);
        toast.success("Profile link copied!");
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied!");
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

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
          <div className="px-3 py-1 max-w-fit mx-auto bg-blue-100 text-blue-800 text-sm font-medium rounded-full truncate mb-2">
            @{user.handle}
          </div>
          <p className="text-gray-600">{user.email}</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-6">
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
                <div className="mt-3 text-gray-500 text-sm">
                  Last Online: {dateFormatter(user.lastSeen)}
                </div>
              </div>
              {/* Bio Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2" />
                  Bio
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {user.bio || "No bio added yet."}
                </p>
              </div>
              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-6 mb-6">
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
                {/* Friend status or add friend button */}
                <div className="text-center p-4 bg-green-50 rounded-lg flex flex-col items-center justify-center">
                  {currentUser && user._id === currentUser._id ? (
                    // Viewing own profile, show nothing
                    <div className="text-sm text-green-600">Your Profile</div>
                  ) : isFriend ? (
                    <>
                      <div className="flex items-center justify-center text-2xl font-bold text-green-600"
                            onClick={() => router.push(`/friends`)}
                      >
                        <CheckCircleIcon className="w-7 h-7 mr-1" />
                      </div>
                  
                    </>
                  ) : (
                    <button
                      onClick={() => router.push(`/invite/${handle}`)}
                      className="text-white p-4  rounded-full font-medium  transition-colors flex items-center justify-center"
                    >
                      <UserPlusIcon className="w-5 h-5 text-green-600" />
                     
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-80 space-y-6"
          >
            {/* Profile Sharing Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <QrCodeIcon className="w-5 h-5 mr-2" />
                Share Profile
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Profile handle:
                </div>
                <div className="font-mono text-lg font-bold text-gray-900 flex items-center justify-between">
                  <span
                    className="truncate max-w-[10rem] sm:max-w-[14rem] md:max-w-[18rem] lg:max-w-[22rem] block"
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
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  {showQR ? "Hide QR" : "Show QR"}
                </button>
                {showQR && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 p-4 bg-white border rounded-lg"
                >
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
                </motion.div>
              )}
                <button
                  onClick={shareProfile}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Share Profile
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
                    {dateFormatter(user.createdAt)}
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
