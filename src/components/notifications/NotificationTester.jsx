'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/lib/socket';
import notificationSound from '@/lib/notificationSound';
import silentMode from '@/lib/silentMode';
import * as browserNotifications from '@/lib/browserNotifications';

/**
 * Notification Tester Component
 * For testing different notification types and sounds
 * Only visible in development mode
 */
export default function NotificationTester() {
  const { socket } = useSocket();
  const [soundEnabled, setSoundEnabled] = useState(notificationSound.isEnabled());
  const [volume, setVolume] = useState(notificationSound.getVolume());
  const [isSilent, setIsSilent] = useState(silentMode.isEnabled());

  useEffect(() => {
    // Listen for silent mode changes
    const cleanup = silentMode.addListener((enabled) => {
      setIsSilent(enabled);
    });
    return cleanup;
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const testNotificationTypes = [
    { type: 'message', label: '💬 Message', chatId: '507f1f77bcf86cd799439011' },
    { type: 'friend_request', label: '👥 Friend Request' },
    { type: 'friend_request_accepted', label: '✅ Friend Accepted' },
    { type: 'group_invite', label: '👥 Group Invite', chatId: '507f1f77bcf86cd799439011' },
    { type: 'group_update', label: '📢 Group Update', chatId: '507f1f77bcf86cd799439011' },
    { type: 'reaction', label: '❤️ Reaction', chatId: '507f1f77bcf86cd799439011' },
  ];

  const sendTestNotification = (notifType) => {
    console.log('🧪 Testing notification type:', notifType.type);
    
    const testNotification = {
      _id: `test-${Date.now()}`,
      type: notifType.type,
      title: `Test ${notifType.label}`,
      body: `This is a test notification for ${notifType.type}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...(notifType.chatId && { chatId: notifType.chatId }),
      fromUser: {
        _id: 'test-user',
        name: 'Test User',
        handle: 'testuser',
        image: null,
      },
    };

    // Play notification sound
    notificationSound.play();

    // Show browser notification
    browserNotifications.showNotification({
      title: testNotification.title,
      body: testNotification.body,
      icon: '/user.jpg',
      tag: testNotification._id,
      data: testNotification,
      onClick: () => {
        window.focus();
        if (testNotification.type === 'message' && testNotification.chatId) {
          window.location.href = `/chats/${testNotification.chatId}`;
        } else if (testNotification.type === 'friend_request' || testNotification.type === 'friend_request_accepted') {
          window.location.href = '/friends';
        } else if ((testNotification.type === 'group_invite' || testNotification.type === 'group_update' || testNotification.type === 'reaction') && testNotification.chatId) {
          window.location.href = `/chats/${testNotification.chatId}`;
        }
      },
    });

    // Simulate the socket event if socket is connected
    if (socket) {
      // Emit to trigger the notification context listener
      socket.emit('test:notification', testNotification);
    }
    
    alert(`✅ Test notification sent!\n\nType: ${notifType.type}\nSound: ${notificationSound.isEnabled() ? 'Played' : 'Disabled'}\nBrowser Notification: ${browserNotifications.isNotificationGranted() ? 'Shown' : 'Permission needed'}`);
  };

  const toggleSound = () => {
    const newState = notificationSound.toggle();
    setSoundEnabled(newState);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    notificationSound.setVolume(newVolume);
  };

  const testSound = () => {
    notificationSound.play({ force: true });
  };

  const toggleSilentMode = () => {
    const newState = silentMode.toggle();
    setIsSilent(newState);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">🧪 Notification Tester</h3>
        <span className="text-xs text-gray-500">DEV ONLY</span>
      </div>

      {/* Sound Controls */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Silent Mode</span>
          <button
            onClick={toggleSilentMode}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              isSilent
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {isSilent ? '🔕 ON' : '🔔 OFF'}
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Sound</span>
          <button
            onClick={toggleSound}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              soundEnabled
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-600">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1"
          />
          <span className="text-xs text-gray-600 w-8">{Math.round(volume * 100)}%</span>
        </div>

        <button
          onClick={testSound}
          className="w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔊 Test Sound
        </button>
      </div>

      {/* Notification Type Tests */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700 mb-2">Test Notifications:</p>
        {testNotificationTypes.map((notifType) => (
          <button
            key={notifType.type}
            onClick={() => sendTestNotification(notifType)}
            className="w-full px-3 py-2 text-xs bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-gray-700 rounded-lg transition-colors text-left font-medium"
          >
            {notifType.label}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-gray-500 mt-3 text-center">
        Socket: {socket ? '✅ Connected' : '❌ Disconnected'}
      </p>
    </div>
  );
}
