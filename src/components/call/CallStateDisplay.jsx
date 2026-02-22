'use client';

import { Phone, PhoneOff, Video, Mic, User, Check, X } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Compact dialing (calling) and incoming call UI.
 * Fills the call window with small icons and auto width/height.
 */
export default function CallStateDisplay({
  state,
  callType,
  callerName,
  callerImage,
  targetName,
  offlineTargets = [],
  onAccept,
  onReject,
  onCancel,
}) {
  if (state === 'calling') {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center gap-3 p-4 rounded-lg bg-slate-800/95 text-white"
        role="status"
        aria-live="polite"
        aria-label="Calling, waiting for response"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-700 flex-shrink-0" aria-hidden>
          <Phone className="w-6 h-6 animate-pulse text-slate-300" strokeWidth={2} />
        </div>
        <h2 className="text-base font-semibold truncate max-w-full text-center">
          Calling{targetName ? ` ${targetName}` : '...'}
        </h2>
        <p className="text-xs text-slate-400">Waiting for response</p>
        {offlineTargets?.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-amber-900/50 text-amber-200 text-xs" role="alert">
            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
            <span>User offline – ringing</span>
          </div>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Cancel call"
        >
          <PhoneOff className="w-4 h-4" strokeWidth={2} />
          Cancel
        </button>
      </div>
    );
  }

  if (state === 'ringing') {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center gap-3 p-4 rounded-lg bg-slate-800/95 text-white"
        role="alert"
        aria-live="assertive"
        aria-label="Incoming call"
      >
        <Avatar
          src={callerImage}
          alt={callerName || 'Caller'}
          size="lg"
          fallback={callerName || '?'}
          className="ring-2 ring-slate-600 flex-shrink-0"
        />
        <h2 className="text-base font-semibold">Incoming Call</h2>
        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4 text-slate-400" strokeWidth={2} aria-hidden />
          <p className="text-sm text-slate-200 truncate max-w-[180px]">{callerName || 'Unknown'}</p>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          {callType === 'video' ? (
            <Video className="w-4 h-4" strokeWidth={2} aria-hidden />
          ) : (
            <Mic className="w-4 h-4" strokeWidth={2} aria-hidden />
          )}
          <p className="text-xs">{callType === 'video' ? 'Video' : 'Audio'}</p>
        </div>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={onAccept}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Accept call"
          >
            <Check className="w-4 h-4" strokeWidth={2.5} />
            Accept
          </button>
          <button
            type="button"
            onClick={onReject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Reject call"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
            Reject
          </button>
        </div>
      </div>
    );
  }

  return null;
}
