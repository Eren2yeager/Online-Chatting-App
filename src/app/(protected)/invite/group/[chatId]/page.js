'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  UserGroupIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  UsersIcon,
  PhotoIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/layout/ToastContext";
import { useSocketEmitter } from "@/lib/socket";
import { Loader } from "@/components/ui";
export default function GroupInvitePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { chatId } = params;
  const toast = useToast();
  const { emitAck } = useSocketEmitter();

  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState(null); // 'success', 'pending', 'error', 'already_member'

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated" && chatId) {
      fetchChatDetails();
    }
  }, [status, chatId]);

  const fetchChatDetails = async () => {
    try {
      const response = await fetch(`/api/chats/${chatId}/invite-info`);
      if (response.ok) {
        const data = await response.json();
        setChat(data.chat);

        // Check if user is already a member
        if (data.isMember) {
          setJoinStatus("already_member");
        }
      } else {
        const error = await response.json();
        toast({ text: error.message || "Group not found" });
        router.push("/chats");
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
      toast({ text: "Failed to load group details" });
      router.push("/chats");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!chat || !session?.user?.id) return;

    try {
      setJoining(true);

      // Use socket event to join group
      const res = await emitAck("chat:member:add:via-invite", {
        chatId: chat._id,
        userId: session.user.id,
      });

      if (res?.success) {
        if (res.requiresApproval) {
          setJoinStatus("pending");
          toast({ text: "Join request sent! Waiting for admin approval." });
        } else {
          setJoinStatus("success");
          toast({ text: "Successfully joined the group!" });

          // Redirect to chat after a short delay
          setTimeout(() => {
            router.push(`/chats/${chat._id}`);
          }, 2000);
        }
      } else {
        setJoinStatus("error");
        toast({ text: res?.error || "Failed to join group" });
      }
    } catch (error) {
      console.error("Error joining group:", error);
      setJoinStatus("error");
      toast({ text: "Failed to join group" });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
        <Loader />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Group Not Found
          </h1>
          <button
            onClick={() => router.push("/chats")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Chats
          </button>
        </div>
      </div>
    );
  }

  const requiresApproval = chat.privacy === "admin_only";

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => router.push("/chats")}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-white/50"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Join Group
            </h1>
          </div>
          <p className="text-gray-600">
            You&apos;ve been invited to join this group
          </p>
        </motion.div>

        {/* Group Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6"
        >
          {/* Group Header with Image */}
          <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600">
            {chat.image ? (
              <img
                src={chat.image}
                alt={chat.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserGroupIcon className="w-24 h-24 text-white/80" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>

          {/* Group Avatar Overlay */}
          <div className="relative px-8 pb-8">
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {chat.image ? (
                  <img
                    src={chat.image}
                    alt={chat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserGroupIcon className="w-16 h-16 text-white" />
                )}
              </div>
            </div>

            <div className="pt-20 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {chat.name}
              </h2>

              {chat.description && (
                <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                  {chat.description}
                </p>
              )}

              {/* Group Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4"
                >
                  <UsersIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-700">
                    {chat.participants?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Members</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4"
                >
                  <ShieldCheckIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-700">
                    {chat.admins?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Admins</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 col-span-2 md:col-span-1"
                >
                  {requiresApproval ? (
                    <>
                      <LockClosedIcon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                      <div className="text-sm font-bold text-indigo-700">
                        Admin Approval
                      </div>
                      <div className="text-xs text-gray-600">Required</div>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-bold text-green-700">
                        Open to Join
                      </div>
                      <div className="text-xs text-gray-600">
                        No approval needed
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Join Status / Action */}
        {joinStatus === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-3xl p-8 text-center shadow-xl"
          >
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              Welcome to the Group!
            </h3>
            <p className="text-green-700 mb-6">
              You&apos;ve successfully joined {chat.name}. Redirecting you to
              the chat...
            </p>
            <button
              onClick={() => router.push(`/chats/${chat._id}`)}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              Go to Chat Now
            </button>
          </motion.div>
        ) : joinStatus === "pending" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-3xl p-8 text-center shadow-xl"
          >
            <ClockIcon className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-yellow-900 mb-2">
              Request Sent!
            </h3>
            <p className="text-yellow-700 mb-6">
              Your request to join {chat.name} has been sent to the group
              admins. You&apos;ll be notified once they approve your request.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/chats")}
                className="bg-yellow-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-yellow-700 transition-all shadow-lg hover:shadow-xl"
              >
                Back to Chats
              </button>
            </div>
          </motion.div>
        ) : joinStatus === "already_member" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-3xl p-8 text-center shadow-xl"
          >
            <CheckCircleIcon className="w-20 h-20 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-blue-900 mb-2">
              Already a Member
            </h3>
            <p className="text-blue-700 mb-6">
              You&apos;re already a member of {chat.name}. Start chatting with
              your group!
            </p>
            <button
              onClick={() => router.push(`/chats/${chat._id}`)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Go to Chat
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl p-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              {requiresApproval ? "Request to Join" : "Join This Group"}
            </h3>

            {requiresApproval && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
                <LockClosedIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Admin Approval Required
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This is a private group.
                  </p>
                </div>
              </div>
            )}
            {!requiresApproval && (
              <div className="space-y-4">
                <button
                  onClick={handleJoinGroup}
                  disabled={joining}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {joining ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {requiresApproval ? "Sending Request..." : "Joining..."}
                    </>
                  ) : (
                    <>
                      <UserGroupIcon className="w-6 h-6 mr-2" />
                      {requiresApproval ? "Request to Join" : "Join Group"}
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.push("/chats")}
                  className="w-full bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Info Section */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6"
        >
          <h4 className="font-semibold text-gray-900 mb-4 text-center">
            What happens next?
          </h4>
          <div className="space-y-3 text-sm text-gray-600">
            {requiresApproval ? (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-xs">1</span>
                  </div>
                  <p>Your join request will be sent to the group admins</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-xs">2</span>
                  </div>
                  <p>Admins will review and approve or reject your request</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-xs">3</span>
                  </div>
                  <p>
                    You&apos;ll receive a notification once your request is
                    processed
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 font-bold text-xs">1</span>
                  </div>
                  <p>You&apos;ll be added to the group immediately</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 font-bold text-xs">2</span>
                  </div>
                  <p>Start chatting with other members right away</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 font-bold text-xs">3</span>
                  </div>
                  <p>All members will be notified of your arrival</p>
                </div>
              </>
            )}
          </div>
        </motion.div> */}
      </div>
    </div>
  );
}
