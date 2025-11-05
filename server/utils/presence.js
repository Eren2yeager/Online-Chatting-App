import User from "../../src/models/User.js";

/**
 * Update user online/offline status
 * @param {Object} io - Socket.IO server instance
 * @param {string} userId - User ID
 * @param {string} status - 'online' or 'offline'
 */
export async function updateUserPresence(io, userId, status = "online") {
  try {
    await User.findByIdAndUpdate(userId, {
      status,
      lastSeen: new Date(),
    });

    // Broadcast presence update to all connected users
    io.emit("presence:update", {
      userId,
      status,
      lastSeen: new Date(),
    });
  } catch (error) {
    console.error("Error updating user presence:", error);
  }
}
