'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import { useCall } from '@/contexts/CallContext';
import { Avatar } from '@/components/ui';

/**
 * Modal to add participants from friends list
 * insideContainer: use absolute positioning (for fullscreen call window)
 */
export default function AddParticipantsModal({ isOpen, onClose, insideContainer = true }) {
  const { addParticipant, currentCall } = useCall();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentParticipantIds = currentCall?.participants?.map(
    (p) => String(p.userId?._id ?? p.userId)
  ) ?? [];

  useEffect(() => {
    if (isOpen) {
      setError('');
      fetch('/api/users/friends')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setFriends(data.data || []);
        })
        .catch(() => setFriends([]));
    }
  }, [isOpen]);

  const availableFriends = friends.filter(
    (f) => !currentParticipantIds.includes(String(f._id))
  );

  const handleAdd = async (friendId) => {
    setLoading(true);
    setError('');
    try {
      addParticipant(String(friendId));
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const overlayClass = insideContainer
    ? 'absolute inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl'
    : 'fixed inset-0 z-[60] flex items-center justify-center bg-black/50';

  return (
    <div
      className={overlayClass}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-participants-title"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-600 p-5 max-w-md w-full mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <UserPlusIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 id="add-participants-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Add to call
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
            {error}
          </div>
        )}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
          {availableFriends.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-slate-400">No friends to add</p>
              <p className="text-xs text-gray-400 mt-1">All your friends are already in this call</p>
            </div>
          ) : (
            <div className="space-y-1">
              {availableFriends.map((f) => (
                <button
                  key={f._id}
                  type="button"
                  onClick={() => handleAdd(f._id)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors text-left"
                >
                  <Avatar src={f.image} alt={f.name} size="md" fallback={f.name} />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">{f.name}</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-medium">
                    Add
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
