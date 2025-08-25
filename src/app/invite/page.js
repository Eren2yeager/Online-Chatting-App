'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { UserIcon, QrCodeIcon, ShareIcon } from '@heroicons/react/24/outline';

/**
 * Main invite page component
 */
export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  );
}

/**
 * Invite page content component
 * Handles both viewing own invite code and processing incoming invites
 */
function InvitePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const incomingCode = searchParams.get('code');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/signin');
      return;
    }

    // If there's an incoming invite code, process it
    if (incomingCode) {
      processIncomingInvite(incomingCode);
    } else {
      // Get user's own invite code
      fetchUserInviteCode();
    }
  }, [session, status, incomingCode]);

  const fetchUserInviteCode = async () => {
    try {
      const response = await fetch(`/api/users/${session.user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setInviteCode(data.data.inviteCode);
      }
    } catch (error) {
      console.error('Error fetching invite code:', error);
    }
  };

  const processIncomingInvite = async (code) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/users/invite/${code}`);
      const data = await response.json();

      if (data.success) {
        setTargetUser(data.data);
      } else {
        setError(data.error || 'Invalid invite code');
      }
    } catch (error) {
      setError('Failed to process invite code');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!targetUser) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toHandle: targetUser.handle,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Friend request sent successfully!');
        setTimeout(() => {
          router.push('/chats');
        }, 2000);
      } else {
        setError(data.error || 'Failed to send friend request');
      }
    } catch (error) {
      setError('Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const shareInvite = async () => {
    const inviteUrl = `${window.location.origin}/invite?code=${inviteCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on ChatApp!',
          text: `Hi! I'm using ChatApp. Join me by scanning this QR code or clicking the link: ${inviteUrl}`,
          url: inviteUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setSuccess('Invite link copied to clipboard!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to copy invite link');
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {incomingCode ? (
            // Incoming invite view
            <div className="text-center">
              <QrCodeIcon className="mx-auto h-16 w-16 text-blue-500 mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Friend Invitation
              </h1>
              <p className="text-gray-600 mb-8">
                Someone wants to connect with you on ChatApp
              </p>

              {loading ? (
                <div className="animate-pulse">
                  <div className="h-32 w-32 mx-auto bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              ) : targetUser ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      {targetUser.image ? (
                        <img
                          src={targetUser.image}
                          alt={targetUser.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {targetUser.name}
                      </h3>
                      <p className="text-sm text-gray-500">@{targetUser.handle}</p>
                    </div>
                  </div>

                  <button
                    onClick={sendFriendRequest}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Sending...' : 'Accept Invitation'}
                  </button>
                </div>
              ) : error ? (
                <div className="text-center">
                  <div className="text-red-500 mb-4">{error}</div>
                  <button
                    onClick={() => router.push('/chats')}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Go to Chats
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            // Own invite code view
            <div className="text-center">
              <QrCodeIcon className="mx-auto h-16 w-16 text-blue-500 mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Invite Friends
              </h1>
              <p className="text-gray-600 mb-8">
                Share your QR code or invite link with friends
              </p>

              {inviteCode && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <QRCodeSVG
                      value={`${window.location.origin}/invite?code=${inviteCode}`}
                      size={200}
                      className="mx-auto"
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={shareInvite}
                      className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
                    >
                      <ShareIcon className="h-5 w-5" />
                      <span>Share Invite</span>
                    </button>

                    <button
                      onClick={() => router.push('/chats')}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Back to Chats
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm"
            >
              {success}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
