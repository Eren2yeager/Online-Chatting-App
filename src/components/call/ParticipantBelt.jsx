'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Avatar } from '@/components/ui';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

/**
 * Horizontal scrollable participant belt/strip
 * Shows participants as thumbnails with click-to-focus
 */
export default function ParticipantBelt({
  participants,
  focusedId,
  onFocus,
  localStream,
  remoteStreams,
  isMuted,
  isVideoOff,
  sessionUserId,
}) {
  const selfId = sessionUserId ? String(sessionUserId) : null;
  const beltVideoRefs = useRef(new Map());

  const beltParticipants = useMemo(() => {
    return participants.filter((p) => {
      const id = p.isLocal ? 'local' : String(p.userId);
      return id !== focusedId;
    });
  }, [participants, focusedId]);

  useEffect(() => {
    beltParticipants.forEach((p) => {
      if (p.isLocal) return;
      const el = beltVideoRefs.current.get(p.userId);
      const stream = remoteStreams.get(p.userId);
      if (el && stream && el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    });
  }, [beltParticipants, remoteStreams]);

  if (beltParticipants.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
      <div className="flex gap-2 px-2 min-w-max">
        {beltParticipants.map((p) => {
          const id = p.isLocal ? 'local' : String(p.userId);
          const stream = p.isLocal ? localStream : remoteStreams.get(p.userId);
          const hasVideo = stream?.getVideoTracks?.()?.some((t) => t.enabled);
          const isMutedP = p.isLocal ? isMuted : p.isMuted ?? false;
          const isVideoOffP = p.isLocal ? isVideoOff : p.isVideoOff ?? false;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onFocus(id)}
              className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-700 relative group hover:ring-2 hover:ring-blue-500 transition-all"
              aria-label={`Focus on ${p.name}`}
            >
              {hasVideo && !isVideoOffP ? (
                <video
                  ref={p.isLocal ? undefined : (el) => {
                    if (el && p.userId) {
                      beltVideoRefs.current.set(p.userId, el);
                      if (stream && el.srcObject !== stream) {
                        el.srcObject = stream;
                        el.play().catch(() => {});
                      }
                    } else if (!el && p.userId) {
                      beltVideoRefs.current.delete(p.userId);
                    }
                  }}
                  autoPlay
                  playsInline
                  muted={p.isLocal}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <Avatar
                    src={p.image}
                    alt={p.name}
                    size="lg"
                    fallback={p.name}
                    className="ring-2 ring-white/30"
                  />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                <p className="text-xs text-white truncate text-center font-medium">{p.name}</p>
              </div>
              <div className="absolute top-1 right-1 flex gap-0.5">
                {isMutedP ? (
                  <MicOff className="h-3 w-3 text-red-400" strokeWidth={3} />
                ) : (
                  <Mic className="h-3 w-3 text-green-400" strokeWidth={3} />
                )}
                {isVideoOffP || !hasVideo ? (
                  <VideoOff className="h-3 w-3 text-red-400" strokeWidth={3} />
                ) : (
                  <Video className="h-3 w-3 text-green-400" strokeWidth={3} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
