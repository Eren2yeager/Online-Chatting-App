'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  CheckIcon,
  XCircleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useSocket } from '@/lib/socket';
import * as socketApi from '@/lib/client/socket-api';
import { Modal, ModalBody, UserAvatar, Button, Badge, Spinner, toast } from '@/components/ui';
import { usePresence } from '@/lib/socket';

/**
 * Modern Friend Requests Modal
 */
export default function FriendRequestsModal({ isOpen, onClose, onRequestAccepted }) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const onlineUsers = usePresence();
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    if (isOpen && session) {
      fetchFriendRequests();
    }
  }, [isOpen, session, activeTab]);

  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/friends/requests');
      const data = await response.json();

      if (data.success) {
        // API returns { incoming: [], outgoing: [] }
        // Map to received/sent based on activeTab
        const requests = activeTab === 'received' ? data.incoming : data.outgoing;
        setFriendRequests(requests || []);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      toast.error('Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    if (!socket || !isConnected) {
      toast.error('Not connected. Please try again.');
      return;
    }

    try {
      let response;
      if (action === 'accepted') {
        response = await socketApi.acceptFriendRequest(socket, { requestId });
      } else if (action === 'rejected') {
        response = await socketApi.rejectFriendRequest(socket, { requestId });
      }

      if (response && response.success) {
        setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
        
        if (action === 'accepted') {
          toast.success('Friend request accepted!');
          if (onRequestAccepted) onRequestAccepted();
        } else {
          toast.success('Friend request rejected');
        }
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast.error('Failed to process request');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!socket || !isConnected) {
      toast.error('Not connected. Please try again.');
      return;
    }

    try {
      const response = await socketApi.cancelFriendRequest(socket, { requestId });

      if (response && response.success) {
        setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
        toast.success('Friend request cancelled');
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      toast.error('Failed to cancel request');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <UserPlusIcon className="h-6 w-6 text-white" />
          </div>
          <span>Friend Requests</span>
        </div>
      }
      size="md"
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-all relative ${
            activeTab === 'received'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Received
          {activeTab === 'received' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-all relative ${
            activeTab === 'sent'
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sent
          {activeTab === 'sent' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>

      <ModalBody>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" variant="primary" />
            <p className="mt-4 text-gray-500 font-medium">Loading requests...</p>
          </div>
        ) : friendRequests?.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="h-20 w-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold mb-2">
              No {activeTab} friend requests
            </p>
            <p className="text-sm text-gray-500">
              {activeTab === 'received'
                ? 'When someone sends you a friend request, it will appear here'
                : 'Friend requests you send will appear here'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {friendRequests?.map((request, index) => {
              const user = getRequestUser(request);

              return (
                <motion.div
                  key={request._id}
                  className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* Avatar with online status */}
                  <UserAvatar
                    user={user}
                    size="lg"
                    showStatus={true}
                    showName={false}
                    onlineUsers={onlineUsers}
                    className="ring-2 ring-white shadow-md"
                  />

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.handle}
                    </div>
                    {request.message && (
                      <div className="text-sm text-gray-600 mt-1 italic">
                        "{request.message}"
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(request.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  {activeTab === 'received' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleRequestAction(request._id, 'accepted')}
                        icon={<CheckIcon className="h-4 w-4" />}
                        title="Accept"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRequestAction(request._id, 'rejected')}
                        icon={<XCircleIcon className="h-4 w-4" />}
                        title="Reject"
                      />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelRequest(request._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
