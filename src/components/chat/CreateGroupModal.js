'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

/**
 * Modal for creating group chats
 */
export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const { data: session } = useSession();
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
      
      if (data.success) {
        setFriends(data.data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
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

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isGroup: true,
          name: groupName.trim(),
          participants: selectedFriends.map(friend => friend._id),
        }),
      });

      const data = await response.json();

      if (data.success) {
        onGroupCreated(data.data);
        handleClose();
      } else {
        setError(data.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group');
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
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f._id === friend._id);
      if (isSelected) {
        return prev.filter(f => f._id !== friend._id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-transparent backdrop-blur-xs bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Create Group Chat
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Group Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={50}
                />
              </div>

              {/* Search Friends */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Friends ({selectedFriends.length} selected)
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Friends List */}
              <div className="max-h-64 overflow-y-auto">
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No friends found</p>
                    <p className="text-sm">Add friends to create group chats</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => {
                      const isSelected = selectedFriends.some(f => f._id === friend._id);
                      
                      return (
                        <button
                          key={friend._id}
                          onClick={() => toggleFriendSelection(friend)}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {friend.image ? (
                              <img
                                src={friend.image}
                                alt={friend.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm text-gray-500">
                                {friend.name?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900">
                              {friend.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{friend.handle}
                            </div>
                          </div>
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={loading || !groupName.trim() || selectedFriends.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
