'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon, UserGroupIcon, UserPlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ManageMembersModal({ isOpen, onClose, chat, onUpdated }) {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/users/friends');
      const data = await res.json();
      if (data.success) {
        setFriends(data.data);
      } else {
        setFriends([]);
      }
    } catch {
      setFriends([]);
    }
  };

  const currentMemberIds = useMemo(() => new Set(chat?.participants?.map(p => p._id) || []), [chat]);

  const filteredFriends = useMemo(() => {
    const q = search.toLowerCase();
    return friends.filter(f =>
      (f.name || '').toLowerCase().includes(q) || (f.handle || '').toLowerCase().includes(q)
    );
  }, [friends, search]);

  const handleAddMembers = async (userIds) => {
    if (!userIds.length) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/chats/${chat._id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdated?.(data.data);
      } else {
        setError(data.error || 'Failed to add members');
      }
    } catch (e) {
      setError('Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/chats/${chat._id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdated?.(data.data);
      } else {
        setError(data.error || 'Failed to remove member');
      }
    } catch (e) {
      setError('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-xs bg-opacity-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Manage Members</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              {/* Current Members */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Members</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {(chat?.participants || []).map((p) => (
                    <div key={p._id} className="flex items-center justify-between p-2 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-600">{p.name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">@{p.handle}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(p._id)}
                        disabled={loading}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-700 rounded-md hover:bg-red-50 flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Friends */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Friends</h3>
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredFriends.map((f) => {
                    const isMember = currentMemberIds.has(f._id);
                    return (
                      <div key={f._id} className={`flex items-center justify-between p-2 rounded-lg border ${isMember ? 'border-gray-200 bg-gray-50' : 'border-gray-200'}`}>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                            {f.image ? (
                              <img src={f.image} alt={f.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs text-gray-600">{f.name?.charAt(0) || 'U'}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{f.name}</div>
                            <div className="text-xs text-gray-500">@{f.handle}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMembers([f._id])}
                          disabled={loading || isMember}
                          className={`px-2 py-1 text-xs rounded-md flex items-center ${isMember ? 'text-gray-400 border border-gray-200 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-50'}`}
                        >
                          <UserPlusIcon className="h-4 w-4 mr-1" /> {isMember ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {error && <div className="text-xs text-red-600 mt-3">{error}</div>}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Close</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


