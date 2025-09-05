'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  CalendarIcon,
  GlobeAltIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useSocketEmit } from '@/lib/socket';
import { useSocket } from '@/lib/socket';

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { emitAck } = useSocketEmit();
  const { socket } = useSocket();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendForm, setAddFriendForm] = useState({
    handle: '',
    message: ''
  });
  const [filterStatus, setFilterStatus] = useState('all'); // all, online, offline
  const [viewMode, setViewMode] = useState('grid'); // grid, list

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

  // Live updates from socket events
  useEffect(() => {
    if (!socket) return;

    const refresh = () => fetchFriendsData();

    const onAccepted = ({ from, to }) => {
      // Either side being current user should refresh friends
      if (session?.user?.id && (from === session.user.id || to === session.user.id)) {
        refresh();
      }
    };
    const onRemoved = ({ userId }) => {
      if (session?.user?.id && userId === session.user.id) {
        refresh();
      } else {
        refresh();
      }
    };
    const onCancelled = refresh;
    const onRejected = refresh;

    socket.on('friend:request:accepted', onAccepted);
    socket.on('friend:removed', onRemoved);
    socket.on('friend:request:cancelled', onCancelled);
    socket.on('friend:request:rejected', onRejected);

    return () => {
      socket.off('friend:request:accepted', onAccepted);
      socket.off('friend:removed', onRemoved);
      socket.off('friend:request:cancelled', onCancelled);
      socket.off('friend:request:rejected', onRejected);
    };
  }, [socket, session?.user?.id]);

  const fetchFriendsData = async () => {
    try {
      const friendsRes = await fetch('/api/users/friends');

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(Array.isArray(friendsData) ? friendsData : (friendsData.data || []));
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
      const res = await emitAck('friend:request:create', addFriendForm);
      if (res?.success) {
        toast.success('Friend request sent successfully!');
        setAddFriendForm({ handle: '', message: '' });
        setShowAddFriend(false);
      } else {
        toast.error(res?.error || 'Failed to send friend request');
      }
    } catch {
      toast.error('Failed to send friend request');
    }
  };

  const startChat = async (friendId) => {
    try {
      // First check if a chat already exists
      const response = await fetch("/api/chats");
      const data = await response.json();
      if (data.success) {
        const existingChat = data.data.find(
          (chat) =>
            !chat.isGroup &&
            chat.participants.length === 2 &&
            chat.participants.some(
              (p) => p._id === friendId || p === friendId
            ) &&
            chat.participants.some(
              (p) => p._id === session.user.id || p === session.user.id
            )
        );
        if (existingChat) {
          router.push(`/chats/${existingChat._id}`);
          return;
        }
      }
      // Create new chat
      const createResponse = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isGroup: false,
          participants: [friendId],
        }),
      });
      if (createResponse.ok) {
        const newChat = await createResponse.json();
        if (newChat.success) {
          router.push(`/chats/${newChat.data._id}`);
        } else {
          toast.error("Failed to start chat");
        }
      } else {
        toast.error("Failed to start chat");
      }
    } catch (error) {
      toast.error("Failed to start chat");
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      const res = await emitAck('friend:remove', { friendId });
      if (res?.success) {
        toast.success('Friend removed successfully');
        fetchFriendsData();
      } else {
        toast.error(res?.error || 'Failed to remove friend');
      }
    } catch {
      toast.error('Failed to remove friend');
    }
  };

  const filteredFriends = friends?.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         friend.handle.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'online') return matchesSearch && friend.status === 'online';
    if (filterStatus === 'offline') return matchesSearch && friend.status !== 'online';
    
    return matchesSearch;
  });

  const onlineFriends = friends?.filter(friend => friend.status === 'online').length || 0;
  const totalFriends = friends?.length || 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Friends</h1>
          <p className="text-gray-600 text-lg">Connect and chat with your friends</p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalFriends}</div>
              <div className="text-sm text-gray-600">Total Friends</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{onlineFriends}</div>
              <div className="text-sm text-gray-600">Online Now</div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8"
        >
          {/* Search - Full width on mobile */}
          <div className="relative mb-4 sm:mb-0">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters and Actions - Responsive layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            {/* Status Filter */}
            <div className="flex items-center gap-2 min-w-0">
              <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
                onClick={() => setViewMode('grid')}
                className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Grid
          </button>
          <button
                onClick={() => setViewMode('list')}
                className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                List
          </button>
            </div>

            {/* Add Friend Button - Responsive sizing */}
          <button
              onClick={() => setShowAddFriend(true)}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
              <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Add Friend</span>
              <span className="xs:hidden">Add</span>
          </button>
          </div>
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

        {/* Friends List */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          {filteredFriends.length === 0 ? (
            <div className="text-center py-16">
              <UserGroupIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {searchQuery || filterStatus !== 'all' ? 'No friends found' : 'No friends yet'}
              </h3>
              <p className="text-gray-500 text-lg mb-8">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Start building your network by adding friends!'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
            <button
                  onClick={() => setShowAddFriend(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center mx-auto"
                >
                  <UserPlusIcon className="w-5 h-5 mr-2" />
                  Add Your First Friend
            </button>
              )}
                  </div>
                ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" 
              : "space-y-3 sm:space-y-4"
            }>
              {filteredFriends.map((friend, index) => (
                      <motion.div
                        key={friend._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 ${
                    viewMode === 'list' ? 'p-3 sm:p-4' : 'p-4 sm:p-6'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <div className="text-center">
                      {/* Avatar */}
                      <div className="relative inline-block mb-3 sm:mb-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold overflow-hidden shadow-lg">
                              {friend.image ? (
                                <img 
                                  src={friend.image} 
                                  alt={friend.name} 
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                                />
                              ) : (
                                friend.name.charAt(0).toUpperCase()
                              )}
                            </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 sm:border-4 border-white shadow-lg ${
                              friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                          </div>

                      {/* Info */}
                      <h4 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 truncate">{friend.name}</h4>
                      <p className="text-gray-500 text-xs sm:text-sm mb-2 truncate">@{friend.handle}</p>
                      <p className={`text-xs px-2 sm:px-3 py-1 rounded-full inline-block mb-3 sm:mb-4 ${
                        friend.status === 'online' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                              {friend.status === 'online' ? 'Online' : `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`}
                            </p>

                      {/* Actions */}
                      <div className="flex gap-2 justify-center">
                            <button
                          onClick={() => startChat(friend._id)}
                          className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                          <ChatBubbleLeftRightIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Chat</span>
                          <span className="sm:hidden">Msg</span>
                            </button>
                            <button
                              onClick={() => removeFriend(friend._id)}
                          className="bg-red-100 text-red-600 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-200 transition-colors"
                              title="Remove friend"
                            >
                          <UserMinusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                    </div>
                  ) : (
                    // List View
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm sm:text-lg font-bold overflow-hidden shadow-lg">
                            {friend.image ? (
                              <img 
                                src={friend.image} 
                                alt={friend.name} 
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                                  />
                                ) : (
                              friend.name.charAt(0).toUpperCase()
                                )}
                              </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm ${
                            friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 text-base sm:text-lg truncate">{friend.name}</h4>
                          <p className="text-gray-500 text-sm truncate">@{friend.handle}</p>
                          <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                            friend.status === 'online' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {friend.status === 'online' ? 'Online' : `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`}
                                </p>
                              </div>
                            </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                              <button
                          onClick={() => startChat(friend._id)}
                          className="bg-blue-600 text-white px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                              >
                          <ChatBubbleLeftRightIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="w-fit">Chat</span>
                              </button>
                              <button
                          onClick={() => removeFriend(friend._id)}
                          className="bg-red-100 text-red-600 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-200 transition-colors"
                          title="Remove friend"
                              >
                          <UserMinusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                          </div>
                    </div>
                  )}
                        </motion.div>
                      ))}
                    </div>
                  )}
        </motion.div>
      </div>
    </div>
  );
}
