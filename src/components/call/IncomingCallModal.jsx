'use client';

import { useEffect } from 'react';
import { useCall } from '@/contexts/CallContext';
import { useRingtone } from './useRingtone';
import CallStateDisplay from './CallStateDisplay';

/**
 * Global incoming call modal overlay
 * Shows on top of everything when callState === 'ringing'
 */
export default function IncomingCallModal() {
  const { callState, callType, currentCall, participantsInfo, acceptCall, rejectCall } = useCall();
  const ringtoneRef = useRingtone('incoming', callState === 'ringing');

  const callerInfo = currentCall?.initiator
    ? participantsInfo.get(String(currentCall.initiator?._id || currentCall.initiator)) || {
        name: currentCall.initiator?.name || 'Unknown',
        image: currentCall.initiator?.image,
      }
    : null;

  if (callState !== 'ringing') return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incoming-call-title"
    >
      <div className="w-full max-w-md mx-4">
        <CallStateDisplay
          state="ringing"
          callType={callType}
          callerName={callerInfo?.name}
          callerImage={callerInfo?.image}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      </div>
    </div>
  );
}
