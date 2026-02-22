'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

const THUMB_SIZE = 120;

/**
 * Direct call: receiver full, caller small on side. Click to swap.
 * Group call: one main full, others as movable corner-snapping thumbnails.
 */
export default function VideoGrid({
  localStream,
  remoteStreams,
  isMuted,
  isVideoOff,
  localVideoRef: externalLocalVideoRef,
  participantsInfo = new Map(),
  currentCall,
}) {
  const { data: session } = useSession();
  const internalLocalVideoRef = useRef(null);
  const localVideoRef = externalLocalVideoRef || internalLocalVideoRef;
  const remoteVideosRef = useRef(new Map());
  const containerRef = useRef(null);

  const selfId = session?.user?.id ? String(session.user.id) : null;
  const selfInfo = selfId
    ? { name: session.user.name || 'You', image: session.user.image }
    : { name: 'You', image: null };

  const remoteEntries = useMemo(() => Array.from(remoteStreams.entries()), [remoteStreams]);
  const isDirectCall = remoteEntries.length === 1;

  const [focusedId, setFocusedId] = useState(null); // 'local' | userId | null
  const [thumbPositions, setThumbPositions] = useState({}); // { id: cornerIndex }
  const [draggingThumb, setDraggingThumb] = useState(null);
  const lastDragRef = useRef({ x: 0, y: 0 });

  const isInitiator = currentCall?.initiator && selfId && String(currentCall.initiator?._id || currentCall.initiator) === selfId;
  const defaultMainId = isDirectCall
    ? isInitiator
      ? (remoteEntries[0]?.[0] ?? null)
      : 'local'
    : null;
  const mainId = focusedId !== null ? focusedId : defaultMainId;
  const isLocalMain = mainId === 'local';

  const getParticipantInfo = useCallback(
    (userId) => {
      const info = participantsInfo.get(String(userId));
      return info || { name: 'User', image: null, isMuted: false, isVideoOff: true };
    },
    [participantsInfo]
  );

  const getCornerStyle = useCallback((cornerIdx) => {
    const gap = 8;
    const idx = cornerIdx % 4;
    const map = [
      { top: gap, left: gap },
      { top: gap, right: gap },
      { bottom: gap, left: gap },
      { bottom: gap, right: gap },
    ];
    return map[idx] ?? map[0];
  }, []);

  const handleThumbDragStart = useCallback((e, id) => {
    setDraggingThumb(id);
    lastDragRef.current = { x: e.clientX ?? e.touches?.[0]?.clientX, y: e.clientY ?? e.touches?.[0]?.clientY };
  }, []);

  useEffect(() => {
    if (!draggingThumb || !containerRef.current) return;
    const container = containerRef.current;
    const gap = 16;
    const onMove = (e) => {
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      const rect = container.getBoundingClientRect();
      const cx = x - rect.left;
      const cy = y - rect.top;
      const cw = rect.width;
      const ch = rect.height;
      const corners = [
        { i: 0, x: THUMB_SIZE / 2 + gap, y: THUMB_SIZE * 0.4 + gap },
        { i: 1, x: cw - THUMB_SIZE / 2 - gap, y: THUMB_SIZE * 0.4 + gap },
        { i: 2, x: THUMB_SIZE / 2 + gap, y: ch - THUMB_SIZE * 0.4 - gap },
        { i: 3, x: cw - THUMB_SIZE / 2 - gap, y: ch - THUMB_SIZE * 0.4 - gap },
      ];
      let nearest = corners[0];
      let minD = Infinity;
      for (const c of corners) {
        const d = (cx - c.x) ** 2 + (cy - c.y) ** 2;
        if (d < minD) {
          minD = d;
          nearest = c;
        }
      }
      setThumbPositions((prev) => ({ ...prev, [draggingThumb]: nearest.i }));
    };
    const onEnd = () => setDraggingThumb(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [draggingThumb]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) localVideoRef.current.srcObject = localStream;
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

  const renderTile = (id, isLocal, stream, info, isMain, attachRef = false) => {
    const hasVideo = isLocal
      ? stream && !isVideoOff && stream.getVideoTracks?.()?.length > 0
      : stream?.getVideoTracks?.()?.some((t) => t.enabled);
    const isMutedRemote = info?.isMuted ?? false;

    const content = (
      <>
        {stream && hasVideo ? (
          isLocal ? (
            <video
              ref={attachRef ? localVideoRef : undefined}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              aria-label="Your video"
            />
          ) : (
            <video
              ref={(el) => {
                if (el) {
                  remoteVideosRef.current.set(id, el);
                  if (stream && el.srcObject !== stream) {
                    el.srcObject = stream;
                    el.play().catch(() => {});
                  }
                }
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              aria-label={`${info?.name || 'User'}'s video`}
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-700">
            <Avatar src={info?.image} alt={info?.name || '?'} size={isMain ? '2xl' : 'lg'} fallback={info?.name || '?'} className="ring-2 ring-white/50" />
            <span className="mt-1 text-xs font-medium text-white truncate max-w-full px-1">{info?.name || 'You'}</span>
          </div>
        )}
        <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-1 rounded text-[10px]">
          <span className="font-medium text-white truncate flex-1">{info?.name || 'You'}</span>
          <span className="flex items-center gap-0.5">
            {isLocal ? (isMuted ? <MicOff className="h-2.5 w-2.5 text-red-400" /> : <Mic className="h-2.5 w-2.5 text-green-400" />) : (isMutedRemote ? <MicOff className="h-2.5 w-2.5 text-red-400" /> : <Mic className="h-2.5 w-2.5 text-green-400" />)}
            {isLocal ? (isVideoOff ? <VideoOff className="h-2.5 w-2.5 text-red-400" /> : <Video className="h-2.5 w-2.5 text-green-400" />) : (info?.isVideoOff !== false && !hasVideo ? <VideoOff className="h-2.5 w-2.5 text-red-400" /> : <Video className="h-2.5 w-2.5 text-green-400" />)}
          </span>
        </div>
      </>
    );

    return content;
  };

  if (remoteEntries.length === 0) {
    return (
      <div ref={containerRef} className="relative w-full h-full min-h-[160px] rounded-lg overflow-hidden bg-slate-800">
        <div className="absolute inset-0">{renderTile('local', true, localStream, selfInfo, true, true)}</div>
      </div>
    );
  }

  if (isDirectCall) {
    const [remoteId, remoteStream] = remoteEntries[0];
    const remoteInfo = getParticipantInfo(remoteId);
    return (
      <div ref={containerRef} className="relative w-full h-full min-h-[160px] rounded-lg overflow-hidden bg-slate-800">
        <div className="absolute inset-0">
          {isLocalMain ? renderTile('local', true, localStream, selfInfo, true, true) : renderTile(remoteId, false, remoteStream, remoteInfo, true)}
        </div>
        <button
          type="button"
          onClick={() => setFocusedId(isLocalMain ? remoteId : 'local')}
          className="absolute left-2 bottom-2 w-24 h-20 sm:w-28 sm:h-24 rounded-lg overflow-hidden border-2 border-white/80 shadow-lg hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 z-10 bg-slate-700 relative"
        >
          {isLocalMain ? renderTile(remoteId, false, remoteStream, remoteInfo, false) : renderTile('local', true, localStream, selfInfo, false, true)}
        </button>
      </div>
    );
  }

  // Group call: one main + movable corner thumbnails
  const allTiles = [
    { id: 'local', isLocal: true, stream: localStream, info: selfInfo },
    ...remoteEntries.map(([userId, stream]) => ({ id: userId, isLocal: false, stream, info: getParticipantInfo(userId) })),
  ];
  const mainTile = mainId ? allTiles.find((t) => t.id === mainId || (mainId === 'local' && t.isLocal)) : allTiles[0];
  const thumbTiles = allTiles.filter((t) => t.id !== mainTile?.id);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[200px] rounded-lg overflow-hidden bg-slate-800">
      <div className="absolute inset-0">
        {mainTile && renderTile(mainTile.id, mainTile.isLocal, mainTile.stream, mainTile.info, true, mainTile.isLocal)}
      </div>
      {thumbTiles.map((t, i) => {
        const cornerIdx = thumbPositions[t.id] ?? i;
        const style = {
          position: 'absolute',
          width: THUMB_SIZE,
          height: THUMB_SIZE * 0.8,
          ...getCornerStyle(cornerIdx),
          zIndex: 10,
        };
        return (
          <button
            key={t.id}
            id={`thumb-${t.id}`}
            type="button"
            onClick={() => setFocusedId(t.id)}
            onMouseDown={(e) => handleThumbDragStart(e, t.id)}
            onTouchStart={(e) => handleThumbDragStart(e, t.id)}
            className="rounded-lg overflow-hidden border-2 border-white/80 shadow-lg hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-700 cursor-grab active:cursor-grabbing"
            style={style}
          >
            <div className="relative w-full h-full">
              {renderTile(t.id, t.isLocal, t.stream, t.info, false, t.isLocal)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
