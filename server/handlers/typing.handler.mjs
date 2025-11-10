import { addTypingUser, removeTypingUser } from "../utils/typing.mjs";

/**
 * Register typing indicator event handlers
 * @param {Object} socket - Socket instance
 */
export function registerTypingHandlers(socket) {
  /**
   * Handle typing start event
   * Broadcasts to other users in the chat that this user is typing
   */
  socket.on("typing:start", (data) => {
    const { chatId } = data;
    if (!chatId) return;

    // Extract user info to send to clients
    const user = {
      _id: socket.user._id?.toString?.() || socket.user.id,
      name: socket.user.name,
      image: socket.user.image,
      handle: socket.user.handle,
    };

    // Track typing on server
    addTypingUser(chatId, user._id, user);

    // Broadcast to other users in the chat
    socket.to(`chat:${chatId}`).emit("typing:start", {
      chatId,
      user,
    });
  });

  /**
   * Handle typing stop event
   * Broadcasts to other users that this user stopped typing
   */
  socket.on("typing:stop", (data) => {
    const { chatId } = data;
    if (!chatId) return;

    const user = {
      _id: socket.user._id?.toString?.() || socket.user.id,
      name: socket.user.name,
      image: socket.user.image,
      handle: socket.user.handle,
    };

    // Remove from typing tracking
    removeTypingUser(chatId, user._id);

    // Broadcast to other users in the chat
    socket.to(`chat:${chatId}`).emit("typing:stop", {
      chatId,
      user,
    });
  });
}
