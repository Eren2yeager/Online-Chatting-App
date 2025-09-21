import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCrown } from "react-icons/fa";
// Removed: import Image from "next/image";

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

export default function MembersTab({
  participants,
  memberSearch,
  setMemberSearch,
  handleRemoveMember,
  isAdmin,
  isCreator,
  chat,
  admins = [],
  friends,
  search,
  setSearch,
  handleAddMembers,
  currentMemberIds,
  loading,
  error,
  onPromoteDemoteApi,
  handlePromoteAdmin,
  handleDemoteAdmin,
}) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAdminUser = (userId) =>
    admins?.length
      ? admins.some((a) => a._id === userId)
      : (chat?.admins || []).some((a) => a._id === userId);

  const confirmAddMembers = async () => {
    if (selectedIds.size === 0) return;
    await handleAddMembers(Array.from(selectedIds));
    setSelectedIds(new Set());
    setAddDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Members ({participants.length})
        </h3>
        {(isAdmin || chat?.privacy === "member_invite") && (
          <button
            onClick={() => setAddDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlusIcon className="h-4 w-4 inline font-bold" />
            <span className="hidden  ml-2 md:block">Add Members</span>
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

      {/* Members List with role badges and actions */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {participants.map((p) => {
          const isCreatorFlag = chat?.createdBy?._id === p._id;
          const isAdminFlag = isAdminUser(p._id);
          return (
            <div
              key={p._id}
              className="flex flex-col sm:flex-row gap-2  justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <span className="text-sm text-gray-600">
                      {p.name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {p.name}
                  </div>
                  <div className="text-xs text-gray-500">@{p.handle}</div>
                  {p.status && (
                    <div className="text-xs text-green-600">{p.status}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isCreatorFlag ? (
                  <span className="px-2 py-1 text-xs rounded-md text-gray-500 border border-gray-200 bg-gray-50 flex items-center">
                    <FaCrown className="h-3 w-3 mr-1" />
                    Creator
                  </span>
                ) : isAdminFlag ? (
                  <span className="px-2 py-1 text-xs rounded-md text-blue-500 border border-blue-200 bg-blue-50 flex items-center">
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    Admin
                  </span>
                ) : null}
                {isCreator && !isCreatorFlag &&
                  (isAdminFlag ? (
                    <button
                      onClick={() => handleDemoteAdmin(p._id)}
                      disabled={loading}
                      className="px-2 py-1 text-xs rounded-md text-red-700 border border-red-200 hover:bg-red-50"
                    >
                      Demote
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePromoteAdmin(p._id)}
                      disabled={loading}
                      className="px-2 py-1 text-xs rounded-md text-green-700 border border-green-200 hover:bg-green-50"
                    >
                      Promote
                    </button>
                  ))}
                {isAdmin && !isCreatorFlag && (
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

      {/* Multi-select Add Members Dialog */}
      {(isAdmin || chat?.privacy === "member_invite") && addDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setAddDialogOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-semibold text-gray-800">
                Add friends
              </h4>
              <button
                onClick={() => setAddDialogOpen(false)}
                className="p-2 rounded hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search friends..."
                className="w-full  text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {friends.map((f) => {
                const isMember = currentMemberIds.has(f._id);
                const checked = selectedIds.has(f._id);
                return (
                  <label
                    key={f._id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isMember
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        disabled={isMember}
                        checked={checked}
                        onChange={() => toggleSelect(f._id)}
                        className="h-4 w-4"
                      />
                      <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {f.image ? (
                          <img
                            src={f.image}
                            alt={f.name}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                            style={{ objectFit: "cover" }}
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
                    {isMember && (
                      <span className="text-xs text-gray-400">
                        Already member
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {error && (
              <div className="text-xs text-red-600 mt-3">{error}</div>
            )}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setAddDialogOpen(false)}
                className="px-3 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddMembers}
                disabled={loading || selectedIds.size === 0}
                className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              >
                Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
