'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useCall } from '@/contexts/CallContext';
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Bars3Icon,
  Square2StackIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import {
  VideoGrid,
  AudioCallDisplay,
  CallControls,
  CallStateDisplay,
} from './index';
import { useRingtone } from './useRingtone';
import { useCallDuration } from './useCallDuration';
import AddParticipantsModal from './AddParticipantsModal';
import CallNavbar from './CallNavbar';

const CORNERS = [
  { x: 16, y: 16, label: 'top-left' },
  { x: -1, y: 16, label: 'top-right' },
  { x: 16, y: -1, label: 'bottom-left' },
  { x: -1, y: -1, label: 'bottom-right' },
];
const SMALL_WIDTH = 300;
const SMALL_HEIGHT = 220;
const SMALL_EXPANDED_HEIGHT = 480;
const GAP = 16;

function getCornerPosition(cornerIndex) {
  if (typeof window === 'undefined') return { x: 16, y: 76 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const headerHeight = 60;
  const c = CORNERS[cornerIndex];
  return {
    x: c.x < 0 ? Math.max(GAP, vw - SMALL_WIDTH - GAP) : Math.max(GAP, c.x),
    y: c.y < 0 ? Math.max(headerHeight + GAP, vh - SMALL_EXPANDED_HEIGHT - GAP) : Math.max(headerHeight + GAP, c.y),
  };
}

function snapToNearestCorner(x, y) {
  if (typeof window === 'undefined') return 0;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const headerHeight = 60; // Account for navbar/header
  const corners = [
    { i: 0, x: GAP, y: headerHeight + GAP },
    { i: 1, x: vw - SMALL_WIDTH - GAP, y: headerHeight + GAP },
    { i: 2, x: GAP, y: vh - SMALL_EXPANDED_HEIGHT - GAP },
    { i: 3, x: vw - SMALL_WIDTH - GAP, y: vh - SMALL_EXPANDED_HEIGHT - GAP },
  ];
  let nearest = corners[0];
  let minD = Infinity;
  for (const c of corners) {
    const d = (x - c.x) ** 2 + (y - c.y) ** 2;
    if (d < minD) {
      minD = d;
      nearest = c;
    }
  }
  return nearest.i;
}

export default function CallWindow({
  defaultTargetUserId,
  defaultCallType = 'audio',
  showInitiatorIfIdle = false,
}) {
  const {
    callState,
    callType,
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    screenShareStream,
    localVideoRef,
    participantsInfo,
    offlineTargets,
    currentCall,
    initiateCall,
    acceptCall,
    rejectCall,
    cancelCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    upgradeCallType,
  } = useCall();
  const { data: session } = useSession();

  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [cornerIndex, setCornerIndex] = useState(3);
  const [pos, setPos] = useState(() => getCornerPosition(3));
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [showParticipantsBelt, setShowParticipantsBelt] = useState(true);
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const posRef = useRef(pos);
  posRef.current = pos;

  // Ringtones
  useRingtone('dialing', callState === 'calling');
  useRingtone('incoming', callState === 'ringing');

  // Duration tracking
  const { roomDurationFormatted, userPresenceTimeFormatted } = useCallDuration(
    currentCall,
    callState
  );

  const shouldShow = useMemo(
    () => ['calling', 'ringing', 'active'].includes(callState),
    [callState]
  );

  useEffect(() => {
    setVisible(shouldShow);
    if (shouldShow) setMinimized(false);
  }, [shouldShow]);

  useEffect(() => {
    setPos(getCornerPosition(cornerIndex));
  }, [cornerIndex]);

  useEffect(() => {
    const headerHeight = 60;
    const onMouseMove = (e) => {
      if (draggingRef.current) {
        const dx = e.clientX - lastRef.current.x;
        const dy = e.clientY - lastRef.current.y;
        lastRef.current = { x: e.clientX, y: e.clientY };
        setPos((p) => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          return {
            x: Math.max(GAP, Math.min(p.x + dx, vw - SMALL_WIDTH - GAP)),
            y: Math.max(headerHeight + GAP, Math.min(p.y + dy, vh - SMALL_EXPANDED_HEIGHT - GAP)),
          };
        });
      }
    };
    const onMouseUp = () => {
      if (draggingRef.current) {
        const p = posRef.current;
        setCornerIndex(snapToNearestCorner(p.x, p.y));
        draggingRef.current = false;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      if (draggingRef.current) e.preventDefault();
      const t = e.touches[0];
      if (draggingRef.current) {
        const headerHeight = 60;
        const dx = t.clientX - lastRef.current.x;
        const dy = t.clientY - lastRef.current.y;
        lastRef.current = { x: t.clientX, y: t.clientY };
        setPos((p) => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          return {
            x: Math.max(GAP, Math.min(p.x + dx, vw - SMALL_WIDTH - GAP)),
            y: Math.max(headerHeight + GAP, Math.min(p.y + dy, vh - SMALL_EXPANDED_HEIGHT - GAP)),
          };
        });
      }
    };
    const onTouchEnd = () => {
      if (draggingRef.current) {
        const p = posRef.current;
        setCornerIndex(snapToNearestCorner(p.x, p.y));
        draggingRef.current = false;
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const startDrag = (e) => {
    if (isFullscreen) return;
    draggingRef.current = true;
    lastRef.current = {
      x: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
      y: e.clientY ?? e.touches?.[0]?.clientY ?? 0,
    };
  };

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    } else {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    el.addEventListener('fullscreenchange', onFsChange);
    return () => el.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const togglePip = useCallback(async () => {
    if (!localVideoRef?.current || !localStream) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else {
        await localVideoRef.current.requestPictureInPicture();
        setIsPip(true);
      }
    } catch (err) {
      console.warn('PiP not supported:', err);
    }
  }, [localStream, localVideoRef]);

  useEffect(() => {
    const onLeavePip = () => setIsPip(false);
    document.addEventListener('leavepictureinpicture', onLeavePip);
    return () => document.removeEventListener('leavepictureinpicture', onLeavePip);
  }, []);

  // Auto PiP when user leaves tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        callState === 'active' &&
        callType === 'video' &&
        localStream &&
        localVideoRef?.current &&
        !document.pictureInPictureElement
      ) {
        localVideoRef.current.requestPictureInPicture().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [callState, callType, localStream, localVideoRef]);

  const handleCloseClick = () => {
    setShowEndConfirm(true);
  };

  const handleCloseConfirm = useCallback(
    (confirmed) => {
      setShowEndConfirm(false);
      if (!confirmed) return;
      if (document.pictureInPictureElement) document.exitPictureInPicture();
      setMinimized(false);
      setIsFullscreen(false);
      setIsPip(false);
      setVisible(false);
      leaveCall();
    },
    [leaveCall]
  );

  const handleClose = useCallback(() => {
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    setMinimized(false);
    setIsFullscreen(false);
    setIsPip(false);
    setVisible(false);
    leaveCall();
  }, [leaveCall]);

  const handleAccept = () => acceptCall();
  const handleReject = () => rejectCall();
  const handleCancel = () => cancelCall();

  const handleStartDefault = () => {
    if (defaultTargetUserId) initiateCall(defaultTargetUserId, defaultCallType);
  };

  const callerInfo = useMemo(() => {
    if (callState !== 'ringing' || !currentCall) return null;
    const initiatorId = currentCall.initiator?._id || currentCall.initiator;
    return (
      participantsInfo.get(String(initiatorId)) || {
        name: currentCall.initiator?.name || 'Unknown',
        image: currentCall.initiator?.image,
      }
    );
  }, [callState, currentCall, participantsInfo]);

  const targetName = useMemo(() => {
    if (callState !== 'calling' || !currentCall?.participants) return null;
    const target = currentCall.participants.find(
      (p) => String(p.userId?._id || p.userId) !== session?.user?.id
    );
    return target?.userId?.name || null;
  }, [callState, currentCall?.participants, session?.user?.id]);

  if (!visible && !showInitiatorIfIdle) return null;

  const headerLabel =
    callState === 'idle'
      ? 'Ready'
      : callState === 'ringing'
        ? 'Incoming Call'
        : callState === 'calling'
          ? 'Calling'
          : 'In Call';

  const isSmallMode = !isFullscreen;
  const width = isSmallMode ? SMALL_WIDTH : '100%';
  const height = isSmallMode ? (minimized ? 56 : SMALL_EXPANDED_HEIGHT) : '100%';

  const windowStyles = isFullscreen
    ? { position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9999 }
    : {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width,
        height,
        minWidth: SMALL_WIDTH,
        maxWidth: isSmallMode ? SMALL_WIDTH : '100%',
        zIndex: 50,
      };

  return (
    <>
      {/* Minimized navbar */}
      {minimized && callState === 'active' && (
        <CallNavbar onRestore={() => setMinimized(false)} onEnd={handleCloseClick} />
      )}

      {/* Main call window - always mounted when active to keep audio playing */}
      {(callState === 'active' || !minimized) && (
        <div
          ref={containerRef}
          className="call-window-container"
          style={minimized ? { ...windowStyles, opacity: 0, pointerEvents: 'none', position: 'fixed', left: '-9999px' } : windowStyles}
          role="dialog"
          aria-label={`Call window: ${headerLabel}`}
          aria-modal="true"
          aria-hidden={minimized}
        >
          <div className="flex flex-col h-full w-full rounded-xl shadow-2xl border border-gray-200 bg-white overflow-hidden min-w-0 min-h-0">
            <header
              ref={dragRef}
              onMouseDown={startDrag}
              onTouchStart={startDrag}
              className={`
                flex items-center justify-between px-3 py-2.5 flex-shrink-0
                bg-gradient-to-r from-slate-800 to-slate-700 text-white
                select-none border-b border-slate-600
                ${!isFullscreen ? 'cursor-grab active:cursor-grabbing' : ''}
              `}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Bars3Icon className="h-5 w-5 flex-shrink-0 text-slate-300" aria-hidden />
                <span className="text-sm font-semibold truncate">{headerLabel}</span>
                {callState === 'active' && (
                  <span className="text-xs text-slate-300 font-mono">{roomDurationFormatted}</span>
                )}
                {offlineTargets?.length > 0 && (
                  <span className="text-xs text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded">
                    Offline
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {callState === 'active' && callType === 'video' && localStream && (
                  <button
                    type="button"
                    onClick={togglePip}
                    className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
                    title={isPip ? 'Exit picture-in-picture' : 'Picture-in-picture'}
                    aria-label={isPip ? 'Exit picture-in-picture' : 'Picture-in-picture'}
                  >
                    <Square2StackIcon className="h-5 w-5" aria-hidden />
                  </button>
                )}
                {!minimized && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <ArrowsPointingInIcon className="h-5 w-5" aria-hidden />
                    ) : (
                      <ArrowsPointingOutIcon className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMinimized((m) => !m)}
                  className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
                  title={minimized ? 'Restore' : 'Minimize'}
                  aria-label={minimized ? 'Restore' : 'Minimize'}
                >
                  {minimized ? (
                    <ChevronUpIcon className="h-5 w-5" aria-hidden />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
                  title="End call"
                  aria-label="End call"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </header>

            {/* Content: always mounted when active so audio keeps playing when minimized */}
            {callState === 'active' && (
              <main
                className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
                  minimized
                    ? 'invisible absolute opacity-0 pointer-events-none w-full'
                    : 'min-h-[200px]'
                }`}
                style={
                  minimized
                    ? { height: SMALL_EXPANDED_HEIGHT - 56, position: 'absolute', inset: '56px 0 0 0' }
                    : {}
                }
              >
                <div className="flex-1 min-h-0 overflow-auto p-3">
                  {callType === 'video' ? (
                    <VideoGrid
                      localStream={localStream}
                      remoteStreams={remoteStreams}
                      isMuted={isMuted}
                      isVideoOff={isVideoOff}
                      isScreenSharing={isScreenSharing}
                      screenShareStream={screenShareStream}
                      localVideoRef={localVideoRef}
                      participantsInfo={participantsInfo}
                      currentCall={currentCall}
                      sessionUserId={session?.user?.id}
                      showParticipantsBelt={showParticipantsBelt}
                      onToggleBelt={() => setShowParticipantsBelt((p) => !p)}
                    />
                  ) : (
                    <AudioCallDisplay
                      localStream={localStream}
                      remoteStreams={remoteStreams}
                      participantsInfo={participantsInfo}
                      isMuted={isMuted}
                      currentCall={currentCall}
                      sessionUserId={session?.user?.id}
                    />
                  )}
                </div>

                {/* Duration info */}
                {callState === 'active' && (
                  <div className="px-3 py-1 text-xs text-gray-600 text-center border-t border-gray-200">
                    Room: {roomDurationFormatted} • Your time: {userPresenceTimeFormatted}
                  </div>
                )}

                <div className="flex-shrink-0 p-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    {currentCall?.type === 'group' && (
                      <button
                        type="button"
                        onClick={() => setShowAddParticipants(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
                        title="Add participants"
                        aria-label="Add participants"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                        <span>Add</span>
                      </button>
                    )}
                    <div className="flex-1" />
                  </div>
                  <CallControls
                    callType={callType}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    isScreenSharing={isScreenSharing}
                    onToggleAudio={toggleAudio}
                    onToggleVideo={toggleVideo}
                    onToggleScreenShare={toggleScreenShare}
                    onLeaveCall={handleClose}
                    onUpgradeToVideo={
                      callType === 'audio' ? () => upgradeCallType('video') : undefined
                    }
                  />
                </div>
              </main>
            )}

            {callState === 'ringing' && (
              <main className="flex-1 min-h-0 overflow-auto p-3">
                <CallStateDisplay
                  state="ringing"
                  callType={callType}
                  callerName={callerInfo?.name}
                  callerImage={callerInfo?.image}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              </main>
            )}

            {callState === 'calling' && (
              <main className="flex-1 min-h-0 overflow-auto p-3">
                <CallStateDisplay
                  state="calling"
                  callType={callType}
                  targetName={targetName}
                  offlineTargets={offlineTargets}
                  onCancel={handleCancel}
                />
              </main>
            )}

            {callState === 'idle' && showInitiatorIfIdle && defaultTargetUserId && (
              <main className="p-4">
                <p className="text-gray-500 text-sm mb-2">Ready to call</p>
                <button
                  type="button"
                  onClick={handleStartDefault}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                >
                  Start {defaultCallType === 'video' ? 'Video' : 'Audio'} Call
                </button>
              </main>
            )}
          </div>
        </div>
      )}

      {/* End call confirmation */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-call-title"
          onClick={() => handleCloseConfirm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="end-call-title" className="text-lg font-semibold text-gray-900 mb-2">
              End call?
            </h2>
            <p className="text-gray-600 text-sm mb-4">Are you sure you want to end this call?</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => handleCloseConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCloseConfirm(true)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                End call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add participants modal */}
      <AddParticipantsModal
        isOpen={showAddParticipants}
        onClose={() => setShowAddParticipants(false)}
      />
    </>
  );
}
