/**
 * Typing indicator management
 * Tracks which users are typing in which chats with auto-cleanup
 */

// Store typing users per chat: chatId -> Map(userId -> { user, timeout })
const typingUsers = new Map();

/**
 * Add user to typing list with automatic cleanup after 5 seconds
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @param {Object} user - User object with basic info
 */
export function addTypingUser(chatId, userId, user) {
  if (!typingUsers.has(chatId)) {
    typingUsers.set(chatId, new Map());
  }

  const chatTypingUsers = typingUsers.get(chatId);

  // Clear existing timeout if user was already typing
  if (chatTypingUsers.has(userId)) {
    clearTimeout(chatTypingUsers.get(userId).timeout);
  }

  // Auto-remove user after 5 seconds of inactivity
  const timeout = setTimeout(() => {
    removeTypingUser(chatId, userId);
  }, 5000);

  chatTypingUsers.set(userId, { user, timeout });
}

/**
 * Remove user from typing list
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 */
export function removeTypingUser(chatId, userId) {
  const chatTypingUsers = typingUsers.get(chatId);
  if (chatTypingUsers && chatTypingUsers.has(userId)) {
    const { timeout } = chatTypingUsers.get(userId);
    clearTimeout(timeout);
    chatTypingUsers.delete(userId);

    // Clean up empty chat entries
    if (chatTypingUsers.size === 0) {
      typingUsers.delete(chatId);
    }
  }
}

/**
 * Clean up all typing indicators for a user (on disconnect)
 * @param {string} userId - User ID
 */
export function cleanupUserTyping(userId) {
  for (const [chatId, chatTypingUsers] of typingUsers.entries()) {
    if (chatTypingUsers.has(userId)) {
      removeTypingUser(chatId, userId);
    }
  }
}
