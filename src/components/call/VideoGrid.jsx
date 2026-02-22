'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui';
import { Mic, MicOff, Video, VideoOff, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';
import ParticipantBelt from './ParticipantBelt';

/**
 * Advanced video grid with focus mode and participant belt
 * - Direct call: Remote full, local small corner (clickable to swap)
 * - Group call: Focused participant large, others in scrollable belt
 */
export default function VideoGrid({
  localStream,
  remoteStreams,
  isMuted,
  isVideoOff,
  isScreenSharing,
  screenShareStream,
  localVideoRef: externalLocalVideoRef,
  participantsInfo = new Map(),
  currentCall,
  sessionUserId,
  showParticipantsBelt = true,
  onToggleBelt,
}) {
  const { data: session } = useSession();
  const internalLocalVideoRef = useRef(null);
  const localVideoRef = externalLocalVideoRef || internalLocalVideoRef;
  const remoteVideosRef = useRef(new Map());

  const selfId = sessionUserId || session?.user?.id ? String(sessionUserId || session.user.id) : null;
  const selfInfo = selfId
    ? {
        name: session?.user?.name || 'You',
        image: session?.user?.image,
      }
    : { name: 'You', image: null };

  const remoteEntries = useMemo(() => Array.from(remoteStreams.entries()), [remoteStreams]);
  const isDirectCall = remoteEntries.length === 1;

  // Focus state: 'local' | userId | null (null = default: remote for direct, first for group)
  const [focusedId, setFocusedId] = useState(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isVideoOff, localVideoRef]);

  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const el = remoteVideosRef.current.get(userId);
      if (el && el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    });
  }, [remoteStreams]);

  const getParticipantInfo = useCallback(
    (userId) => {
      const info = participantsInfo.get(String(userId));
      return info || { name: 'User', image: null, isMuted: false, isVideoOff: true };
    },
    [participantsInfo]
  );

  const allParticipants = useMemo(() => {
    // Use screen share stream if sharing, otherwise use local stream
    const localDisplayStream = isScreenSharing && screenShareStream ? screenShareStream : localStream;
    const list = [
      {
        id: 'local',
        userId: selfId,
        isLocal: true,
        name: selfInfo.name,
        image: selfInfo.image,
        stream: localDisplayStream,
        isMuted,
        isVideoOff,
        isScreenSharing,
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
          isVideoOff: info.isVideoOff ?? false,
        };
      }),
    ];
    return list;
  }, [remoteEntries, selfId, selfInfo, localStream, isMuted, isVideoOff, getParticipantInfo]);

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

  const renderMainVideo = (participant) => {
    if (!participant) return null;
    const hasVideo = participant.stream?.getVideoTracks?.()?.some((t) => t.enabled);
    const showVideo = hasVideo && (!participant.isVideoOff || participant.isScreenSharing);
    const attachLocalRef = participant.isLocal && mainId === 'local' && !participant.isScreenSharing;

    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
        {showVideo ? (
          <video
            ref={attachLocalRef ? localVideoRef : participant.isLocal ? undefined : (el) => {
              if (el && participant.userId) {
                remoteVideosRef.current.set(participant.userId, el);
                if (participant.stream && el.srcObject !== participant.stream) {
                  el.srcObject = participant.stream;
                  el.play().catch(() => {});
                }
              }
            }}
            autoPlay
            playsInline
            muted={participant.isLocal}
            className="w-full h-full object-cover"
            aria-label={`${participant.name}'s ${participant.isScreenSharing ? 'screen' : 'video'}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
            <Avatar
              src={participant.image}
              alt={participant.name}
              size="2xl"
              fallback={participant.name}
              className="ring-4 ring-white/30"
            />
            <span className="mt-4 text-lg font-semibold text-white">{participant.name}</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg">
          <span className="text-sm font-medium text-white flex-1">{participant.name}</span>
          <div className="flex items-center gap-1.5">
            {participant.isScreenSharing && (
              <ComputerDesktopIcon className="h-4 w-4 text-blue-400" strokeWidth={2.5} />
            )}
            {participant.isMuted ? (
              <MicOff className="h-4 w-4 text-red-400" strokeWidth={2.5} />
            ) : (
              <Mic className="h-4 w-4 text-green-400" strokeWidth={2.5} />
            )}
            {participant.isScreenSharing ? null : participant.isVideoOff || !hasVideo ? (
              <VideoOff className="h-4 w-4 text-red-400" strokeWidth={2.5} />
            ) : (
              <Video className="h-4 w-4 text-green-400" strokeWidth={2.5} />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCornerPreview = (participant) => {
    if (!participant) return null;
    const hasVideo = participant.stream?.getVideoTracks?.()?.some((t) => t.enabled);
    const showVideo = hasVideo && !participant.isVideoOff;
    const attachLocalRef = participant.isLocal && mainId !== 'local';

    return (
      <button
        type="button"
        onClick={() => handleFocus(participant.id)}
        className="relative w-24 h-20 rounded-lg overflow-hidden bg-slate-800 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
        aria-label={`Focus on ${participant.name}`}
      >
        {showVideo ? (
          <video
            ref={attachLocalRef ? localVideoRef : participant.isLocal ? undefined : (el) => {
              if (el && participant.userId) {
                remoteVideosRef.current.set(participant.userId, el);
                if (participant.stream && el.srcObject !== participant.stream) {
                  el.srcObject = participant.stream;
                  el.play().catch(() => {});
                }
              }
            }}
            autoPlay
            playsInline
            muted={participant.isLocal}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-700">
            <Avatar src={participant.image} alt={participant.name} size="md" fallback={participant.name} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
          <p className="text-xs text-white truncate text-center">{participant.name}</p>
        </div>
        <div className="absolute top-1 right-1 flex gap-0.5">
          {participant.isMuted ? (
            <MicOff className="h-2.5 w-2.5 text-red-400" strokeWidth={3} />
          ) : (
            <Mic className="h-2.5 w-2.5 text-green-400" strokeWidth={3} />
          )}
        </div>
      </button>
    );
  };

  if (allParticipants.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg">
        <p className="text-gray-400">No participants</p>
      </div>
    );
  }

  // Direct call layout: main + corner preview
  if (isDirectCall) {
    const otherParticipant = allParticipants.find((p) => p.id !== mainId);
    return (
      <div className="w-full h-full flex flex-col gap-2">
        <div className="flex-1 min-h-0 relative">
          {renderMainVideo(mainParticipant)}
          {otherParticipant && (
            <div className="absolute top-3 left-3 z-10">
              {renderCornerPreview(otherParticipant)}
            </div>
          )}
        </div>
        {allParticipants.length > 2 && showParticipantsBelt && (
          <ParticipantBelt
            participants={allParticipants}
            focusedId={mainId}
            onFocus={handleFocus}
            localStream={localStream}
            remoteStreams={remoteStreams}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            sessionUserId={selfId}
          />
        )}
      </div>
    );
  }

  // Group call layout: main + belt
  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex-1 min-h-0 relative">
        {renderMainVideo(mainParticipant)}
        {onToggleBelt && (
          <button
            type="button"
            onClick={onToggleBelt}
            className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
            title={showParticipantsBelt ? 'Hide participants' : 'Show participants'}
            aria-label={showParticipantsBelt ? 'Hide participants' : 'Show participants'}
          >
            {showParticipantsBelt ? (
              <ChevronDownIcon className="h-5 w-5" strokeWidth={2} />
            ) : (
              <ChevronUpIcon className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
        )}
      </div>
      {showParticipantsBelt && (
        <ParticipantBelt
          participants={allParticipants}
          focusedId={mainId}
          onFocus={handleFocus}
          localStream={localStream}
          remoteStreams={remoteStreams}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          sessionUserId={selfId}
        />
      )}
    </div>
  );
}
