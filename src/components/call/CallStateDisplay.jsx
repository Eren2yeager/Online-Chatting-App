'use client';

import { Avatar } from '@/components/ui';
import { Phone, Video, Check, X, PhoneOff } from 'lucide-react';
import { useRingtone } from './useRingtone';

/**
 * Compact display for dialing + incoming call inside CallWindow
 * Shows avatar, call type, and action buttons
 */
export default function CallStateDisplay({
  state,
  callType,
  callerName,
  callerImage,
  targetName,
  targetImage,
  offlineTargets = [],
  isFullscreen = false,
  onAccept,
  onReject,
  onCancel,
}) {
  const isRinging = state === 'ringing';
  const isCalling = state === 'calling';
  useRingtone('incoming', isRinging);
  useRingtone('dialing', isCalling);

  const name = isRinging ? callerName : targetName;
  const image = isRinging ? callerImage : targetImage;
  const label = isRinging ? 'Incoming' : 'Calling';

  const avatarSize = isFullscreen ? '2xl' : 'xl';
  const iconSize = isFullscreen ? 'h-6 w-6' : 'h-3.5 w-3.5';
  const textSize = isFullscreen ? 'text-lg' : 'text-sm';
  const subTextSize = isFullscreen ? 'text-base' : 'text-xs';
  const btnPadding = isFullscreen ? 'p-5' : 'p-3';
  const btnIconSize = isFullscreen ? 'h-8 w-8' : 'h-5 w-5';
  const gap = isFullscreen ? 'gap-4 mt-6' : 'gap-2 mt-4';

  return (
    <div
      className="flex flex-col items-center justify-center py-4 px-2 min-h-[160px] w-full"
      role="status"
      aria-live="polite"
    >
      <Avatar
        src={image}
        alt={name || '?'}
        size={avatarSize}
        fallback={name || '?'}
        className="ring-2 ring-slate-500/50 mb-3"
      />
      <p className={`${textSize} font-semibold text-slate-800 truncate max-w-full text-center`}>
        {name || '…'}
      </p>
      <p className={`${subTextSize} text-slate-500 flex items-center justify-center gap-1 mt-0.5`}>
        {callType === 'video' ? <Video className={iconSize} /> : <Phone className={iconSize} />}
        {callType === 'video' ? 'Video' : 'Audio'} • {label}
      </p>
      {offlineTargets?.length > 0 && (
        <p className={`${subTextSize} text-amber-600 mt-1`}>Offline</p>
      )}
      <div className={`flex items-center justify-center ${gap}`}>
        {isRinging ? (
          <>
            <button
              type="button"
              onClick={onReject}
              className={`${btnPadding} rounded-full bg-red-500 text-white hover:bg-red-600`}
              aria-label="Reject"
            >
              <X className={btnIconSize} />
            </button>
            <button
              type="button"
              onClick={onAccept}
              className={`${btnPadding} rounded-full bg-emerald-500 text-white hover:bg-emerald-600`}
              aria-label="Accept"
            >
              <Check className={btnIconSize} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className={`${btnPadding} rounded-full bg-red-500 text-white hover:bg-red-600`}
            aria-label="Cancel"
          >
            <div className="flex items-center gap-2">
            <PhoneOff className={btnIconSize} title="Cancel" />
            <span className={`text-sm font-medium ${textSize}`}>Cancel</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
