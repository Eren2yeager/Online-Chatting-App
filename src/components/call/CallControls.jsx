'use client';

import {
  PhoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { Mic, MicOff, VideoOff } from 'lucide-react';

export default function CallControls({
  callType,
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveCall,
  onUpgradeToVideo,
  showAddParticipant = false,
  onAddParticipant,
}) {
  return (
    <div
      className="flex justify-center flex-wrap gap-2 sm:gap-3"
      role="group"
      aria-label="Call controls"
    >
      {callType === 'audio' && onUpgradeToVideo && (
        <button
          type="button"
          onClick={onUpgradeToVideo}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          title="Upgrade to video call"
          aria-label="Upgrade to video call"
        >
          <VideoCameraIcon className="h-5 w-5" aria-hidden />
          <span className="text-sm font-medium">Video</span>
        </button>
      )}
      <button
        type="button"
        onClick={onToggleAudio}
        className={`flex items-center justify-center gap-2 p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isMuted
            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400'
            : 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400'
        }`}
        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        aria-pressed={isMuted}
      >
        {isMuted ? (
          <MicOff className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        ) : (
          <Mic className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        )}
      </button>

      {callType === 'video' && (
        <>
          <button
            type="button"
            onClick={onToggleVideo}
            className={`flex items-center justify-center gap-2 p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isVideoOff
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400'
                : 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            aria-pressed={isVideoOff}
          >
            {isVideoOff ? (
              <VideoOff className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            ) : (
              <VideoCameraIcon className="h-5 w-5" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`flex items-center justify-center gap-2 p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isScreenSharing
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
                : 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            aria-pressed={isScreenSharing}
          >
            <ComputerDesktopIcon className="h-5 w-5" aria-hidden />
          </button>

          {showAddParticipant && onAddParticipant && (
            <button
              type="button"
              onClick={onAddParticipant}
              className="flex items-center justify-center gap-2 p-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
              title="Add participants"
              aria-label="Add participants"
            >
              <UserPlusIcon className="h-5 w-5" aria-hidden />
              <span className="text-sm font-medium hidden sm:inline">Add</span>
            </button>
          )}
        </>
      )}

      {showAddParticipant && onAddParticipant && callType === 'audio' && (
        <button
          type="button"
          onClick={onAddParticipant}
          className="flex items-center justify-center gap-2 p-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
          title="Add participants"
          aria-label="Add participants"
        >
          <UserPlusIcon className="h-5 w-5" aria-hidden />
          <span className="text-sm font-medium hidden sm:inline">Add</span>
        </button>
      )}

      <button
        type="button"
        onClick={onLeaveCall}
        className="flex items-center justify-center gap-2 p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        title="End call"
        aria-label="End call"
      >
        <PhoneIcon className="h-5 w-5 rotate-[135deg]" aria-hidden />
        <span className="text-sm font-medium">End</span>
      </button>
    </div>
  );
}
