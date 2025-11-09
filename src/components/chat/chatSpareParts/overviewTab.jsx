"use client";

import { motion } from "framer-motion";
import { 
  PhotoIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  ClipboardDocumentIcon 
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Button, Avatar, Badge } from "@/components/ui";
import { useToast } from "@/components/layout/ToastContext";

export default function OverviewTab({
  chat,
  groupStats = {},
  editForm,
  setEditForm,
  imageFile,
  handleImageChange,
  saveSettings,
  loading,
  error,
  isAdmin,
  isCreator,
  participants,
  admins,
  inviteLink,
  handleLeaveGroup,
  isGroup = true,
  otherUser,
}) {
  const router = useRouter();
  const showToast = useToast();

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showToast({ text: "Invite link copied!" });
  };

  // 1:1 Chat: Modern profile card
  if (!isGroup && otherUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] py-10"
      >
        <div className="px-10 py-10 w-full max-w-lg flex flex-col items-center">
          {/* Avatar with gradient ring */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="relative mb-6"
          >
            <Avatar
              src={otherUser.image}
              alt={otherUser.name}
              size="2xl"
              status={otherUser.status}
            />
          </motion.div>

          {/* User Info */}
          <div className="text-center w-full">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {otherUser.name || "Unknown"}
            </h2>
            
            {otherUser.handle && (
              <p className="text-lg text-blue-600 font-mono mb-3">
                @{otherUser.handle}
              </p>
            )}

            {otherUser.status && (
              <Badge variant="success" className="mb-4">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block mr-1" />
                {otherUser.status}
              </Badge>
            )}

            {otherUser.bio && (
              <p className="text-gray-600 text-sm italic max-w-xs mx-auto mb-4 px-4">
                {otherUser.bio}
              </p>
            )}

            {/* Additional Info */}
            <div className="space-y-2 mb-6">
              {otherUser.email && (
                <p className="text-gray-500 text-sm">
                  <span className="font-medium">Email:</span> {otherUser.email}
                </p>
              )}
              {otherUser.location && (
                <p className="text-gray-500 text-sm">
                  <span className="font-medium">Location:</span> {otherUser.location}
                </p>
              )}
            </div>

            {/* View Profile Button */}
            {otherUser.handle && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push(`/profile/${otherUser.handle}`)}
                icon={<ShieldCheckIcon className="w-5 h-5" />}
              >
                View Profile
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Group Chat: Modern group info/settings
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-full max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center mb-8">
          Group Information
        </h3>

        {/* Group Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              {editForm.image ? (
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-500 to-purple-600 shadow-xl">
                  <img
                    src={editForm.image}
                    alt="Group"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-xl">
                  <PhotoIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </motion.div>

            {isGroup && isAdmin && (
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
                  className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all"
                >
                  <PhotoIcon className="w-5 h-5" />
                </label>
              </>
            )}
          </div>
          
          <h4 className="text-xl font-semibold text-gray-800 mt-4">
            {editForm.name}
          </h4>
        </div>

        {/* Group Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 shadow-md"
          >
            <UserGroupIcon className="w-8 h-8 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-blue-700">{groupStats.totalMembers}</div>
            <div className="text-xs text-gray-600">Members</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 shadow-md"
          >
            <ShieldCheckIcon className="w-8 h-8 text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-purple-700">{groupStats.totalAdmins}</div>
            <div className="text-xs text-gray-600">Admins</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 shadow-md"
          >
            <span className="inline-block w-8 h-8 rounded-full bg-green-500 mb-2" />
            <div className="text-2xl font-bold text-green-700">{groupStats.onlineMembers}</div>
            <div className="text-xs text-gray-600">Online</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 shadow-md"
          >
            <CalendarIcon className="w-8 h-8 text-gray-600 mb-2" />
            <div className="text-xl font-bold text-gray-700">{groupStats.createdDate}</div>
            <div className="text-xs text-gray-600">Created</div>
          </motion.div>
        </div>

        {/* Group Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-5"
        >
          <h4 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Group Settings
          </h4>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full text-black px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={!isGroup || !isAdmin}
              placeholder={isGroup && isAdmin ? "Enter group name" : "Only admins can change"}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full text-black px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
              disabled={!isGroup || !isAdmin}
              placeholder={isGroup && isAdmin ? "Enter group description" : "Only admins can change"}
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy
            </label>
            <select
              value={editForm.privacy}
              onChange={(e) => setEditForm({ ...editForm, privacy: e.target.value })}
              className="w-full text-black px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={!isAdmin}
            >
              <option value="admin_only">Only admins can invite</option>
              <option value="member_invite">Members can invite</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Save Button */}
          {isGroup && isAdmin && (
            <Button
              variant="primary"
              size="lg"
              onClick={saveSettings}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          )}

          {/* Invite Link */}
          {isGroup && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Invite Link
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                {chat.privacy === "admin_only" 
                  ? "Share this link to let people request to join (requires admin approval)"
                  : "Share this link to let anyone join instantly"}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-4 py-3 border text-purple-700 border-gray-200 rounded-xl bg-gray-50 text-sm"
                  placeholder="Generating invite link..."
                />
                <Button
                  variant="success"
                  onClick={copyInviteLink}
                  icon={<ClipboardDocumentIcon className="w-5 h-5" />}
                  className="p-1"
                ><span className="hidden md:inline">

                  Copy
                </span>
                </Button>
              </div>
            </div>
          )}

          {/* Leave Group */}
          {isGroup && !isCreator && (
            <div className="pt-4 border-t border-gray-100">
              <Button
                variant="danger"
                size="lg"
                onClick={handleLeaveGroup}
                disabled={loading}
                className="w-full"
              >
                Leave Group
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
