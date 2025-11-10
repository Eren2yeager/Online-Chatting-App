'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  QrCodeIcon, 
  ClipboardDocumentIcon,
  ShareIcon,
  UserPlusIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Loader } from '@/components/ui';
export default function InvitePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const copyProfileHandle = () => {
    navigator.clipboard.writeText(`@${user.handle}`);
    toast.success('Profile handle copied to clipboard!');
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/invite/${user.handle}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success('Profile link copied to clipboard!');
  };

  const shareProfile = async () => {
    const profileUrl = `${window.location.origin}/invite/${user.handle}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Add ${user.name} as a friend`,
          text: `Scan my QR code or use my handle: @${user.handle}`,
          url: profileUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
        copyProfileLink();
      }
    } else {
      copyProfileLink();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Loader />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Invite Friends</h1>
          </div>
          <p className="text-gray-600">Share your profile and connect with others</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCodeIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code</h2>
              <p className="text-gray-600 mb-6">
                Scan this QR code to quickly add {user.name} as a friend
              </p>
              
              {showQR && (
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block mb-6">
                  <QRCodeSVG 
                    value={`${window.location.origin}/invite/${user.handle}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {showQR ? 'Hide QR Code' : 'Show QR Code'}
                </button>
                <button
                  onClick={shareProfile}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <ShareIcon className="w-5 h-5 mr-2" />
                  Share Profile
                </button>
              </div>
            </div>
          </motion.div>

          {/* Invite Code Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlusIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Handle</h2>
                      <p className="text-gray-600 mb-6">
          Share your profile handle with friends to connect instantly
        </p>

              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 mb-6">
                <div className="text-sm text-gray-600 mb-2">Your profile handle:</div>
                <div className="font-mono text-2xl font-bold text-gray-900 break-all">
                  @{user.handle}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={copyProfileHandle}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
                  Copy Handle
                </button>
                <button
                  onClick={copyProfileLink}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
                  Copy Profile Link
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Instructions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-2xl shadow-xl p-8"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Share Your Code</h4>
              <p className="text-gray-600 text-sm">
                Share your QR code or invite code with friends through any platform
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Friends Scan/Enter</h4>
              <p className="text-gray-600 text-sm">
                Friends can scan your QR code or enter your invite code
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Connect Instantly</h4>
              <p className="text-gray-600 text-sm">
                Start chatting and sharing moments with your new friends
              </p>
            </div>
          </div>
        </motion.div>

        {/* Profile Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-2xl shadow-xl p-8"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Your Profile Preview</h3>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name} 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${
                user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900">{user.name}</h4>
              <p className="text-gray-600">@{user.handle}</p>
              {user.bio && (
                <p className="text-gray-700 mt-2">{user.bio}</p>
              )}
              <div className="flex items-center space-x-4 mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.status === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.status === 'online' ? 'Online' : 'Offline'}
                </span>
                <span className="text-sm text-gray-500">
                  {user.friends?.length || 0} friends
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
