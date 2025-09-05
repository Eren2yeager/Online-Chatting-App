"use client";

import { PhotoIcon, CalendarIcon, UserGroupIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function OverviewTab({
  chat,
  groupStats = {},
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
  inviteLink,
  handleLeaveGroup,
  isGroup = true,
  otherUser,
}) {
  const router = useRouter();

  // 1:1 Chat: Professional, detailed profile card
  if (!isGroup && otherUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-10 bg-gradient-to-br from-blue-50 to-white">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg px-10 py-10 w-full max-w-lg flex flex-col items-center">
          <div className="relative mb-6">
            <div className="h-32 w-32 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-4 border-blue-200 shadow">
              {otherUser.image ? (
                <div
                  className="h-full w-full rounded-full object-cover bg-center bg-cover"
                  style={{
                    backgroundImage: `url('${otherUser.image}')`,
                  }}
                  aria-label={otherUser.name || "User"}
                />
              ) : (
                <span className="text-4xl text-gray-400 font-bold">
                  {otherUser.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
          </div>
          <div className="text-center w-full">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {otherUser.name || "Unknown"}
            </div>
            {otherUser.handle && (
              <div className="text-base text-blue-600 font-mono mb-1">
                @{otherUser.handle}
              </div>
            )}
            {otherUser.status && (
              <div className="inline-flex items-center gap-1 text-sm text-green-600 mb-2">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                {otherUser.status}
              </div>
            )}
            <div className="flex flex-col items-center gap-2 mt-4">
              {/* Add more details if available */}
              {otherUser.bio && (
                <div className="text-gray-700 text-sm italic max-w-xs mb-2">
                  {otherUser.bio}
                </div>
              )}
              {otherUser.email && (
                <div className="text-gray-500 text-xs">
                  <span className="font-medium">Email:</span> {otherUser.email}
                </div>
              )}
              {otherUser.location && (
                <div className="text-gray-500 text-xs">
                  <span className="font-medium">Location:</span> {otherUser.location}
                </div>
              )}
            </div>
            <div className="mt-6">
              {otherUser.handle && (
                <span
                  onClick={() => router.push(`/profile/${otherUser.handle}`)}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors text-base"
                >
                  <ShieldCheckIcon className="w-5 h-5" />
                  See Profile
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group Chat: Professional, centered, detailed group info/settings
  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8 tracking-tight">
          {isGroup ? "Group Information" : "Chat Information"}
        </h3>

        {/* Group Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex items-center justify-center w-40 h-40 mb-2">
            {editForm.image ? (
              <div
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-200 shadow bg-center bg-cover"
                style={{
                  backgroundImage: `url('${editForm.image}')`,
                }}
                aria-label="Group"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center border-4 border-blue-100 shadow">
                <PhotoIcon className="w-16 h-16 text-gray-300" />
              </div>
            )}
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
                  className="absolute bottom-3 right-3 bg-blue-600 text-white rounded-full p-3 shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  style={{ lineHeight: 0 }}
                  title="Change group image"
                >
                  <PhotoIcon className="w-6 h-6" />
                </label>
              </>
            )}
          </div>
          <div className="text-lg font-semibold text-gray-800 mt-2">
            {editForm.name}
          </div>
        </div>

        {/* Group Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="flex flex-col items-center bg-blue-50 rounded-xl p-5 shadow">
            <UserGroupIcon className="w-7 h-7 text-blue-500 mb-1" />
            <div className="text-xl font-bold text-blue-700">{groupStats.totalMembers}</div>
            <div className="text-xs text-gray-600">Members</div>
          </div>
          <div className="flex flex-col items-center bg-purple-50 rounded-xl p-5 shadow">
            <ShieldCheckIcon className="w-7 h-7 text-purple-500 mb-1" />
            <div className="text-xl font-bold text-purple-700">{groupStats.totalAdmins}</div>
            <div className="text-xs text-gray-600">Admins</div>
          </div>
          <div className="flex flex-col items-center bg-green-50 rounded-xl p-5 shadow">
            <span className="inline-block w-7 h-7 rounded-full bg-green-400 mb-1" />
            <div className="text-xl font-bold text-green-700">{groupStats.onlineMembers}</div>
            <div className="text-xs text-gray-600">Online</div>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-xl p-5 shadow">
            <CalendarIcon className="w-7 h-7 text-gray-400 mb-1" />
            <div className="text-xl font-bold text-gray-700">{groupStats.createdDate}</div>
            <div className="text-xs text-gray-600">Created</div>
          </div>
        </div>

        {/* Group Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Group Settings</h4>
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Group Name</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full text-black p-3 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-200"
              disabled={!isGroup || !isAdmin}
              placeholder={isGroup && isAdmin ? "Enter group name" : "Only admins can change"}
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full text-black p-3 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-200"
              rows={3}
              disabled={!isGroup || !isAdmin}
              placeholder={isGroup && isAdmin ? "Enter group description" : "Only admins can change"}
            />
          </div>
          {/* Privacy */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Privacy</label>
            <select
              value={editForm.privacy}
              onChange={(e) => setEditForm({ ...editForm, privacy: e.target.value })}
              className="w-full text-black p-3 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-200"
              disabled={!isAdmin}
            >
              <option value="admin_only">Only admins can invite</option>
              <option value="member_invite">Members can invite</option>
            </select>
          </div>
          {/* Save Button */}
          {isGroup && isAdmin && (
            <button
              onClick={saveSettings}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold text-lg hover:bg-blue-700 transition-colors shadow"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          )}
          {/* Invite Link */}
          {isGroup && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Invite Link</h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 p-3 border border-gray-200 rounded-lg text-base bg-gray-50"
                  placeholder="Generating invite link..."
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                  }}
                  className="px-5 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          {/* Leave Group */}
          {isGroup && !isCreator && (
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleLeaveGroup}
                disabled={loading}
                className="w-full px-6 py-3 text-red-600 border border-red-200 rounded-lg font-semibold hover:bg-red-50 transition-colors shadow"
              >
                Leave Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}