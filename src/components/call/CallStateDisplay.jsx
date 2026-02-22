'use client';

import { Phone, PhoneOff, Video, Mic, User, Check, X } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
        className="rounded-xl bg-slate-800 text-white p-6 sm:p-8 text-center"
        role="status"
        aria-live="polite"
        aria-label="Calling, waiting for response"
      >
        <div
          className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-slate-700"
          aria-hidden
        >
          <Phone className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse text-slate-400" strokeWidth={2} />
        </div>
        {targetName ? (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Calling {targetName}</h2>
            <p className="text-slate-400 mb-4">Waiting for response</p>
          </>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Calling...</h2>
            <p className="text-slate-400 mb-2">Waiting for response</p>
          </>
        )}
        <p className="text-slate-400 mb-2">Waiting for response</p>
        {offlineTargets?.length > 0 && (
          <div
            className="flex items-center justify-center gap-2 mb-4 p-3 rounded-lg bg-amber-900/40 text-amber-200 text-sm"
            role="alert"
          >
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            <span>User is offline. Call will keep ringing.</span>
          </div>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label="Cancel call"
        >
          <PhoneOff className="w-5 h-5" strokeWidth={2} />
          Cancel Call
        </button>
      </div>
    );
  }

  if (state === 'ringing') {
    return (
      <div
        className="rounded-xl bg-slate-800 text-white p-6 sm:p-8 text-center"
        role="alert"
        aria-live="assertive"
        aria-label="Incoming call"
      >
        <div className="flex flex-col items-center mb-6">
          <Avatar
            src={callerImage}
            alt={callerName || 'Caller'}
            size="2xl"
            fallback={callerName || '?'}
            className="ring-4 ring-slate-600 mb-4"
          />
          <h2 className="text-xl sm:text-2xl font-bold mb-1">Incoming Call</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="w-5 h-5 text-slate-400" strokeWidth={2} aria-hidden />
            <p className="text-slate-200 font-medium">{callerName || 'Unknown'}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            {callType === 'video' ? (
              <Video className="w-5 h-5" strokeWidth={2} aria-hidden />
            ) : (
              <Mic className="w-5 h-5" strokeWidth={2} aria-hidden />
            )}
            <p className="text-sm">{callType === 'video' ? 'Video' : 'Audio'} call</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onAccept}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Accept call"
          >
            <Check className="w-5 h-5" strokeWidth={2.5} />
            Accept
          </button>
          <button
            type="button"
            onClick={onReject}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label="Reject call"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
            Reject
          </button>
        </div>
      </div>
    );
  }

  return null;
}
