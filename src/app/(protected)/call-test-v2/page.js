'use client';

import { useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/lib/socket";
import { CallProvider, useCall } from "@/contexts/CallContext";
import {
  VideoGrid,
  AudioCallDisplay,
  CallControls,
  ParticipantManager,
  CallStateDisplay,
  CallInitiator,
} from "@/components/call";

export default function CallTestContent() {
  const { data: session } = useSession();
  const { isConnected } = useSocket();
  const {
    // state
    callState,
    callType,
    currentCall,
    roomId,
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    // refs
    localVideoRef,
    // actions
    initiateCall,
    acceptCall,
    rejectCall,
    cancelCall,
    leaveCall,
    addParticipant,
    upgradeCallType,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useCall();

  // ============================================
  // Render
  // ============================================
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Please sign in to test calling</p>
      </div>
    );
  }

  return (
    <div className=" bg-gray-900 text-white p-8 overflow-scroll">
      <div className="max-w-6xl mx-auto h-screen">
        <h1 className="text-3xl font-bold mb-8">Call Test V2 (Room-Based)</h1>
        
        {/* User Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400">Your User ID:</p>
          <p className="font-mono text-lg">{session.user.id}</p>
          <p className="text-sm text-gray-400 mt-2">
            Socket: {isConnected ? "✅ Connected" : "❌ Disconnected"}
          </p>
        </div>

        {/* Call State Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400">Call State:</p>
          <p className="text-xl font-bold capitalize">{callState}</p>
          {roomId && <p className="text-sm text-gray-400 mt-2">Room ID: {roomId}</p>}
        </div>

        {/* Idle State - Call Initiator */}
        {callState === "idle" && (
          <CallInitiator 
            onInitiate={initiateCall}
            disabled={!isConnected}
          />
        )}

        {/* Calling/Ringing States */}
        <CallStateDisplay
          state={callState}
          callType={callType}
          callerName={currentCall?.initiator?.name}
          onAccept={acceptCall}
          onReject={rejectCall}
          onCancel={cancelCall}
        />

        {/* Active Call */}
        {callState === "active" && (
          <div className="space-y-6">
            {/* Participant Manager */}
            <ParticipantManager
              participantCount={remoteStreams.size + 1}
              maxParticipants={4}
              onAddParticipant={addParticipant}
            />

            {/* Video Grid or Audio Display */}
            {callType === "video" ? (
              <VideoGrid
                localStream={localStream}
                remoteStreams={remoteStreams}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                currentUserId={session.user.id}
                maxParticipants={4}
                localVideoRef={localVideoRef}
              />
            ) : (
              <AudioCallDisplay
                localStream={localStream}
                remoteStreams={remoteStreams}
                isMuted={isMuted}
              />
            )}

            {/* Call Controls */}
            <CallControls
              callType={callType}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              isScreenSharing={isScreenSharing}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={toggleScreenShare}
              onLeaveCall={leaveCall}
            />

            {/* Upgrade to Video Button (for audio calls) */}
            {callType === "audio" && (
              <div className="flex justify-center">
                <button
                  onClick={() => upgradeCallType('video')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <span>📹</span>
                  <span>Upgrade to Video Call</span>
                </button>
              </div>
            )}

            {/* Debug Info */}
            <div className="bg-gray-800 rounded-lg p-4 text-sm">
              <p className="text-gray-400">Debug Info:</p>
              <p>Call Type: {currentCall?.type || 'direct'} ({callType})</p>
              <p>Local Stream: {localStream ? "✅" : "❌"}</p>
              <p>Remote Streams: {remoteStreams.size}</p>
              <p>Room ID: {roomId || '—'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// export default function CallTestV2() {
//   // Wrap page content with CallProvider for testing context locally
//   return (
//     <CallProvider>
//       <CallTestContent />
//     </CallProvider>
//   );
// }
