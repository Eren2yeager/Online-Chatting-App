import Chat from "../../src/models/Chat.js";

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
