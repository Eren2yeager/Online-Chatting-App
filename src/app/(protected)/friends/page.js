'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  CheckIcon, 
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendForm, setAddFriendForm] = useState({
    handle: '',
    message: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchFriendsData();
    }
  }, [session]);

  const fetchFriendsData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch('/api/users/friends'),
        fetch('/api/friends/requests')
      ]);

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(Array.isArray(friendsData) ? friendsData : (friendsData.data || []));
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        // Only include requests with status 'pending'
        const filterPending = (arr) => (Array.isArray(arr) ? arr.filter(r => r.status === 'pending') : []);
        setFriendRequests(
          requestsData.success
            ? {
                incoming: filterPending(requestsData.incoming),
                outgoing: filterPending(requestsData.outgoing)
              }
            : {
                incoming: filterPending(requestsData.incoming),
                outgoing: filterPending(requestsData.outgoing)
              }
        );
      }
    } catch (error) {
      console.error('Error fetching friends data:', error);
      toast.error('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFriendForm)
      });

      if (response.ok) {
        toast.success('Friend request sent successfully!');
        setAddFriendForm({ handle: '', message: '' });
        setShowAddFriend(false);
        fetchFriendsData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const handleFriendRequest = async (requestId, action) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        toast.success(action === 'accept' ? 'Friend request accepted!' : 'Friend request rejected!');
        fetchFriendsData(); // Refresh data
      } else {
        toast.error('Failed to process friend request');
      }
    } catch (error) {
      console.error('Error processing friend request:', error);
      toast.error('Failed to process friend request');
    }
  };

  const cancelFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });

      if (response.ok) {
        toast.success('Friend request cancelled!');
        fetchFriendsData(); // Refresh data
      } else {
        toast.error('Failed to cancel friend request');
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast.error('Failed to cancel friend request');
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      const response = await fetch(`/api/users/friends/${friendId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Friend removed successfully');
        fetchFriendsData(); // Refresh data
      } else {
        toast.error('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    }
  };

  const filteredFriends = friends?.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends</h1>
          <p className="text-gray-600">Manage your connections and friend requests</p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-4 justify-center mb-8"
        >
          <button
            onClick={() => setShowAddFriend(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Add Friend
          </button>
          <button
            onClick={() => router.push('/invite')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
          >
            <QrCodeIcon className="w-5 h-5 mr-2" />
            Share QR Code
          </button>
          <button
            onClick={() => router.push('/chats')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            View Chats
          </button>
        </motion.div>

        {/* Add Friend Modal */}
        {showAddFriend && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Friend</h3>
              <form onSubmit={handleAddFriend}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Friend&apos;s Handle
                  </label>
                  <input
                    type="text"
                    value={addFriendForm.handle}
                    onChange={(e) => setAddFriendForm({...addFriendForm, handle: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@username"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={addFriendForm.message}
                    onChange={(e) => setAddFriendForm({...addFriendForm, message: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a personal message..."
                    rows="3"
                    maxLength="200"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Send Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFriend(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl mb-8"
        >
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserGroupIcon className="w-5 h-5 inline mr-2" />
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClockIcon className="w-5 h-5 inline mr-2" />
              Requests ({friendRequests.incoming?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'friends' ? (
              <div>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search friends..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Friends List */}
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery ? 'No friends found' : 'No friends yet'}
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Try adjusting your search' : 'Start by adding some friends!'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFriends.map((friend) => (
                      <motion.div
                        key={friend._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {friend.image ? (
                                <img 
                                  src={friend.image} 
                                  alt={friend.name} 
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                friend.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{friend.name}</h4>
                            <p className="text-sm text-gray-500">@{friend.handle}</p>
                            <p className="text-xs text-gray-400">
                              {friend.status === 'online' ? 'Online' : `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/chats?friend=${friend._id}`)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Message friend"
                            >
                              <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => removeFriend(friend._id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Remove friend"
                            >
                              <UserMinusIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Incoming Friend Requests */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Incoming Requests</h3>
                  {friendRequests.incoming?.length === 0 ? (
                    <div className="text-center py-8">
                      <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No incoming requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {friendRequests.incoming?.map((request) => (
                        <motion.div
                          key={request._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {request.from.image ? (
                                  <img 
                                    src={request.from.image} 
                                    alt={request.from.name} 
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  request.from.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{request.from.name}</h4>
                                <p className="text-sm text-gray-500">@{request.from.handle}</p>
                                {request.message && (
                                  <p className="text-sm text-gray-600 mt-1">&quot;{request.message}&quot;</p>
                                )}
                                <p className="text-xs text-gray-400">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleFriendRequest(request._id, 'accept')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                              >
                                <CheckIcon className="w-4 h-4 mr-1" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleFriendRequest(request._id, 'reject')}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center"
                              >
                                <XMarkIcon className="w-4 h-4 mr-1" />
                                Reject
                              </button>

                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outgoing Friend Requests */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Outgoing Requests</h3>
                  {friendRequests.outgoing?.length === 0 ? (
                    <div className="text-center py-8">
                      <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No outgoing requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {friendRequests.outgoing?.map((request) => (
                        <motion.div
                          key={request._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {request.to.image ? (
                                  <img 
                                    src={request.to.image} 
                                    alt={request.to.name} 
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  request.to.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{request.to.name}</h4>
                                <p className="text-sm text-gray-500">@{request.to.handle}</p>
                                {request.message && (
                                  <p className="text-sm text-gray-600 mt-1">&quot;{request.message}&quot;</p>
                                )}
                                <p className="text-xs text-gray-400">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
      
                              <button
                                onClick={() => cancelFriendRequest(request._id)}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
