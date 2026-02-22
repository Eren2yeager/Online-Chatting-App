import { nanoid } from 'nanoid';
import Call from '../../src/models/Call.mjs';

const MAX_PARTICIPANTS = parseInt(process.env.MAX_CALL_PARTICIPANTS || '4');

/**
 * Register room-based call handlers with MongoDB tracking
 * @param {Object} socket - Socket instance
 * @param {Object} io - Socket.IO server instance
 * @param {Map} userSockets - Map of userId to socketId
 */
export function registerCallHandlersV2(socket, io, userSockets) {
  
  /**
   * Initiate a new call
   * Creates a Call document and room, invites participants
   */
  socket.on("call:initiate", async (data, ack) => {
    console.log(`\n🔵 [CALL:INITIATE] User ${socket.userId} initiating call`, data);
    try {
      const { targetUserIds, callType = 'video' } = data;
      
      // Validate
      if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        console.log(`❌ [CALL:INITIATE] Validation failed: targetUserIds missing`);
        return ack?.({ success: false, error: "targetUserIds array is required" });
      }

      // Prevent calling yourself
      if (targetUserIds.includes(socket.userId)) {
        console.log(`❌ [CALL:INITIATE] User ${socket.userId} tried to call themselves`);
        return ack?.({ success: false, error: "You cannot call yourself" });
      }

      // Check max participants (initiator + targets)
      if (targetUserIds.length + 1 > MAX_PARTICIPANTS) {
        console.log(`❌ [CALL:INITIATE] Too many participants: ${targetUserIds.length + 1} > ${MAX_PARTICIPANTS}`);
        return ack?.({ success: false, error: `Maximum ${MAX_PARTICIPANTS} participants allowed` });
      }

      // Check if user is already in a call
      const existingCall = await Call.findActiveCallForUser(socket.userId);
      if (existingCall) {
        console.log(`❌ [CALL:INITIATE] User ${socket.userId} already in call ${existingCall.roomId}`);
        return ack?.({ success: false, error: "You are already in a call" });
      }

      // Check if any target is already in a call
      for (const targetId of targetUserIds) {
        const targetCall = await Call.findActiveCallForUser(targetId);
        if (targetCall) {
          console.log(`❌ [CALL:INITIATE] Target ${targetId} already in call ${targetCall.roomId}`);
          return ack?.({ success: false, error: "One or more users are already in a call" });
        }
      }

      // Generate unique room ID with retry logic for duplicate key errors
      let call = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!call && attempts < maxAttempts) {
        attempts++;
        const roomId = `call_${Date.now()}_${nanoid(10)}`;
        console.log(`✅ [CALL:INITIATE] Attempt ${attempts}: Generated room ID: ${roomId}`);

        try {
          // Create Call document
          call = await Call.create({
            roomId,
            type: targetUserIds.length === 1 ? 'direct' : 'group',
            callType,
            initiator: socket.userId,
            participants: [
              { userId: socket.userId, status: 'calling' },
              ...targetUserIds.map(id => ({ userId: id, status: 'ringing' }))
            ],
            status: 'pending',
          });
          console.log(`✅ [CALL:INITIATE] Call document created:`, call._id);
        } catch (error) {
          if (error.code === 11000 && attempts < maxAttempts) {
            console.log(`⚠️ [CALL:INITIATE] Duplicate roomId, retrying... (attempt ${attempts}/${maxAttempts})`);
            // Wait a tiny bit before retry
            await new Promise(resolve => setTimeout(resolve, 10));
            continue;
          }
          throw error; // Re-throw if not duplicate key or max attempts reached
        }
      }

      if (!call) {
        console.log(`❌ [CALL:INITIATE] Failed to create call after ${maxAttempts} attempts`);
        return ack?.({ success: false, error: "Failed to create call room" });
      }

      // Populate for response
      await call.populate('initiator', 'name image handle');
      await call.populate('participants.userId', 'name image handle');

      // Join initiator to room
      socket.join(call.roomId);
      console.log(`✅ [CALL:INITIATE] Initiator ${socket.userId} joined room ${call.roomId}`);

      const offlineTargets = [];

      // Send invitations to all targets
      for (const targetId of targetUserIds) {
        const targetSocketId = userSockets.get(targetId);
        console.log(`📤 [CALL:INITIATE] Sending invitation to ${targetId}, socketId: ${targetSocketId}`);
        if (targetSocketId) {
          io.to(targetSocketId).emit("call:incoming", {
            call: call.toObject(),
            roomId: call.roomId,
            callerId: socket.userId,
            callerName: socket.user.name,
            callerImage: socket.user.image,
            callType,
          });
          console.log(`✅ [CALL:INITIATE] Invitation sent to ${targetId}`);
        } else {
          offlineTargets.push(targetId);
          console.log(`⚠️ [CALL:INITIATE] Target ${targetId} is offline - call will keep ringing`);
        }
      }

      console.log(`✅ [CALL:INITIATE] Call initiated successfully, sending ack to ${socket.userId}`);
      ack?.({
        success: true,
        call: call.toObject(),
        roomId: call.roomId,
        ...(offlineTargets.length > 0 && { offlineTargets }),
      });
    } catch (error) {
      console.error(`❌ [CALL:INITIATE] Error:`, error);
      ack?.({ success: false, error: "Failed to initiate call" });
    }
  });

  /**
   * Accept an incoming call
   * Join the room and update participant status
   */
  socket.on("call:accept", async (data, ack) => {
    console.log(`\n🟢 [CALL:ACCEPT] User ${socket.userId} accepting call`, data);
    try {
      const { roomId, offer } = data;

      if (!roomId) {
        console.log(`❌ [CALL:ACCEPT] roomId missing`);
        return ack?.({ success: false, error: "roomId is required" });
      }

      // Find the call
      const call = await Call.findOne({ roomId });
      if (!call) {
        console.log(`❌ [CALL:ACCEPT] Call not found for room ${roomId}`);
        return ack?.({ success: false, error: "Call not found" });
      }

      console.log(`✅ [CALL:ACCEPT] Call found:`, call._id, `Status: ${call.status}`);

      // Check if user is a participant
      const participant = call.participants.find(p => p.userId.toString() === socket.userId);
      if (!participant) {
        console.log(`❌ [CALL:ACCEPT] User ${socket.userId} not invited to call ${roomId}`);
        return ack?.({ success: false, error: "You are not invited to this call" });
      }

      console.log(`✅ [CALL:ACCEPT] User ${socket.userId} is participant, current status: ${participant.status}`);

      // Update participant status
      call.updateParticipantStatus(socket.userId, 'joined');
      await call.save();
      console.log(`✅ [CALL:ACCEPT] Updated participant status to 'joined'`);

      // Join the room
      socket.join(roomId);
      console.log(`✅ [CALL:ACCEPT] User ${socket.userId} joined room ${roomId}`);

      // Notify all participants in the room (including the one who just joined)
      io.to(roomId).emit("call:participant-joined", {
        userId: socket.userId,
        userName: socket.user.name,
        userImage: socket.user.image,
        roomId,
        offer,
      });
      console.log(`📤 [CALL:ACCEPT] Broadcasted participant-joined to room ${roomId}`);

      // Populate and return
      await call.populate('participants.userId', 'name image handle');
      
      console.log(`✅ [CALL:ACCEPT] Call accepted successfully, sending ack to ${socket.userId}`);
      ack?.({ success: true, call: call.toObject() });
    } catch (error) {
      console.error(`❌ [CALL:ACCEPT] Error:`, error);
      ack?.({ success: false, error: "Failed to accept call" });
    }
  });

  /**
   * Reject an incoming call
   */
  socket.on("call:reject", async (data, ack) => {
    console.log(`\n🔴 [CALL:REJECT] User ${socket.userId} rejecting call`, data);
    try {
      const { roomId, reason } = data;

      if (!roomId) {
        console.log(`❌ [CALL:REJECT] roomId missing`);
        return ack?.({ success: false, error: "roomId is required" });
      }

      const call = await Call.findOne({ roomId });
      if (!call) {
        console.log(`❌ [CALL:REJECT] Call not found for room ${roomId}`);
        return ack?.({ success: false, error: "Call not found" });
      }

      console.log(`✅ [CALL:REJECT] Call found:`, call._id);

      // Update participant status
      call.updateParticipantStatus(socket.userId, 'rejected');
      
      // Check if call should end (all rejected or only one person left)
      const activeParticipants = call.participants.filter(p => 
        ['joined', 'ringing', 'calling'].includes(p.status)
      );
      
      console.log(`[CALL:REJECT] Active participants remaining: ${activeParticipants.length}`);
      
      if (activeParticipants.length <= 1) {
        call.status = 'cancelled';
        call.endedAt = new Date();
        console.log(`[CALL:REJECT] Call cancelled - not enough participants`);
      }
      
      await call.save();

      // Notify everyone in the room about rejection
      io.to(roomId).emit("call:participant-rejected", {
        userId: socket.userId,
        userName: socket.user.name,
        reason: reason || "Call declined",
        callEnded: call.status === 'cancelled',
      });

      // Also notify the initiator directly (in case they haven't joined the room yet)
      const initiatorSocketId = userSockets.get(call.initiator.toString());
      if (initiatorSocketId) {
        io.to(initiatorSocketId).emit("call:participant-rejected", {
          userId: socket.userId,
          userName: socket.user.name,
          reason: reason || "Call declined",
          callEnded: call.status === 'cancelled',
        });
      }

      console.log(`✅ [CALL:REJECT] User ${socket.userId} rejected call: ${roomId}`);
      ack?.({ success: true });
    } catch (error) {
      console.error(`❌ [CALL:REJECT] Error:`, error);
      ack?.({ success: false, error: "Failed to reject call" });
    }
  });

  /**
   * Leave/End a call
   */
  socket.on("call:leave", async (data, ack) => {
    console.log(`\n👋 [CALL:LEAVE] User ${socket.userId} leaving call`, data);
    try {
      const { roomId } = data;

      if (!roomId) {
        console.log(`❌ [CALL:LEAVE] roomId missing`);
        return ack?.({ success: false, error: "roomId is required" });
      }

      const call = await Call.findOne({ roomId });
      if (!call) {
        console.log(`❌ [CALL:LEAVE] Call not found for room ${roomId}`);
        return ack?.({ success: false, error: "Call not found" });
      }

      console.log(`✅ [CALL:LEAVE] Call found:`, call._id);

      // Update participant status
      call.updateParticipantStatus(socket.userId, 'left');
      
      // Check active participants (joined only, not ringing/calling)
      const activeParticipants = call.participants.filter(p => p.status === 'joined');
      console.log(`[CALL:LEAVE] Active participants remaining: ${activeParticipants.length}`);
      
      // End call if only one or no participants left
      if (activeParticipants.length <= 1) {
        call.status = 'ended';
        call.endedAt = new Date();
        console.log(`[CALL:LEAVE] Call ended - only ${activeParticipants.length} participant(s) remaining`);
      }
      
      await call.save();

      // Leave the room
      socket.leave(roomId);

      // Notify everyone in the room
      io.to(roomId).emit("call:participant-left", {
        userId: socket.userId,
        userName: socket.user.name,
        callEnded: call.status === 'ended',
      });

      console.log(`✅ [CALL:LEAVE] User ${socket.userId} left call: ${roomId}, call ended: ${call.status === 'ended'}`);
      ack?.({ success: true, callEnded: call.status === 'ended' });
    } catch (error) {
      console.error(`❌ [CALL:LEAVE] Error:`, error);
      ack?.({ success: false, error: "Failed to leave call" });
    }
  });

  /**
   * Cancel a call (before anyone joins)
   */
  socket.on("call:cancel", async (data, ack) => {
    try {
      const { roomId } = data;

      if (!roomId) {
        return ack?.({ success: false, error: "roomId is required" });
      }

      const call = await Call.findOne({ roomId });
      if (!call) {
        return ack?.({ success: false, error: "Call not found" });
      }

      // Only initiator can cancel
      if (call.initiator.toString() !== socket.userId) {
        return ack?.({ success: false, error: "Only initiator can cancel the call" });
      }

      // Update status
      call.status = 'cancelled';
      call.endedAt = new Date();
      await call.save();

      // Notify all participants
      io.to(roomId).emit("call:cancelled", {
        callerId: socket.userId,
        callerName: socket.user.name,
      });

      // Notify individual users who haven't joined the room yet
      for (const participant of call.participants) {
        if (participant.userId.toString() !== socket.userId) {
          const targetSocketId = userSockets.get(participant.userId.toString());
          if (targetSocketId) {
            io.to(targetSocketId).emit("call:cancelled", {
              callerId: socket.userId,
              callerName: socket.user.name,
              roomId,
            });
          }
        }
      }

      console.log(`🚫 Call cancelled by ${socket.userId}: ${roomId}`);
      ack?.({ success: true });
    } catch (error) {
      console.error("Error cancelling call:", error);
      ack?.({ success: false, error: "Failed to cancel call" });
    }
  });

  /**
   * WebRTC Signaling: Send offer
   */
  socket.on("call:offer", async (data, ack) => {
    console.log(`\n📨 [CALL:OFFER] User ${socket.userId} sending offer to ${data.targetUserId}`);
    try {
      const { roomId, targetUserId, offer } = data;

      if (!roomId || !targetUserId || !offer) {
        console.log(`❌ [CALL:OFFER] Missing required fields`);
        return ack?.({ success: false, error: "Missing required fields" });
      }

      const targetSocketId = userSockets.get(targetUserId);
      console.log(`[CALL:OFFER] Target socket ID: ${targetSocketId}`);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:offer", {
          fromUserId: socket.userId,
          offer,
          roomId,
        });
        console.log(`✅ [CALL:OFFER] Offer forwarded to ${targetUserId}`);
      } else {
        console.log(`⚠️ [CALL:OFFER] Target user ${targetUserId} not connected`);
      }

      ack?.({ success: true });
    } catch (error) {
      console.error("❌ [CALL:OFFER] Error sending offer:", error);
      ack?.({ success: false, error: "Failed to send offer" });
    }
  });

  /**
   * WebRTC Signaling: Send answer
   */
  socket.on("call:answer", async (data, ack) => {
    console.log(`\n📨 [CALL:ANSWER] User ${socket.userId} sending answer to ${data.targetUserId}`);
    try {
      const { roomId, targetUserId, answer } = data;

      if (!roomId || !targetUserId || !answer) {
        console.log(`❌ [CALL:ANSWER] Missing required fields`);
        return ack?.({ success: false, error: "Missing required fields" });
      }

      const targetSocketId = userSockets.get(targetUserId);
      console.log(`[CALL:ANSWER] Target socket ID: ${targetSocketId}`);
      if (targetSocketId) {
        io.to(targetSocketId).emit("call:answer", {
          fromUserId: socket.userId,
          answer,
          roomId,
        });
        console.log(`✅ [CALL:ANSWER] Answer forwarded to ${targetUserId}`);
      } else {
        console.log(`⚠️ [CALL:ANSWER] Target user ${targetUserId} not connected`);
      }

      ack?.({ success: true });
    } catch (error) {
      console.error("❌ [CALL:ANSWER] Error sending answer:", error);
      ack?.({ success: false, error: "Failed to send answer" });
    }
  });

  /**
   * WebRTC Signaling: Exchange ICE candidates
   */
  socket.on("call:ice-candidate", async (data, ack) => {
    try {
      const { roomId, targetUserId, candidate } = data;

      if (!roomId || !candidate) {
        return ack?.({ success: false, error: "Missing required fields" });
      }

      // If targetUserId specified, send to that user only
      if (targetUserId) {
        const targetSocketId = userSockets.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("call:ice-candidate", {
            fromUserId: socket.userId,
            candidate,
            roomId,
          });
        }
      } else {
        // Broadcast to room (excluding sender)
        socket.to(roomId).emit("call:ice-candidate", {
          fromUserId: socket.userId,
          candidate,
          roomId,
        });
      }

      ack?.({ success: true });
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
      ack?.({ success: false, error: "Failed to send ICE candidate" });
    }
  });

  /**
   * Toggle audio mute status
   */
  socket.on("call:toggle-audio", async (data, ack) => {
    try {
      const { roomId, isMuted } = data;

      if (!roomId) {
        return ack?.({ success: false, error: "roomId is required" });
      }

      // Broadcast to room
      socket.to(roomId).emit("call:audio-toggled", {
        userId: socket.userId,
        isMuted,
      });

      ack?.({ success: true });
    } catch (error) {
      console.error("Error toggling audio:", error);
      ack?.({ success: false, error: "Failed to toggle audio" });
    }
  });

  /**
   * Toggle video status
   */
  socket.on("call:toggle-video", async (data, ack) => {
    try {
      const { roomId, isVideoOff } = data;

      if (!roomId) {
        return ack?.({ success: false, error: "roomId is required" });
      }

      // Broadcast to room
      socket.to(roomId).emit("call:video-toggled", {
        userId: socket.userId,
        isVideoOff,
      });

      ack?.({ success: true });
    } catch (error) {
      console.error("Error toggling video:", error);
      ack?.({ success: false, error: "Failed to toggle video" });
    }
  });

  /**
   * Screen share status
   */
  socket.on("call:screen-share", async (data, ack) => {
    try {
      const { roomId, isSharing } = data;

      if (!roomId) {
        return ack?.({ success: false, error: "roomId is required" });
      }

      // Broadcast to room
      socket.to(roomId).emit("call:screen-share", {
        userId: socket.userId,
        isSharing,
      });

      console.log(`🖥️ Screen share ${isSharing ? 'started' : 'stopped'} by ${socket.userId} in ${roomId}`);
      ack?.({ success: true });
    } catch (error) {
      console.error("Error handling screen share:", error);
      ack?.({ success: false, error: "Failed to handle screen share" });
    }
  });

  /**
   * Add participant to ongoing call
   */
  socket.on("call:add-participant", async (data, ack) => {
    try {
      const { roomId, userId } = data;

      if (!roomId || !userId) {
        return ack?.({ success: false, error: "Missing required fields" });
      }

      const call = await Call.findOne({ roomId });
      if (!call) {
        return ack?.({ success: false, error: "Call not found" });
      }

      // Check if already an active participant (not left or rejected)
      const existing = call.participants.find(p => p.userId.toString() === userId);
      if (existing && ['calling', 'ringing', 'joined'].includes(existing.status)) {
        return ack?.({ success: false, error: "User is already in the call" });
      }
      
      // Check max participants (only count active ones)
      const activeParticipants = call.participants.filter(p => 
        ['calling', 'ringing', 'joined'].includes(p.status)
      );
      if (activeParticipants.length >= MAX_PARTICIPANTS) {
        return ack?.({ success: false, error: `Maximum ${MAX_PARTICIPANTS} participants reached` });
      }

      // Check if user is in another call (different room)
      const userCall = await Call.findActiveCallForUser(userId);
      if (userCall && userCall.roomId !== roomId) {
        return ack?.({ success: false, error: "User is already in another call" });
      }
      
      // If user was in the call but left/rejected, update their status instead of adding new
      if (existing && ['left', 'rejected'].includes(existing.status)) {
        existing.status = 'ringing';
        existing.leftAt = undefined;
      } else if (!existing) {
        // Add as new participant
        call.addParticipant(userId, 'ringing');
      }
      await call.save();

      // Send invitation
      const targetSocketId = userSockets.get(userId);
      if (targetSocketId) {
        await call.populate('initiator', 'name image handle');
        await call.populate('participants.userId', 'name image handle');
        
        io.to(targetSocketId).emit("call:incoming", {
          call: call.toObject(),
          roomId,
          callerId: socket.userId,
          callerName: socket.user.name,
          callerImage: socket.user.image,
          callType: call.callType,
        });
      }

      console.log(`➕ ${userId} added to call ${roomId} by ${socket.userId}`);
      
      // Check if call type should be upgraded to 'group'
      const currentActiveParticipants = call.participants.filter(p => 
        ['calling', 'ringing', 'joined'].includes(p.status)
      );
      if (currentActiveParticipants.length > 2 && call.type === 'direct') {
        call.type = 'group';
        await call.save();
        console.log(`📊 [CALL:ADD-PARTICIPANT] Call type upgraded to 'group' (${currentActiveParticipants.length} participants)`);
        
        // Notify all participants of type change
        io.to(roomId).emit("call:type-changed", {
          type: 'group',
          participantCount: currentActiveParticipants.length,
        });
      }
      
      ack?.({ success: true });
    } catch (error) {
      console.error("Error adding participant:", error);
      ack?.({ success: false, error: "Failed to add participant" });
    }
  });

  /**
   * Upgrade call type (audio → video or direct → group)
   */
  socket.on("call:upgrade-type", async (data, ack) => {
    console.log(`\n🔄 [CALL:UPGRADE-TYPE] User ${socket.userId} upgrading call type`, data);
    try {
      const { roomId, newCallType } = data;

      if (!roomId) {
        console.log(`❌ [CALL:UPGRADE-TYPE] roomId missing`);
        return ack?.({ success: false, error: "roomId is required" });
      }

      if (!['audio', 'video'].includes(newCallType)) {
        console.log(`❌ [CALL:UPGRADE-TYPE] Invalid callType: ${newCallType}`);
        return ack?.({ success: false, error: "callType must be 'audio' or 'video'" });
      }

      const call = await Call.findOne({ roomId });
      if (!call) {
        console.log(`❌ [CALL:UPGRADE-TYPE] Call not found for room ${roomId}`);
        return ack?.({ success: false, error: "Call not found" });
      }

      // Check if user is in the call
      const participant = call.participants.find(p => p.userId.toString() === socket.userId);
      if (!participant || !['calling', 'joined'].includes(participant.status)) {
        console.log(`❌ [CALL:UPGRADE-TYPE] User ${socket.userId} not in call ${roomId}`);
        return ack?.({ success: false, error: "You are not in this call" });
      }

      // Update call type
      const oldCallType = call.callType;
      call.callType = newCallType;
      await call.save();

      console.log(`✅ [CALL:UPGRADE-TYPE] Call type upgraded from ${oldCallType} to ${newCallType}`);

      // Notify all participants in the room
      io.to(roomId).emit("call:type-upgraded", {
        oldCallType,
        newCallType,
        upgradedBy: socket.userId,
        upgraderName: socket.user.name,
      });

      ack?.({ success: true, oldCallType, newCallType });
    } catch (error) {
      console.error("❌ [CALL:UPGRADE-TYPE] Error:", error);
      ack?.({ success: false, error: "Failed to upgrade call type" });
    }
  });

  /**
   * Handle disconnect - clean up any active calls
   */
  socket.on("disconnect", async () => {
    try {
      // Find any active call for this user
      const call = await Call.findActiveCallForUser(socket.userId);
      if (call) {
        // Update participant status
        call.updateParticipantStatus(socket.userId, 'left');
        
        // Check if call should end
        if (call.shouldEnd()) {
          call.status = 'ended';
          call.endedAt = new Date();
        }
        
        await call.save();

        // Notify room
        io.to(call.roomId).emit("call:participant-left", {
          userId: socket.userId,
          userName: socket.user?.name || 'User',
          callEnded: call.status === 'ended',
        });

        console.log(`🔌 ${socket.userId} disconnected from call: ${call.roomId}`);
      }
    } catch (error) {
      console.error("Error handling disconnect in call:", error);
    }
  });
}
