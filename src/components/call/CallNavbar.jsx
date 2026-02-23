'use client';

import { useMemo } from 'react';
import { useCall } from '@/contexts/CallContext';
import { useCallDuration } from './useCallDuration';
import { Avatar } from '@/components/ui';
import { Mic, MicOff, Video, VideoOff, ChevronUpIcon } from 'lucide-react';
import { PhoneIcon , XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Navbar-like component for minimized call
 * Shows above main navbar, displays call info and important controls
 */
export default function CallNavbar({ onRestore, onEnd }) {
  const {
    callState,
    callType,
    localStream,
    remoteStreams,
    participantsInfo,
    currentCall,
    isMuted,
    isVideoOff,
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
      isMuted: info?.isMuted ?? false,
      isVideoOff: info?.isVideoOff ?? false,
    };
  }, [remoteEntries, participantsInfo]);

  if (callState !== 'active') return null;

  return (
    <div className="w-full bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-lg border-b border-slate-600 flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Call info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {callType === 'video' && mainParticipant ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-600 flex-shrink-0">
                {mainParticipant.image ? (
                  <img src={mainParticipant.image} alt={mainParticipant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg font-semibold">{mainParticipant.name[0]}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                {callType === 'video' ? (
                  <Video className="h-5 w-5" strokeWidth={2} />
                ) : (
                  <PhoneIcon className="h-5 w-5" />
                )}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">
                  {mainParticipant?.name || `${callType === 'video' ? 'Video' : 'Audio'} Call`}
                </span>
                {mainParticipant && (
                  <div className="flex items-center gap-1">
                    {mainParticipant.isMuted ? (
                      <MicOff className="h-3.5 w-3.5 text-red-400" strokeWidth={2.5} />
                    ) : (
                      <Mic className="h-3.5 w-3.5 text-green-400" strokeWidth={2.5} />
                    )}
                    {callType === 'video' && (
                      mainParticipant.isVideoOff ? (
                        <VideoOff className="h-3.5 w-3.5 text-red-400" strokeWidth={2.5} />
                      ) : (
                        <Video className="h-3.5 w-3.5 text-green-400" strokeWidth={2.5} />
                      )
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>{callType === 'video' ? 'Video' : 'Audio'} call</span>
                <span>•</span>
                <span className="font-mono">{roomDurationFormatted}</span>
                {remoteEntries.length > 1 && (
                  <>
                    <span>•</span>
                    <span>{remoteEntries.length + 1} participants</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onRestore}
            className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
            title="Restore call window"
            aria-label="Restore call window"
          >
            <ChevronUpIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
            title="End call"
            aria-label="End call"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
