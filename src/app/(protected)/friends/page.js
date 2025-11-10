'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  UserPlusIcon, 
  UserMinusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  BellIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import CustomChatIcon from '@/components/icons/CustomChatIcon';
import { useToast } from '@/components/layout/ToastContext';
import { useSocketEmitter, useSocket, usePresence } from '@/lib/socket';
import { UserAvatar, Button, Input } from '@/components/ui';
import AddFriendModal from '@/components/friends/AddFriendModal';
import FriendRequestsModal from '@/components/chat/FriendRequestsModal';
import { Loader } from '@/components/ui';

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { emitAck } = useSocketEmitter();
  const { socket } = useSocket();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const toast = useToast();
  const onlineUsers = usePresence();
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

    const refresh = () => {
      fetchFriendsData();
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

  const filteredFriends = friends?.filter(friend => {
    return friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           friend.handle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
           <Loader />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 overflow-auto">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Friends
            </h1>
            <p className="text-gray-600">
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 md:mt-0">
            <div className="relative flex-1 w-full md:max-w-xs">
              <Input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<MagnifyingGlassIcon className="w-5 h-5" />}
                iconPosition="left"
                className="text-black"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setShowFriendRequests(true)}
                variant="secondary"
                className="flex-1 sm:flex-none"
              >
                <BellIcon className="w-5 h-5 mr-2" />
                Requests
              </Button>
              
              <Button
                onClick={() => setShowAddFriend(true)}
                variant="primary"
                className="flex-1 sm:flex-none"
              >
                <UserPlusIcon className="w-5 h-5 mr-2" />
                Add Friend
              </Button>
            </div>
          </div>
        </div>

        {/* Friends List */}
        <div className="bg-white rounded-2xl -lg overflow-hidden"></div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <UserIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {searchQuery ? 'No friends found' : 'No friends yet'}
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search or check the spelling' 
                    : 'Start building your network by adding friends!'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowAddFriend(true)}
                    variant="primary"
                    className="mx-auto"
                  >
                    <UserPlusIcon className="w-5 h-5 mr-2" />
                    Add Your First Friend
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredFriends.map((friend, idx) => (
                  <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <UserAvatar
                          user={friend}
                          size="lg"
                          showStatus={true}
                          showName={false}
                          onlineUsers={onlineUsers}
                          clickable={true}
                        />
                        
                        <div 
                          className="cursor-pointer flex-1 min-w-0" 
                          onClick={() => navigateToProfile(friend.handle)}
                        >
                          <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                            {friend.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">@{friend.handle}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button
                          onClick={() => startChat(friend._id)}
                          variant="secondary"
                          className="flex-1 md:flex-none"
                        >
                          <CustomChatIcon className="w-5 h-5 mr-2" />
                          Chat
                        </Button>
                        
                        <button
                          onClick={() => removeFriend(friend._id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove friend"
                        >
                          <UserMinusIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
      </div>

      {/* Modals */}
      <AddFriendModal
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onFriendAdded={fetchFriendsData}
      />

      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
        onRequestAccepted={fetchFriendsData}
      />
    </div>
  );
}
