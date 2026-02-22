 'use client';
 
 import { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
 import { useSession } from 'next-auth/react';
 import { useSocket } from '@/lib/socket';
 
 /**
  * CallContext centralizes call lifecycle, signaling, and WebRTC media management.
  * It exposes state and control functions so UI components can remain dumb and reusable.
  *
  * High-level design:
  * - Socket signaling integrates with server/handlers/call-v2.handler.mjs events
  * - WebRTC peer connections are stored in refs to avoid excessive React re-renders
  * - Media controls (mute/camera/screen-share) act on tracks and broadcast state over socket
  * - Context persists as long as the provider stays mounted (place it above route boundaries)
  */
 const CallContext = createContext(null);
 
 // Public hook to access call APIs and state
 export function useCall() {
   const ctx = useContext(CallContext);
   if (!ctx) throw new Error('useCall must be used within a CallProvider');
   return ctx;
 }
 
 // STUN configuration (add TURN in production)
 const ICE_SERVERS = {
   iceServers: [
     { urls: 'stun:stun.l.google.com:19302' },
     { urls: 'stun:stun1.l.google.com:19302' },
   ],
 };
 
 export function CallProvider({ children }) {
   const { data: session } = useSession();
   const { socket, isConnected } = useSocket();
 
   // ------------------------------
   // Call session state
   // ------------------------------
   const [callState, setCallState] = useState('idle'); // idle | ringing | calling | active
   const [callType, setCallType] = useState('video');  // 'audio' | 'video'
   const [currentCall, setCurrentCall] = useState(null); // server call object
   const [roomId, setRoomId] = useState(null);
 
  // ------------------------------
  // Media state
  // ------------------------------
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // Map<userId, MediaStream>
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState(null);

  // Participant metadata: Map<userId, { name, image, handle, isMuted, isVideoOff }>
  const [participantsInfo, setParticipantsInfo] = useState(new Map());
  const [offlineTargets, setOfflineTargets] = useState([]);
 
   // ------------------------------
   // Refs for immediate access without causing renders
   // ------------------------------
   const localVideoRef = useRef(null);
   const localStreamRef = useRef(null);
   const roomIdRef = useRef(null);
   const peerConnectionsRef = useRef(new Map()); // Map<userId, RTCPeerConnection>
   const iceCandidateQueues = useRef(new Map()); // Map<userId, RTCIceCandidate[]>
  const pendingAnswersRef = useRef(new Map());   // Map<userId, RTCSessionDescriptionInit>
  const negotiationLocksRef = useRef(new Map()); // Map<userId, boolean>
 
   // Keep local video element updated when stream changes
   useEffect(() => {
     if (localVideoRef.current && localStream) {
       localVideoRef.current.srcObject = localStream;
     }
   }, [localStream]);

   // Populate participantsInfo from currentCall when call object has populated participants
   useEffect(() => {
     if (!currentCall?.participants) return;
     setParticipantsInfo(prev => {
       const next = new Map(prev);
       for (const p of currentCall.participants) {
         const uid = typeof p.userId === 'object' ? p.userId?._id : p.userId;
         if (!uid) continue;
         const u = typeof p.userId === 'object' ? p.userId : null;
         const existing = next.get(String(uid)) || {};
         next.set(String(uid), {
           ...existing,
           name: u?.name || existing.name || 'User',
           image: u?.image ?? existing.image,
           handle: u?.handle ?? existing.handle,
         });
       }
       return next;
     });
   }, [currentCall?.participants]);

   // Confirm before refresh/close when in active call
   useEffect(() => {
     const handleBeforeUnload = (e) => {
       if (['calling', 'ringing', 'active'].includes(callState)) {
         e.preventDefault();
       }
     };
     window.addEventListener('beforeunload', handleBeforeUnload);
     return () => window.removeEventListener('beforeunload', handleBeforeUnload);
   }, [callState]);
 
   // ------------------------------
   // WebRTC helpers
   // ------------------------------
   const createPeerConnectionWithStream = useCallback(async (userId, stream) => {
     // Reuse if exists
     if (peerConnectionsRef.current.has(userId)) {
       return peerConnectionsRef.current.get(userId);
     }
 
     const pc = new RTCPeerConnection(ICE_SERVERS);
 
     // Add local tracks
     if (stream) {
       stream.getTracks().forEach(track => {
         pc.addTrack(track, stream);
       });
     }
 
     // Send ICE candidates to the target peer via socket
     pc.onicecandidate = (event) => {
       const currentRoomId = roomIdRef.current || roomId;
       if (event.candidate && currentRoomId) {
         socket?.emit('call:ice-candidate', {
           roomId: currentRoomId,
           targetUserId: userId,
           candidate: event.candidate,
         });
       }
     };
 
     // Remote media
     pc.ontrack = (event) => {
       const [remoteStream] = event.streams;
       if (remoteStream) {
         setRemoteStreams(prev => {
           const next = new Map(prev);
           next.set(userId, remoteStream);
           return next;
         });
       }
     };
 
     // Cleanup on failure/close
     pc.onconnectionstatechange = () => {
       if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
         removePeerConnection(userId);
       }
     };
 
    pc.onnegotiationneeded = async () => {
      try {
        if (negotiationLocksRef.current.get(userId)) return;
        negotiationLocksRef.current.set(userId, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const currentRoomId = roomIdRef.current || roomId;
        if (currentRoomId) {
          socket?.emit('call:offer', {
            roomId: currentRoomId,
            targetUserId: userId,
            offer,
          });
        }
      } catch (e) {
      } finally {
        negotiationLocksRef.current.delete(userId);
      }
    };

     // Track connection
     peerConnectionsRef.current.set(userId, pc);
     return pc;
   }, [roomId, socket]);
 
   const createPeerConnection = useCallback(async (userId) => {
     const stream = localStreamRef.current || localStream;
     return createPeerConnectionWithStream(userId, stream);
   }, [createPeerConnectionWithStream, localStream]);
 
   const removePeerConnection = useCallback((userId) => {
     const pc = peerConnectionsRef.current.get(userId);
     if (pc) {
       try { pc.close(); } catch {}
       peerConnectionsRef.current.delete(userId);
     }
     setRemoteStreams(prev => {
       const next = new Map(prev);
       next.delete(userId);
       return next;
     });
   }, []);
 
   const handleOffer = useCallback(async (fromUserId, offer, offerRoomId) => {
     const pc = await createPeerConnection(fromUserId);
     try {
       await pc.setRemoteDescription(new RTCSessionDescription(offer));
 
       // Process any queued ICE candidates
       const queue = iceCandidateQueues.current.get(fromUserId) || [];
       for (const candidate of queue) {
         await pc.addIceCandidate(new RTCIceCandidate(candidate));
       }
       iceCandidateQueues.current.delete(fromUserId);
 
       const answer = await pc.createAnswer();
       await pc.setLocalDescription(answer);
 
       const currentRoomId = offerRoomId || roomIdRef.current || roomId;
       if (!currentRoomId) return;
 
       socket?.emit('call:answer', {
         roomId: currentRoomId,
         targetUserId: fromUserId,
         answer,
       });
     } catch (error) {
       console.error('[CallContext] Error handling offer:', error);
     }
   }, [createPeerConnection, roomId, socket]);
 
   const handleAnswer = useCallback(async (fromUserId, answer) => {
     const pc = peerConnectionsRef.current.get(fromUserId);
     if (!pc) return;
     try {
      // Wait until we have a local offer before applying the remote answer
      if (!pc.localDescription || pc.localDescription.type !== 'offer') {
        pendingAnswersRef.current.set(fromUserId, answer);
        return;
      }
      const canApply = pc.signalingState === 'have-local-offer';
      if (!canApply) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
       const queue = iceCandidateQueues.current.get(fromUserId) || [];
       for (const candidate of queue) {
         await pc.addIceCandidate(new RTCIceCandidate(candidate));
       }
       iceCandidateQueues.current.delete(fromUserId);
     } catch (error) {
       console.error('[CallContext] Error handling answer:', error);
     }
   }, []);
 
   const handleIceCandidate = useCallback(async (fromUserId, candidate) => {
     const pc = peerConnectionsRef.current.get(fromUserId);
     if (pc && pc.remoteDescription) {
       try {
         await pc.addIceCandidate(new RTCIceCandidate(candidate));
       } catch (error) {
         console.error('[CallContext] Error adding ICE candidate:', error);
       }
     } else {
       if (!iceCandidateQueues.current.has(fromUserId)) {
         iceCandidateQueues.current.set(fromUserId, []);
       }
       iceCandidateQueues.current.get(fromUserId).push(candidate);
     }
   }, []);
 
   // ------------------------------
   // Local media
   // ------------------------------
   const startLocalMedia = useCallback(async (type = 'video') => {
     const constraints = { audio: true, video: type === 'video' };
     const stream = await navigator.mediaDevices.getUserMedia(constraints);
     setLocalStream(stream);
     localStreamRef.current = stream;
     return stream;
   }, []);
 
   const cleanupCall = useCallback(() => {
     try {
       // Stop local tracks
       const ls = localStreamRef.current || localStream;
       if (ls) {
         ls.getTracks().forEach(t => {
           try { t.stop(); } catch {}
         });
       }
       setLocalStream(null);
       localStreamRef.current = null;
 
       // Clear video element
       if (localVideoRef.current) {
         localVideoRef.current.srcObject = null;
       }
 
       // Close peer connections
       peerConnectionsRef.current.forEach((pc, userId) => {
         try { pc.close(); } catch {}
       });
       peerConnectionsRef.current.clear();
 
       setRemoteStreams(new Map());
       iceCandidateQueues.current.clear();
 
      // Stop screen share stream if active
      if (screenShareStream) {
        screenShareStream.getTracks().forEach(track => track.stop());
        setScreenShareStream(null);
      }

      // Reset flags
      setIsMuted(false);
      setIsVideoOff(false);
      setIsScreenSharing(false);
      setParticipantsInfo(new Map());
      setOfflineTargets([]);

       // Reset call state
       setCallState('idle');
       setCurrentCall(null);
       setRoomId(null);
       roomIdRef.current = null;
     } catch (e) {
       console.error('[CallContext] Error during cleanup:', e);
     }
   }, [localStream]);
 
   // ------------------------------
   // Control actions (public API)
   // ------------------------------
   const initiateCall = useCallback(async (targetUserId, type = 'video') => {
     if (!session?.user?.id || targetUserId === session.user.id) {
       throw new Error('Invalid target user');
     }
     const stream = await startLocalMedia(type);
     setCallType(type);
     setCallState('calling');
     localStreamRef.current = stream;
 
     return new Promise((resolve, reject) => {
       socket?.emit('call:initiate', {
         targetUserIds: [targetUserId],
         callType: type,
       }, (response) => {
         if (response?.success) {
           setCurrentCall(response.call);
           setRoomId(response.roomId);
           roomIdRef.current = response.roomId;
           setOfflineTargets(response.offlineTargets || []);
           resolve(response);
         } else {
           cleanupCall();
           reject(new Error(response?.error || 'Failed to initiate call'));
         }
       });
     });
   }, [cleanupCall, session, socket, startLocalMedia]);
 
   const acceptCall = useCallback(async () => {
     const stream = await startLocalMedia(callType);
     setCallState('active');
     return new Promise((resolve, reject) => {
       socket?.emit('call:accept', { roomId }, async (response) => {
         if (response?.success) {
           resolve(response);
         } else {
           cleanupCall();
           reject(new Error(response?.error || 'Failed to accept call'));
         }
       });
     });
   }, [callType, roomId, socket, startLocalMedia, cleanupCall]);
 
   const rejectCall = useCallback(() => {
     socket?.emit('call:reject', { roomId, reason: 'User declined' });
     cleanupCall();
   }, [roomId, socket, cleanupCall]);
 
   const cancelCall = useCallback(() => {
     socket?.emit('call:cancel', { roomId });
     cleanupCall();
   }, [roomId, socket, cleanupCall]);
 
   const leaveCall = useCallback(() => {
     socket?.emit('call:leave', { roomId });
     cleanupCall();
   }, [roomId, socket, cleanupCall]);
 
   const addParticipant = useCallback((userId) => {
     if (userId === session?.user?.id) return;
     socket?.emit('call:add-participant', { roomId, userId }, (response) => {
       if (!response?.success) {
         console.error('[CallContext] add-participant failed:', response?.error);
       }
     });
   }, [roomId, socket, session]);
 
   const upgradeCallType = useCallback((newCallType) => {
     socket?.emit('call:upgrade-type', { roomId, newCallType }, (response) => {
       if (!response?.success) {
         console.error('[CallContext] upgrade-type failed:', response?.error);
       }
     });
   }, [roomId, socket]);
 
   const toggleAudio = useCallback(() => {
     const ls = localStreamRef.current || localStream;
     if (!ls) return;
     const audioTrack = ls.getAudioTracks()[0];
     if (!audioTrack) return;
     audioTrack.enabled = !audioTrack.enabled;
     setIsMuted(!audioTrack.enabled);
     socket?.emit('call:toggle-audio', { roomId, isMuted: !audioTrack.enabled });
   }, [roomId, socket, localStream]);
 
   const toggleVideo = useCallback(() => {
     const ls = localStreamRef.current || localStream;
     if (!ls) return;
     const videoTrack = ls.getVideoTracks()[0];
     if (!videoTrack) return;
     const newState = !videoTrack.enabled;
     videoTrack.enabled = newState;
     setIsVideoOff(!newState);
     // Ensure the local video element keeps rendering when re-enabled
     if (localVideoRef.current && newState) {
       localVideoRef.current.srcObject = ls;
     }
     socket?.emit('call:toggle-video', { roomId, isVideoOff: !newState });
   }, [roomId, socket, localStream]);
 
   const handleUpgradeToVideo = useCallback(async () => {
     try {
       const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
       const videoTrack = videoStream.getVideoTracks()[0];
       const ls = localStreamRef.current || localStream;
       if (!ls) return;
       ls.addTrack(videoTrack);
       localStreamRef.current = ls;
       setLocalStream(ls);
       peerConnectionsRef.current.forEach((pc) => {
         pc.addTrack(videoTrack, ls);
       });
     } catch (error) {
       console.error('[CallContext] Error upgrading to video:', error);
     }
   }, [localStream]);
 
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        setScreenShareStream(screenStream);
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        setIsScreenSharing(true);
        socket?.emit('call:screen-share', { roomId, isSharing: true });
      } else {
        // Stop screen share stream
        if (screenShareStream) {
          screenShareStream.getTracks().forEach(track => track.stop());
          setScreenShareStream(null);
        }
        const ls = localStreamRef.current || localStream;
        const videoTrack = ls?.getVideoTracks()[0];
        if (videoTrack) {
          peerConnectionsRef.current.forEach((pc) => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack);
          });
        }
        setIsScreenSharing(false);
        socket?.emit('call:screen-share', { roomId, isSharing: false });
      }
    } catch (error) {
      console.error('[CallContext] Error toggling screen share:', error);
    }
  }, [isScreenSharing, roomId, socket, localStream, screenShareStream]);
 
   // ------------------------------
   // Socket listeners (signaling)
   // ------------------------------
   useEffect(() => {
     if (!socket) return;
 
     const onIncoming = (data) => {
       setCurrentCall(data.call);
       setRoomId(data.roomId);
       roomIdRef.current = data.roomId;
       setCallType(data.callType);
       setCallState('ringing');
       // Populate caller info for incoming call UI
       if (data.callerId) {
         setParticipantsInfo(prev => {
           const next = new Map(prev);
           next.set(String(data.callerId), {
             name: data.callerName || 'Unknown',
             image: data.callerImage,
             handle: null,
             isMuted: false,
             isVideoOff: false,
           });
           return next;
         });
       }
     };
 
     const onCancelled = () => {
       cleanupCall();
     };
 
     const onParticipantJoined = async (data) => {
       // Add participant info
       const uid = String(data.userId);
       setParticipantsInfo(prev => {
         const next = new Map(prev);
         next.set(uid, {
           name: data.userName || 'Unknown',
           image: data.userImage,
           handle: null,
           isMuted: false,
           isVideoOff: false,
         });
         return next;
       });
       // Skip self
       if (data.userId === session?.user?.id) return;

       const stream = localStreamRef.current || localStream;
       if (!stream) return;

       setCallState('active'); // caller moves to active
       const pc = await createPeerConnectionWithStream(data.userId, stream);
       try {
         const offer = await pc.createOffer();
         await pc.setLocalDescription(offer);
        // If an answer arrived before our local offer finished, apply it now
        const pendingAnswer = pendingAnswersRef.current.get(data.userId);
        if (pendingAnswer) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(pendingAnswer));
            // Process queued ICE after applying the answer
            const queue = iceCandidateQueues.current.get(data.userId) || [];
            for (const candidate of queue) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            iceCandidateQueues.current.delete(data.userId);
          } catch (e) {
            console.error('[CallContext] Error applying pending answer:', e);
          } finally {
            pendingAnswersRef.current.delete(data.userId);
          }
        }
         const currentRoomId = data.roomId || roomIdRef.current || roomId;
         if (!currentRoomId) return;
         socket.emit('call:offer', {
           roomId: currentRoomId,
           targetUserId: data.userId,
           offer,
         });
       } catch (e) {
         console.error('[CallContext] Error creating/sending offer:', e);
       }
     };
 
     const onParticipantLeft = (data) => {
       setParticipantsInfo(prev => {
         const next = new Map(prev);
         next.delete(String(data.userId));
         return next;
       });
       removePeerConnection(data.userId);
       if (data.callEnded) {
         cleanupCall();
       }
     };
 
     const onParticipantRejected = (data) => {
       if (data.callEnded) {
         cleanupCall();
       }
     };
 
     const onOffer = async (data) => {
       if (data.roomId && !roomIdRef.current && !roomId) {
         setRoomId(data.roomId);
         roomIdRef.current = data.roomId;
       }
       await handleOffer(data.fromUserId, data.offer, data.roomId);
     };
 
     const onAnswer = async (data) => {
       await handleAnswer(data.fromUserId, data.answer);
     };
 
     const onIce = async (data) => {
       await handleIceCandidate(data.fromUserId, data.candidate);
     };
 
     const onTypeUpgraded = (data) => {
       setCallType(data.newCallType);
       if (data.newCallType === 'video' && localStream && !localStream.getVideoTracks().length) {
         handleUpgradeToVideo();
        if (data.upgradedBy === session?.user?.id) {
          peerConnectionsRef.current.forEach((pc, uid) => {
            if (negotiationLocksRef.current.get(uid)) return;
            negotiationLocksRef.current.set(uid, true);
            (async () => {
              try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                const currentRoomId = roomIdRef.current || roomId;
                if (currentRoomId) {
                  socket?.emit('call:offer', {
                    roomId: currentRoomId,
                    targetUserId: uid,
                    offer,
                  });
                }
              } catch (e) {
              } finally {
                negotiationLocksRef.current.delete(uid);
              }
            })();
          });
        }
       }
     };
 
     const onTypeChanged = (data) => {
       if (currentCall) {
         setCurrentCall(prev => ({ ...prev, type: data.type }));
       }
     };

     const onAudioToggled = (data) => {
       const uid = String(data.userId);
       setParticipantsInfo(prev => {
         const next = new Map(prev);
         const existing = next.get(uid) || {};
         next.set(uid, { ...existing, name: existing.name || 'User', isMuted: data.isMuted });
         return next;
       });
     };

     const onVideoToggled = (data) => {
       const uid = String(data.userId);
       setParticipantsInfo(prev => {
         const next = new Map(prev);
         const existing = next.get(uid) || {};
         next.set(uid, { ...existing, name: existing.name || 'User', isVideoOff: data.isVideoOff });
         return next;
       });
     };

     socket.on('call:incoming', onIncoming);
     socket.on('call:cancelled', onCancelled);
     socket.on('call:participant-joined', onParticipantJoined);
     socket.on('call:participant-left', onParticipantLeft);
     socket.on('call:participant-rejected', onParticipantRejected);
     socket.on('call:offer', onOffer);
     socket.on('call:answer', onAnswer);
     socket.on('call:ice-candidate', onIce);
     socket.on('call:type-upgraded', onTypeUpgraded);
     socket.on('call:type-changed', onTypeChanged);
     socket.on('call:audio-toggled', onAudioToggled);
     socket.on('call:video-toggled', onVideoToggled);

     return () => {
       socket.off('call:incoming', onIncoming);
       socket.off('call:cancelled', onCancelled);
       socket.off('call:participant-joined', onParticipantJoined);
       socket.off('call:participant-left', onParticipantLeft);
       socket.off('call:participant-rejected', onParticipantRejected);
       socket.off('call:offer', onOffer);
       socket.off('call:answer', onAnswer);
       socket.off('call:ice-candidate', onIce);
       socket.off('call:type-upgraded', onTypeUpgraded);
       socket.off('call:type-changed', onTypeChanged);
       socket.off('call:audio-toggled', onAudioToggled);
       socket.off('call:video-toggled', onVideoToggled);
     };
   }, [
     socket,
     session,
     localStream,
     currentCall,
     createPeerConnectionWithStream,
     handleOffer,
     handleAnswer,
     handleIceCandidate,
     handleUpgradeToVideo,
     removePeerConnection,
     cleanupCall,
     roomId,
   ]);
 
   // ------------------------------
   // Memoized public API
   // ------------------------------
   const value = useMemo(() => ({
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
    screenShareStream,
    participantsInfo,
    offlineTargets,
    // refs (for components needing direct access)
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
   }), [
     callState,
     callType,
     currentCall,
     roomId,
     localStream,
     remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    screenShareStream,
    participantsInfo,
    offlineTargets,
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
   ]);
 
   return (
     <CallContext.Provider value={value}>
       {children}
     </CallContext.Provider>
   );
 }
 
