'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  UserIcon,
  CheckIcon,
  XCircleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

/**
 * Modal for managing friend requests
 */
export default function FriendRequestsModal({ isOpen, onClose, onRequestAccepted }) {
  const { data: session } = useSession();
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'

  useEffect(() => {
    if (isOpen && session) {
      fetchFriendRequests();
    }
  }, [isOpen, session, activeTab]);

  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/friends/requests?type=${activeTab}`);
      const data = await response.json();
      
      if (data.success) {
        setFriendRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the request from the list
        setFriendRequests(prev => prev.filter(req => req._id !== requestId));
        
        if (action === 'accepted' && onRequestAccepted) {
          onRequestAccepted();
        }
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  const getRequestUser = (request) => {
    return activeTab === 'received' ? request.from : request.to;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
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
                <UserPlusIcon className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Friend Requests
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'received'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Received
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'sent'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sent
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : friendRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No {activeTab} friend requests</p>
                  <p className="text-sm">
                    {activeTab === 'received' 
                      ? 'When someone sends you a friend request, it will appear here'
                      : 'Friend requests you send will appear here'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {friendRequests.map((request) => {
                    const user = getRequestUser(request);
                    
                    return (
                      <div
                        key={request._id}
                        className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg"
                      >
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">
                              {user.name?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.handle}
                          </div>
                          {request.message && (
                            <div className="text-sm text-gray-600 mt-1">
                              "{request.message}"
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(request.createdAt)}
                          </div>
                        </div>

                        {/* Actions */}
                        {activeTab === 'received' ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRequestAction(request._id, 'accepted')}
                              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                              title="Accept"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRequestAction(request._id, 'rejected')}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Reject"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCancelRequest(request._id)}
                            className="px-3 py-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
