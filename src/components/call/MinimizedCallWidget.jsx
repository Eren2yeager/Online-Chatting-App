'use client';

import { useMemo } from 'react';
import { useCall } from '@/contexts/CallContext';
import { useCallDuration } from './useCallDuration';
import { Avatar } from '@/components/ui';
import { ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Floating minimized call widget
 * Shows small preview, duration, and restore/end buttons
 */
export default function MinimizedCallWidget({ onRestore, onEnd }) {
  const {
    callState,
    callType,
    localStream,
    remoteStreams,
    participantsInfo,
    currentCall,
    localVideoRef,
  } = useCall();
  const { roomDurationFormatted } = useCallDuration(currentCall, callState);

  const remoteEntries = useMemo(() => Array.from(remoteStreams.entries()), [remoteStreams]);
  const mainParticipant = useMemo(() => {
    if (remoteEntries.length === 0) return null;
    const [userId] = remoteEntries[0];
    const info = participantsInfo.get(String(userId));
    return {
      userId,
      name: info?.name || 'User',
      image: info?.image,
      stream: remoteStreams.get(userId),
    };
  }, [remoteEntries, participantsInfo, remoteStreams]);

  if (callState !== 'active') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden min-w-[200px]">
      <div className="flex items-center gap-3 p-3">
        {/* Preview */}
        <div className="relative w-16 h-12 rounded overflow-hidden bg-slate-800 flex-shrink-0">
          {callType === 'video' && mainParticipant?.stream ? (
            <video
              srcObject={mainParticipant.stream}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Avatar
                src={mainParticipant?.image}
                alt={mainParticipant?.name || 'Call'}
                size="sm"
                fallback={mainParticipant?.name || '?'}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {callType === 'video' ? 'Video Call' : 'Audio Call'}
          </p>
          <p className="text-xs text-gray-500">{roomDurationFormatted}</p>
          {mainParticipant && (
            <p className="text-xs text-gray-600 truncate">{mainParticipant.name}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRestore}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Restore call"
            aria-label="Restore call window"
          >
            <ChevronUpIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="p-1.5 rounded hover:bg-red-50 transition-colors"
            title="End call"
            aria-label="End call"
          >
            <XMarkIcon className="h-5 w-5 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
