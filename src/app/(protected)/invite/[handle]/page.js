'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  UserIcon,
  UserPlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/layout/ToastContext";
import { Loader } from '@/components/ui';
export default function InviteHandlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { handle } = params;
  const toast = useToast();
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState(null); // 'pending', 'sent', 'error', 'accepted'

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated" && handle) {
      fetchTargetUser();
    }
    // eslint-disable-next-line
  }, [status, handle]);

  const fetchTargetUser = async () => {
    try {
      const response = await fetch(`/api/users/by-handle/${handle}`);
      if (response.ok) {
        const userData = await response.json();
        setTargetUser(userData);

        // Check if already friends or request exists
        checkExistingRelationship(userData._id);
      } else {
        toast({ text: "User not found" });
        router.push("/invite");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast({ text: "Failed to load user profile" });
    } finally {
      setLoading(false);
    }
  };

  // Function to check if the target user is already a friend
  const checkExistingRelationship = async (targetUserId) => {
    try {
      // Check if already friends
      const friendsRes = await fetch("/api/users/friends");
      if (friendsRes.ok) {
        
        const friendsData = await friendsRes.json();
        const friends = Array.isArray(friendsData) ? friendsData : (friendsData.data || []);
        let isFriend = false;
        if (Array.isArray(friends)) {
          isFriend = friends.some(friend => {
              return (friend._id.toString() ||  friend.toString()) === targetUserId.toString();
          });
        }
        if (isFriend) {
          setRequestStatus("accepted");
          return;
        }
      }

      // Check for pending requests (either direction)
      const requestsRes = await fetch("/api/friends/requests");
      if (requestsRes.ok) {
        const { incoming = [], outgoing = [] } = await requestsRes.json();
        const existingRequest =
          incoming.find((req) => req.from._id === targetUserId && req.status === "pending") ||
          outgoing.find((req) => req.to._id === targetUserId && req.status === "pending");
        if (existingRequest) {
          setRequestStatus("pending");
        }
      }
    } catch (error) {
      console.error("Error checking relationship:", error);
    }finally{
      console.log("status :" ,requestStatus)
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      toast({ text: "Please enter a message" });
      return;
    }

    try {
      setSending(true);
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: targetUser.handle,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setRequestStatus("sent");
        toast({ text: "Friend request sent successfully!" });
      } else {
        const error = await response.json();
        toast({ text: error.message || "Failed to send friend request" });
        setRequestStatus("error");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({ text: "Failed to send friend request" });
      setRequestStatus("error");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
           <Loader />
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            User Not Found
          </h1>
          <button
            onClick={() => router.push("/invite")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => router.push("/invite")}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Add Friend</h1>
          </div>
          <p className="text-gray-600">Send a friend request to connect</p>
        </motion.div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
              {targetUser.image ? (
                <img
                  src={targetUser.image}
                  alt={targetUser.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {targetUser.name}
            </h2>
            <p className="text-gray-600 mb-4">@{targetUser.handle}</p>

            {targetUser.bio && (
              <p className="text-gray-700 mb-6 bg-gray-50 p-4 rounded-lg">
                {targetUser.bio}
              </p>
            )}

            <div className="flex items-center justify-center space-x-4 mb-6">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  targetUser.status === "online"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {targetUser.status === "online" ? "Online" : "Offline"}
              </span>
              <span className="text-sm text-gray-500">
                {targetUser.friends?.length || 0} friends
              </span>
            </div>
          </div>
        </motion.div>

        {/* Friend Request Form */}
        {requestStatus === "sent" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
          >
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              Request Sent!
            </h3>
            <p className="text-green-700 mb-6">
              Your friend request has been sent to {targetUser.name}. They&apos;ll be
              notified and can accept or reject your request.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/friends")}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                View Friend Requests
              </button>
              <button
                onClick={() => router.push("/invite")}
                className="block w-full bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors border border-green-200"
              >
                Invite More Friends
              </button>
            </div>
          </motion.div>
        ) : requestStatus === "pending" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlusIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              Request Already Sent
            </h3>
            <p className="text-blue-700 mb-6">
              You already have a pending friend request with {targetUser.name}.
              Please wait for their response.
            </p>
            <button
              onClick={() => router.push("/friends")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View Friend Requests
            </button>
          </motion.div>
        ) : requestStatus === "accepted" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              Already Friends
            </h3>
            <p className="text-green-700 mb-6">
              You and {targetUser.name} are already friends! You can start
              chatting or view their profile.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/chats?friend=${targetUser._id}`)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Go to Chat
              </button>
              <button
                onClick={() => router.push(`/profile/${targetUser.handle}`)}
                className="block w-full bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors border border-green-200"
              >
                View Profile
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Send Friend Request
            </h3>

            <form onSubmit={sendFriendRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder={`Hi ${targetUser.name}! I&apos;d like to add you as a friend...`}
                  rows="4"
                  maxLength="200"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {message.length}/200 characters
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-5 h-5 mr-2" />
                      Send Request
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/chats")}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
