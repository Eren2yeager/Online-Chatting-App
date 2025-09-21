'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  UserPlusIcon, 
  UserMinusIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  CheckIcon,
  BellIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useToast } from '@/components/layout/ToastContext';
import { useSocketEmitter, useSocket } from '@/lib/socket';

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { emitAck } = useSocketEmitter();
  const { socket } = useSocket();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendForm, setAddFriendForm] = useState({
    handle: '',
    message: ''
  });
  const [activeTab, setActiveTab] = useState('friends');
 const toast = useToast();
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchFriendsData();
      fetchFriendRequests();
    }
  }, [session]);

  // Live updates from socket events
  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      fetchFriendsData();
      fetchFriendRequests();
    };

    socket.on('friend:request:accepted', refresh);
    socket.on('friend:removed', refresh);
    socket.on('friend:request:cancelled', refresh);
    socket.on('friend:request:rejected', refresh);
    socket.on('friend:request:received', refresh);

    return () => {
      socket.off('friend:request:accepted', refresh);
      socket.off('friend:removed', refresh);
      socket.off('friend:request:cancelled', refresh);
      socket.off('friend:request:rejected', refresh);
      socket.off('friend:request:received', refresh);
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
      console.error('errorr fetching friends data:', error);
      toast({ text : 'Failed to load friends data'});
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToProfile = (handle) => {
    if (handle) {
      router.push(`/profile/${handle}`);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch('/api/friends/requests');
      const data = await response.json();
      if (data.success) {
        setFriendRequests({
          incoming: data.incoming || [],
          outgoing: data.outgoing || []
        });
      }
    } catch (errorr) {
      console.error('errorr fetching friend requests:', error);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    try {
      const res = await emitAck('friend:request:create', addFriendForm);
      if (res?.success) {
        toast({text :'Friend request sent successfully!'});
        setAddFriendForm({ handle: '', message: '' });
        setShowAddFriend(false);
        fetchFriendRequests();
      } else {
        toast( { text :res?.error || 'Failed to send friend request'});
      }
    } catch {
      toast( { text :'Failed to send friend request'});
    }
  };

  const startChat = async (friendId) => {
    try {
      if (!friendId || typeof friendId !== "string") {
        toast( { text :"Invalid friend ID"});
        return;
      }

      // First check if a chat already exists
      const response = await fetch("/api/chats");
      const data = await response.json();
      console.log(data.data.chats)
      if (data.success) {
        const existingChat = data.data.chats.find(
          (chat) =>
            !chat.isGroup &&
            chat.participants.length === 2 &&
            chat.participants.some(
              (p) =>
                (typeof p === "object" && (p._id === friendId || p._id?.toString() === friendId)) ||
                (typeof p === "string" && p === friendId)
            ) &&
            chat.participants.some(
              (p) =>
                (typeof p === "object" && (p._id === session.user.id || p._id?.toString() === session.user.id)) ||
                (typeof p === "string" && p === session.user.id)
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

      const newChat = await createResponse.json();

      if (newChat.success && newChat.data && newChat.data._id) {
        router.push(`/chats/${newChat.data._id}`);
      } else {
        toast( { text : newChat?.error || "Failed to start chat" });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast( { text : "Failed to start chat"});
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      const res = await emitAck('friend:remove', { friendId });
      if (res?.success) {
        toast({text : 'Friend removed successfully'});
        fetchFriendsData();
      } else {
        toast( { text :res?.error || 'Failed to remove friend'});
      }
    } catch {
      toast( { text :'Failed to remove friend'});
    }
  };

  const acceptFriendRequest = async (requestId) => {
      if (!requestId) {
        toast( { text :'Invalid request ID'});
      return;
    } 
    try {
      const res = await emitAck('friend:request:action', { requestId, action: 'accept' });
      if (res?.success) {
        toast({text : 'Friend request accepted!'});
        fetchFriendRequests();
        fetchFriendsData();
      } else {
        toast( { text :res?.error || 'Failed to accept friend request'});
      }
    } catch {
      toast( { text :'Failed to accept friend request'});
    }
  };

  const rejectFriendRequest = async (requestId) => {
       if (!requestId) {
        toast( { text :'Invalid request ID'});
      return;
    } 
    try {
      const res = await emitAck('friend:request:action', { requestId, action: 'reject' });
      if (res?.success) {
        toast({text : 'Friend request rejected'});
        fetchFriendRequests();
      } else {
        toast( { text :res?.error || 'Failed to reject friend request'});
      }
    } catch {
      toast( { text :'Failed to reject friend request'});
    }
  };

  const cancelFriendRequest = async (requestId) => {
    if (!requestId) {
        toast( { text :'Invalid request ID'});
      return;
    } 
      
      
    try {
      const res = await emitAck('friend:request:action', { requestId, action: 'cancel' });
      if (res?.success) {
        toast({text : 'Friend request cancelled'});
        fetchFriendRequests();
      } else {
        toast( { text :res?.error || 'Failed to cancel friend request'});
      }
    } catch {
      toast( { text :'Failed to cancel friend request'});
    }
  };



  const filteredFriends = friends?.filter(friend => {
    return friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           friend.handle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Friends Management</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 ">
            <div className="relative flex-1 w-full md:max-w-xs ">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowAddFriend(true)}
              className="bg-blue-600 w-full sm:w-fit text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              <UserPlusIcon className="w-5 h-5 mr-2" />
            
                Add Friend
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('friends')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'friends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Friends
              <span className="ml-2 bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                {friends.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Requests
              {friendRequests.incoming.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs">
                  {friendRequests.incoming.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'friends' ? (
          <div className="bg-white rounded-xl shadow-sm">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-16">
                <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No friends found' : 'No friends yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search' 
                    : 'Start building your network by adding friends!'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddFriend(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center mx-auto"
                  >
                    <UserPlusIcon className="w-5 h-5 mr-2" />
                    Add Your First Friend
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredFriends.map((friend) => (
                  <li key={friend._id} className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row gap-2 justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative h-12 w-12 cursor-pointer" onClick={() => navigateToProfile(friend.handle)}>
                          {friend.image ? (
                            <img
                              src={friend.image}
                              alt={friend.name}
                              className="rounded-full object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">
                              {friend.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${
                            friend.status === 'online' ? 'bg-green-400' : 'bg-gray-300'
                          }`}></span>
                        </div>
                        
                        <div className="cursor-pointer" onClick={() => navigateToProfile(friend.handle)}>
                          <h3 className="text-lg font-medium text-gray-900">{friend.name}</h3>
                          <p className="text-sm text-gray-500">@{friend.handle}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startChat(friend._id)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg flex items-center transition-colors"
                        >
                          <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                          Chat
                        </button>
                        
                        <button
                          onClick={() => removeFriend(friend._id)}
                          className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                          title="Remove friend"
                        >
                          <UserMinusIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <BellIcon className="w-5 h-5 mr-2 text-blue-500" />
                  Incoming Requests
                  {friendRequests.incoming.length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs">
                      {friendRequests.incoming.length}
                    </span>
                  )}
                </h3>
              </div>
              
              {friendRequests.incoming.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No incoming friend requests
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {friendRequests.incoming.map((request) => (
                    <li key={request._id} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-2  justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative h-12 w-12 cursor-pointer" onClick={() => navigateToProfile(request.from._id)}>
                            {request.from.image ? (
                              <img
                                src={request.from.image}
                                alt={request.from.name}
                                className="rounded-full object-cover"
                                fill
                                sizes="48px"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">
                                {request.from.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 cursor-pointer" onClick={() => navigateToProfile(request.from._id)}>
                              {request.from.name}
                            </h3>
                            <p className="text-sm text-gray-500">@{request.from.handle}</p>
                            {request.message && (
                              <p className="text-sm text-gray-600 mt-1 italic">&ldquo;{request.message}&rdquo;</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => acceptFriendRequest(request._id)}
                            className="bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg flex items-center transition-colors"
                          >
                            <CheckIcon className="w-5 h-5 mr-2" />
                            Accept
                          </button>
                          
                          <button
                            onClick={() => rejectFriendRequest(request._id)}
                            className="bg-gray-50 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center transition-colors"
                          >
                            <XMarkIcon className="w-5 h-5 mr-2" />
                            Decline
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Outgoing Requests */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Sent Requests</h3>
              </div>
              
              {friendRequests.outgoing.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No outgoing friend requests
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {friendRequests.outgoing.map((request) => (
                    <li key={request._id} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-2 justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative h-12 w-12 cursor-pointer" onClick={() => navigateToProfile(request.to._id)}>
                            {request.to.image ? (
                              <img
                                src={request.to.image}
                                alt={request.to.name}
                                className="rounded-full object-cover"
                                fill
                                sizes="48px"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">
                                {request.to.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 cursor-pointer" onClick={() => navigateToProfile(request.to._id)}>
                              {request.to.name}
                            </h3>
                            <p className="text-sm text-gray-500">@{request.to.handle}</p>
                            <p className="text-sm text-gray-500 mt-1">Sent {new Date(request.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => cancelFriendRequest(request._id)}
                          className="bg-gray-50 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5 mr-2" />
                          Cancel
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm shadow-sm shadow-black  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add Friend</h3>
              <button 
                onClick={() => setShowAddFriend(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddFriend}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Friend&apos;s Handle
                </label>
                <input
                  type="text"
                  value={addFriendForm.handle}
                  onChange={(e) => setAddFriendForm({...addFriendForm, handle: e.target.value})}
                  className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
