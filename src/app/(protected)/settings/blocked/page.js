'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/layout/ToastContext';
import { UserAvatar, Loader } from '@/components/ui';

export default function BlockedUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const showToast= useToast();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }
    fetchBlockedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router]);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/blocked');
      const data = await response.json();
      
      if (data.success) {
        setBlockedUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      showToast( {text :`Failed to load blocked users : error` });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (id) => {
    try {
      const response = await fetch(`/api/users/${id}/unblock`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        setBlockedUsers(prev => prev.filter(user => user._id !== id));
        showToast( {text :'User unblocked successfully : success' });
      } else {
        showToast( {text :data.message || 'Failed to unblock user : error' });
      }
    } catch (error) {
      showToast( {text :'Failed to unblock user : error' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Blocked Users</h1>
              <p className="text-sm text-gray-500">
                {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'} blocked
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {blockedUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XMarkIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Blocked Users</h3>
            <p className="text-gray-500">You haven&apos;t blocked anyone yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {blockedUsers.map((user) => (
              <div
                key={user._id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} size="md" />
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">@{user.handle}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(user._id)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
