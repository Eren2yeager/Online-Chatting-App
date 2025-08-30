'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import SignInButton from '@/components/auth/SignInButton';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/chats');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
    >
      <div
        className="
          text-center
          max-w-2xl
          mx-auto
          px-4
          sm:px-6
          w-full
          flex
          flex-col
          items-center
          justify-center
          h-full
          overflow-y-auto
          scrollbar-thin
          scrollbar-thumb-blue-200
          scrollbar-track-transparent
        "
        style={{
          maxHeight: '100dvh',
        }}
      >
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-6 break-words"
        >
          Welcome to ChatApp
        </motion.h1>
        
        <motion.p
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-base xs:text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed break-words"
        >
          Experience real-time messaging with a modern, secure, and beautiful interface. 
          Connect with friends, share media, and enjoy seamless conversations.
        </motion.p>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-8 flex justify-center"
        >
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={()=>{router.push("/signin")}}
            className="bg-blue-600 w-fit hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors self-center gap-2"
          >
            Get Session
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left w-full"
        >
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/20 flex flex-col items-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-base sm:text-lg">Real-time Messaging</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Instant message delivery with WebSocket technology</p>
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/20 flex flex-col items-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-base sm:text-lg">Secure & Private</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Google OAuth authentication with encrypted data</p>
          </div>

          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/20 flex flex-col items-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-base sm:text-lg">Media Sharing</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Share images and audio files seamlessly</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
