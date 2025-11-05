"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCrown } from "react-icons/fa";
import {
  XMarkIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import { Button, Avatar, Badge, Modal } from "@/components/ui";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Members ({participants.length})
        </h3>
        {(isAdmin || chat?.privacy === "member_invite") && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            icon={<UserPlusIcon className="h-4 w-4" />}
          >
            <span className="hidden md:inline">Add Members</span>
          </Button>
        )}
      </div>

      {/* Search Members */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-3 border text-black border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Members List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {participants.map((p, index) => {
            const isCreatorFlag = chat?.createdBy?._id === p._id;
            const isAdminFlag = isAdminUser(p._id);

            return (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col sm:flex-row gap-3 justify-between p-4 rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all bg-white"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={p.image}
                    alt={p.name}
                    size="md"
                    status={p.status}
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {p.name} 
                      <span className="pl-2">

                      {isCreatorFlag ? (
                        <Badge
                        variant="primary"
                        icon={<FaCrown className="h-3 w-3" />}
                        >
                          Creator
                        </Badge>
                      ) : isAdminFlag ? (
                        <Badge
                          variant="primary"
                          icon={<ShieldCheckIcon className="h-3 w-3" />}
                          >
                          Admin
                        </Badge>
                      ) : null}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">@{p.handle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCreator &&
                    !isCreatorFlag &&
                    (isAdminFlag ? (
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleDemoteAdmin(p._id)}
                        disabled={loading}
                      >
                        Demote
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="xs"
                        onClick={() => handlePromoteAdmin(p._id)}
                        disabled={loading}
                      >
                        Promote
                      </Button>
                    ))}

                  {isAdmin && !isCreatorFlag && (
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => handleRemoveMember(p._id)}
                      disabled={loading}
                      icon={<UserMinusIcon className="h-4 w-4" />}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Members Modal */}
      <Modal
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title="Add Friends"
        
      >
        <div className="space-y-4 p-5">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search friends..."
              className="w-full text-black pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Friends List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {friends.map((f) => {
              const isMember = currentMemberIds.has(f._id);
              const checked = selectedIds.has(f._id);

              return (
                <label
                  key={f._id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isMember
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                      : checked
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={isMember}
                      checked={checked}
                      onChange={() => toggleSelect(f._id)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <Avatar src={f.image} alt={f.name} size="sm" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {f.name}
                      </div>
                      <div className="text-xs text-gray-500">@{f.handle}</div>
                    </div>
                  </div>
                  {isMember && (
                    <Badge variant="secondary" size="sm">
                      Member
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setAddDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmAddMembers}
              disabled={loading || selectedIds.size === 0}
              className="flex-1"
            >
              Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
