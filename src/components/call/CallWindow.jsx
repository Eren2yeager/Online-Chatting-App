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
} from '@heroicons/react/24/outline';
import { VideoGrid, AudioCallDisplay, CallControls, CallStateDisplay } from './index';

const MIN_WIDTH = 280;
const MIN_HEIGHT = 200;
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 520;
const MAX_WIDTH_RATIO = 0.95;
const MAX_HEIGHT_RATIO = 0.9;

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
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [size, setSize] = useState({ w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT });
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const resizingRef = useRef(false);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const pipVideoRef = useRef(null);

  const shouldShow = useMemo(
    () => ['calling', 'ringing', 'active'].includes(callState),
    [callState]
  );

  useEffect(() => {
    setVisible(shouldShow);
    if (shouldShow) setMinimized(false);
  }, [shouldShow]);

  // Constrain position and size
  const clampSize = useCallback((w, h) => {
    const maxW = typeof window !== 'undefined' ? window.innerWidth * MAX_WIDTH_RATIO : 800;
    const maxH = typeof window !== 'undefined' ? window.innerHeight * MAX_HEIGHT_RATIO : 700;
    return {
      w: Math.min(Math.max(w, MIN_WIDTH), maxW),
      h: Math.min(Math.max(h, MIN_HEIGHT), maxH),
    };
  }, []);

  const clampPos = useCallback((x, y, w, h) => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 700;
    return {
      x: Math.max(0, Math.min(x, vw - Math.min(w, vw))),
      y: Math.max(0, Math.min(y, vh - Math.min(h, vh))),
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (draggingRef.current) {
        const dx = e.clientX - lastRef.current.x;
        const dy = e.clientY - lastRef.current.y;
        lastRef.current = { x: e.clientX, y: e.clientY };
        setPos((p) => {
          const s = size;
          return clampPos(p.x + dx, p.y + dy, s.w, s.h);
        });
      } else if (resizingRef.current) {
        const dx = e.clientX - lastRef.current.x;
        const dy = e.clientY - lastRef.current.y;
        lastRef.current = { x: e.clientX, y: e.clientY };
        setSize((s) => clampSize(s.w + dx, s.h + dy));
      }
    };
    const onMouseUp = () => {
      draggingRef.current = false;
      resizingRef.current = false;
    };
    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      if (draggingRef.current || resizingRef.current) e.preventDefault();
      const t = e.touches[0];
      if (draggingRef.current) {
        const dx = t.clientX - lastRef.current.x;
        const dy = t.clientY - lastRef.current.y;
        lastRef.current = { x: t.clientX, y: t.clientY };
        setPos((p) => clampPos(p.x + dx, p.y + dy, size.w, size.h));
      } else if (resizingRef.current) {
        const dx = t.clientX - lastRef.current.x;
        const dy = t.clientY - lastRef.current.y;
        lastRef.current = { x: t.clientX, y: t.clientY };
        setSize((s) => clampSize(s.w + dx, s.h + dy));
      }
    };
    const onTouchEnd = () => {
      draggingRef.current = false;
      resizingRef.current = false;
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
  }, [size, clampSize, clampPos]);

  const startDrag = (e) => {
    if (isFullscreen) return;
    draggingRef.current = true;
    lastRef.current = { x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, y: e.clientY ?? e.touches?.[0]?.clientY ?? 0 };
  };

  const startResize = (e) => {
    e.stopPropagation();
    if (isFullscreen || minimized) return;
    resizingRef.current = true;
    lastRef.current = { x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, y: e.clientY ?? e.touches?.[0]?.clientY ?? 0 };
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
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
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

  const handleClose = () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
    setMinimized(false);
    setIsFullscreen(false);
    setIsPip(false);
    setVisible(false);
    leaveCall();
  };

  const handleAccept = () => acceptCall();
  const handleReject = () => rejectCall();
  const handleCancel = () => cancelCall();

  const handleStartDefault = () => {
    if (defaultTargetUserId) initiateCall(defaultTargetUserId, defaultCallType);
  };

  const callerInfo = useMemo(() => {
    if (callState !== 'ringing' || !currentCall) return null;
    const initiatorId = currentCall.initiator?._id || currentCall.initiator;
    return participantsInfo.get(String(initiatorId)) || {
      name: currentCall.initiator?.name || 'Unknown',
      image: currentCall.initiator?.image,
    };
  }, [callState, currentCall, participantsInfo]);

  const targetName = useMemo(() => {
    if (callState !== 'calling' || !currentCall?.participants) return null;
    const target = currentCall.participants.find(
      (p) => String(p.userId?._id || p.userId) !== session?.user?.id
    );
    return target?.userId?.name || null;
  }, [callState, currentCall?.participants]);

  if (!visible && !showInitiatorIfIdle) return null;

  const headerLabel =
    callState === 'idle'
      ? 'Ready'
      : callState === 'ringing'
        ? 'Incoming Call'
        : callState === 'calling'
          ? 'Calling'
          : 'In Call';

  const windowStyles = isFullscreen
    ? { position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9999 }
    : {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: minimized ? 56 : size.h,
        maxWidth: '95vw',
        maxHeight: '90vh',
        zIndex: 50,
      };

  return (
    <div
      ref={containerRef}
      className="call-window-container"
      style={windowStyles}
      role="dialog"
      aria-label={`Call window: ${headerLabel}`}
      aria-modal="true"
    >
      <div className="flex flex-col h-full w-full rounded-xl shadow-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Header - draggable when not fullscreen */}
        <header
          ref={dragRef}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className={`
            flex items-center justify-between px-3 py-2.5 
            bg-gradient-to-r from-slate-800 to-slate-700 text-white
            select-none border-b border-slate-600
            ${!isFullscreen ? 'cursor-grab active:cursor-grabbing' : ''}
          `}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Bars3Icon className="h-5 w-5 flex-shrink-0 text-slate-300" aria-hidden />
            <span className="text-sm font-semibold truncate" id="call-window-title">
              {headerLabel}
            </span>
            {offlineTargets?.length > 0 && (
              <span className="text-xs text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded">
                User offline – ringing
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
                aria-label={isPip ? 'Exit picture-in-picture' : 'Show video in picture-in-picture'}
              >
                <ArrowsPointingOutIcon className="h-5 w-5" aria-hidden />
              </button>
            )}
            {!minimized && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
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
              aria-label={minimized ? 'Restore call window' : 'Minimize call window'}
            >
              {minimized ? (
                <ChevronUpIcon className="h-5 w-5" aria-hidden />
              ) : (
                <ChevronDownIcon className="h-5 w-5" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
              title="End call"
              aria-label="End call and close"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        {!minimized && (
          <main className="flex-1 overflow-hidden flex flex-col min-h-0 bg-slate-50">
            {callState === 'ringing' && (
              <div className="flex-1 min-h-0 flex p-2 sm:p-3">
                <CallStateDisplay
                  state="ringing"
                  callType={callType}
                  callerName={callerInfo?.name}
                  callerImage={callerInfo?.image}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              </div>
            )}

            {callState === 'calling' && (
              <div className="flex-1 min-h-0 flex p-2 sm:p-3">
                <CallStateDisplay
                  state="calling"
                  callType={callType}
                  targetName={targetName}
                  offlineTargets={offlineTargets}
                  onCancel={handleCancel}
                />
              </div>
            )}

            {callState === 'active' && (
              <>
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-2 sm:p-3">
                  {callType === 'video' ? (
                    <div className="flex-1 min-h-0 min-w-0">
                      <VideoGrid
                        localStream={localStream}
                        remoteStreams={remoteStreams}
                        isMuted={isMuted}
                        isVideoOff={isVideoOff}
                        localVideoRef={localVideoRef}
                        participantsInfo={participantsInfo}
                        currentCall={currentCall}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-auto">
                      <AudioCallDisplay
                      localStream={localStream}
                      remoteStreams={remoteStreams}
                      participantsInfo={participantsInfo}
                      isMuted={isMuted}
                    />
                    </div>
                  )}
                </div>
                <div className="mt-3 flex-shrink-0">
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
              </>
            )}

            {callState === 'idle' && showInitiatorIfIdle && defaultTargetUserId && (
              <div className="space-y-3 p-4">
                <p className="text-gray-500 text-sm">Ready to call</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleStartDefault}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                  >
                    Start {defaultCallType === 'video' ? 'Video' : 'Audio'} Call
                  </button>
                </div>
              </div>
            )}
          </main>
        )}

        {!minimized && !isFullscreen && (
          <div
            onMouseDown={startResize}
            onTouchStart={startResize}
            className="absolute right-0 bottom-0 w-8 h-8 cursor-se-resize flex items-end justify-end touch-none"
            role="presentation"
            aria-hidden
          >
            <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-400" fill="currentColor">
              <path d="M14 14V8h-2v4H8v2h6zM8 8V4h2v2h4V4h2v8h-2v-2H8zM4 4h2v2H4v2H2V4h2z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
