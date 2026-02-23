'use client';

import { useEffect, useState } from 'react';
import { PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useCall } from '@/contexts/CallContext';

export default function CallButtons({
  targetUserId,
  floating = true,
  className = '',
}) {
  const { initiateCall, callState } = useCall();
  const isCallActive = callState !== 'idle';
  const [canCall, setCanCall] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!targetUserId) {
      setCanCall(true);
      return;
    }
    setLoading(true);
    fetch(`/api/users/${targetUserId}/can-call`)
      .then((res) => res.json())
      .then((data) => setCanCall(data.canCall ?? false))
      .catch(() => setCanCall(false))
      .finally(() => setLoading(false));
  }, [targetUserId]);

  const handleAudio = () => {
    if (targetUserId && canCall) initiateCall(targetUserId, 'audio');
  };

  const handleVideo = () => {
    if (targetUserId && canCall) initiateCall(targetUserId, 'video');
  };

  const isDisabled = !targetUserId || isCallActive || !canCall || loading;

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
        disabled={isDisabled}
        className="flex items-center gap-2 p-2 rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          loading
            ? 'Checking...'
            : !canCall
              ? 'Cannot call this user'
              : isCallActive
                ? 'Call in progress'
                : 'Start audio call'
        }
      >
        <PhoneIcon className="h-5 w-5" />
      </button>
      <button
        onClick={handleVideo}
        disabled={isDisabled}
        className="flex items-center gap-2 p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          loading
            ? 'Checking...'
            : !canCall
              ? 'Cannot call this user'
              : isCallActive
                ? 'Call in progress'
                : 'Start video call'
        }
      >
        <VideoCameraIcon className="h-5 w-5" />
      </button>
    </Container>
  );
}
