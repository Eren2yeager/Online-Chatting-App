import Chat from "../../src/models/Chat.mjs";

/**
 * Join user to all their chat rooms
 * @param {Object} socket - Socket instance
 * @param {string} userId - User ID
 * @param {Map} userRooms - Map to store user room memberships
 */
export async function joinUserToChats(socket, userId, userRooms) {
  try {
    const chats = await Chat.find({ participants: userId });
    const roomIds = chats.map((chat) => `chat:${chat._id}`);

    // Join personal user room for direct notifications and unread counts
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    // Join all chat rooms
    for (const roomId of roomIds) {
      socket.join(roomId);
    }

    // Store all rooms including user room
    userRooms.set(userId, [userRoom, ...roomIds]);
    console.log(`User ${userId} joined personal room and ${roomIds.length} chat rooms`);
  } catch (error) {
    console.error("Error joining user to chats:", error);
  }
}

/**
 * Join all participants of a chat to the chat room
 * @param {Object} io - Socket.IO server instance
 * @param {string} chatId - Chat ID
 * @param {Array} participantIds - Array of participant user IDs
 * @param {Map} userSockets - Map of userId to socketId
 */
export function joinParticipantsToChat(io, chatId, participantIds, userSockets) {
  const chatRoom = `chat:${chatId}`;
  
  console.log(`Joining participants to chat room: ${chatRoom}`);
  console.log(`Participants:`, participantIds);
  console.log(`Available sockets:`, Array.from(userSockets.keys()));
  
  for (const participantId of participantIds) {
    const participantIdStr = participantId.toString();
    const socketId = userSockets.get(participantIdStr);
    
    console.log(`Checking participant ${participantIdStr}: socketId = ${socketId}`);
    
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(chatRoom);
        console.log(`✅ User ${participantIdStr} joined chat room: ${chatRoom}`);
      } else {
        console.log(`❌ Socket not found for socketId: ${socketId}`);
      }
    } else {
      console.log(`❌ No socketId found for user: ${participantIdStr}`);
    }
  }
}
