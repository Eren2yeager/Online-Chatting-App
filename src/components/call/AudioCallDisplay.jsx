'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui';
import { Mic, MicOff } from 'lucide-react';
import ParticipantBelt from './ParticipantBelt';

/**
 * Advanced audio call display with focus mode and participant belt
 * Shows large avatar of focused participant, others in belt
 */
export default function AudioCallDisplay({
  localStream,
  remoteStreams,
  participantsInfo = new Map(),
  isMuted,
  currentCall,
  sessionUserId,
}) {
  const { data: session } = useSession();
  const remoteAudiosRef = useRef(new Map());

  const selfId = sessionUserId || session?.user?.id ? String(sessionUserId || session.user.id) : null;
  const selfInfo = selfId
    ? { name: session?.user?.name || 'You', image: session?.user?.image }
    : { name: 'You', image: null };

  const getParticipantInfo = useCallback(
    (userId) => {
      const info = participantsInfo.get(String(userId));
      return info || { name: 'User', image: null, isMuted: false };
    },
    [participantsInfo]
  );

  const remoteEntries = useMemo(() => Array.from(remoteStreams.entries()), [remoteStreams]);
  const isDirectCall = remoteEntries.length === 1;

  const [focusedId, setFocusedId] = useState(null);

  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const el = remoteAudiosRef.current.get(userId);
      if (el && el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    });
  }, [remoteStreams]);

  const allParticipants = useMemo(() => {
    return [
      {
        id: 'local',
        userId: selfId,
        isLocal: true,
        name: selfInfo.name,
        image: selfInfo.image,
        stream: localStream,
        isMuted,
      },
      ...remoteEntries.map(([userId, stream]) => {
        const info = getParticipantInfo(userId);
        return {
          id: userId,
          userId,
          isLocal: false,
          name: info.name,
          image: info.image,
          stream,
          isMuted: info.isMuted ?? false,
        };
      }),
    ];
  }, [remoteEntries, selfId, selfInfo, localStream, isMuted, getParticipantInfo]);

  const defaultMainId = useMemo(() => {
    if (isDirectCall && remoteEntries.length > 0) {
      return remoteEntries[0][0]; // Remote for direct call
    }
    return allParticipants[0]?.id || null;
  }, [isDirectCall, remoteEntries, allParticipants]);

  const mainId = focusedId !== null ? focusedId : defaultMainId;
  const mainParticipant = allParticipants.find((p) => p.id === mainId);

  const handleFocus = useCallback((id) => {
    setFocusedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4" role="region" aria-label="Audio call participants">
      {/* Main focused participant */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="flex flex-col items-center gap-4">
          <Avatar
            src={mainParticipant?.image}
            alt={mainParticipant?.name || 'User'}
            size="2xl"
            fallback={mainParticipant?.name || '?'}
            className="ring-4 ring-blue-500/30"
          />
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">{mainParticipant?.name || 'User'}</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              {mainParticipant?.isMuted ? (
                <>
                  <MicOff className="h-5 w-5 text-red-500" strokeWidth={2.5} />
                  <span className="text-sm text-gray-600">Muted</span>
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 text-green-500" strokeWidth={2.5} />
                  <span className="text-sm text-gray-600">Speaking</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Participant belt */}
      {allParticipants.length > 1 && (
        <ParticipantBelt
          participants={allParticipants}
          focusedId={mainId}
          onFocus={handleFocus}
          localStream={localStream}
          remoteStreams={remoteStreams}
          isMuted={isMuted}
          isVideoOff={false}
          sessionUserId={selfId}
        />
      )}

      {/* Hidden audio elements */}
      <div className="sr-only" aria-hidden>
        {remoteEntries.map(([userId, stream]) => (
          <audio
            key={userId}
            ref={(el) => {
              if (el) {
                remoteAudiosRef.current.set(userId, el);
                if (stream && el.srcObject !== stream) {
                  el.srcObject = stream;
                  el.play().catch(() => {});
                }
              }
            }}
            autoPlay
            playsInline
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
