'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, QrCodeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import QRCode from 'react-qr-code';

export default function QRCodeModal({ isOpen, onClose, currentUser }) {
  const [qrData, setQrData] = useState('');
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'add'

  useEffect(() => {
    if (isOpen && currentUser) {
      // Create QR data with user info
      const data = JSON.stringify({
        type: 'add_friend',
        userId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        timestamp: Date.now()
      });
      setQrData(data);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Add Friends</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <QrCodeIcon className="w-5 h-5 inline mr-2" />
              Show QR Code
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'add'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlusIcon className="w-5 h-5 inline mr-2" />
              Add Friends
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'qr' ? (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Share this QR code with friends
                </h3>
                <p className="text-gray-600 mb-6">
                  Let them scan this code to add you as a friend
                </p>
                
                {qrData && (
                  <div className="bg-gray-50 p-4 rounded-lg inline-block">
                    <QRCode
                      value={qrData}
                      size={200}
                      level="H"
                      className="mx-auto"
                    />
                  </div>
                )}
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>Your ID: {currentUser?.id}</p>
                  <p>Name: {currentUser?.name}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Add Friends Manually
                </h3>
                <p className="text-gray-600 mb-6">
                  Enter your friend's user ID or email to add them
                </p>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter user ID or email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Add Friend
                  </button>
                </div>
                
                <div className="mt-6 text-sm text-gray-500">
                  <p>Or share your QR code with them</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
