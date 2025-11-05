'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useSocket } from '@/lib/socket';
import * as socketApi from '@/lib/client/socket-api';
import { Modal, ModalBody, ModalFooter, Input, Button, Avatar, Badge, toast } from '@/components/ui';

/**
 * Modern Create Group Modal Component
 */
export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && session) {
      fetchFriends();
    }
  }, [isOpen, session]);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/users/friends');
      const data = await response.json();
      if (Array.isArray(data)) {
        setFriends(data);
      } else if (Array.isArray(data?.data)) {
        setFriends(data.data);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
      toast.error('Failed to load friends');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedFriends.length === 0) {
      setError('Please select at least one friend');
      return;
    }

    if (!socket || !isConnected) {
      setError('Socket not connected. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await socketApi.createChat(socket, {
        isGroup: true,
        name: groupName.trim(),
        participants: selectedFriends.map((friend) => friend._id),
      });

      if (response && response.success) {
        toast.success('Group created successfully!');
        onGroupCreated(response.chat);
        handleClose();
      } else {
        setError(response?.error || 'Failed to create group');
        toast.error(response?.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError(error.message || 'Failed to create group');
      toast.error(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSearchQuery('');
    setSelectedFriends([]);
    setError('');
    onClose();
  };

  const toggleFriendSelection = (friend) => {
    setSelectedFriends((prev) => {
      const isSelected = prev.some((f) => f._id === friend._id);
      if (isSelected) {
        return prev.filter((f) => f._id !== friend._id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const filteredFriends = friends.filter((friend) => {
    const name = (friend.name || '').toLowerCase();
    const handle = (friend.handle || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || handle.includes(query);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <span>Create Group Chat</span>
        </div>
      }
      size="md"
    >
      <ModalBody className="space-y-6">
        {/* Group Name Input */}
        <Input
          label="Group Name"
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name..."
          maxLength={50}
          error={error && !groupName.trim() ? 'Group name is required' : ''}
          className="text-black"
        />

        {/* Selected Friends Badge */}
        {selectedFriends.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFriends.map((friend) => (
              <Badge
                key={friend._id}
                variant="primary"
                className="flex items-center gap-2 px-3 py-1.5"
              >
                <Avatar src={friend.image} alt={friend.name} size="xs" />
                <span>{friend.name}</span>
                <button
                  onClick={() => toggleFriendSelection(friend)}
                  className="ml-1 hover:text-white/80"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search Friends */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Friends ({selectedFriends.length} selected)
          </label>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            icon={<MagnifyingGlassIcon className="h-5 w-5" />}
            iconPosition="left"
            className="text-black"
          />
        </div>

        {/* Friends List */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No friends found</p>
              <p className="text-sm text-gray-500 mt-1">
                Add friends to create group chats
              </p>
            </div>
          ) : (
            filteredFriends.map((friend, index) => {
              const isSelected = selectedFriends.some((f) => f._id === friend._id);

              return (
                <motion.button
                  key={friend._id}
                  type="button"
                  onClick={() => toggleFriendSelection(friend)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  // whileHover={{ scale: 1.01 }}
                  // whileTap={{ scale: 0.98 }}
                >
                  <Avatar
                    src={friend.image}
                    alt={friend.name}
                    size="md"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">
                      {friend.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{friend.handle}
                    </div>
                  </div>
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
                        : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <CheckIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 border border-red-200 rounded-xl"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          variant="ghost"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleCreateGroup}
          loading={loading}
          disabled={!groupName.trim() || selectedFriends.length === 0}
        >
          Create Group
        </Button>
      </ModalFooter>
    </Modal>
  );
}
