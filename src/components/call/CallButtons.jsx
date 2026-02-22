'use client';

import { PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useCall } from '@/contexts/CallContext';

export default function CallButtons({
  targetUserId,
  floating = true,
  className = '',
}) {
  const { initiateCall } = useCall();

  const handleAudio = () => {
    if (targetUserId) initiateCall(targetUserId, 'audio');
  };

  const handleVideo = () => {
    if (targetUserId) initiateCall(targetUserId, 'video');
  };

  const Container = ({ children }) => (
    <div
      className={
        floating
          ? 'fixed bottom-6 right-6 z-40 flex flex-col gap-3'
          : `flex items-center gap-2 ${className}`
      }
    >
      {children}
    </div>
  );

  return (
    <Container>
      <button
        onClick={handleAudio}
        disabled={!targetUserId}
        className="flex items-center gap-2 p-2 rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800 disabled:opacity-50"
        title="Start audio call"
      >
        <PhoneIcon className="h-5 w-5" />
      </button>
      <button
        onClick={handleVideo}
        disabled={!targetUserId}
        className="flex items-center gap-2 p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 disabled:opacity-50"
        title="Start video call"
      >
        <VideoCameraIcon className="h-5 w-5" />
      </button>
    </Container>
  );
}
