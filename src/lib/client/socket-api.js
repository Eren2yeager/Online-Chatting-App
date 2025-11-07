/**
 * Socket-based API client
 * Replaces HTTP API calls with Socket.IO events
 */

/**
 * Emit a socket event with acknowledgment and error handling
 * @param {Object} socket - Socket instance
 * @param {string} event - Event name
 * @param {Object} data - Event data
 * @param {number} timeout - Timeout in ms
 * @returns {Promise} - Resolves with response or rejects with error
 */
function emitWithAck(socket, event, data, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error(`Event ${event} timed out after ${timeout}ms`));
    }, timeout);

    socket.emit(event, data, (response) => {
      clearTimeout(timer);
      
      if (response && response.success === false) {
        reject(new Error(response.error || 'Unknown error'));
      } else {
        resolve(response);
      }
    });
  });
}

// ============================================================================
// MESSAGE API
// ============================================================================

export async function sendMessage(socket, { chatId, text, media, replyTo }) {
  return emitWithAck(socket, 'message:new', {
    chatId,
    text,
    media,
    replyTo
  });
}

export async function editMessage(socket, { messageId, text, media }) {
  return emitWithAck(socket, 'message:edit', {
    messageId,
    text,
    media
  });
}

export async function deleteMessage(socket, { messageId, deleteForEveryone = false }) {
  return emitWithAck(socket, 'message:delete', {
    messageId,
    deleteForEveryone
  });
}

export async function markMessageRead(socket, { messageId, chatId }) {
  console.log('📖 socketApi.markMessageRead called:', { messageId, chatId });
  const result = await emitWithAck(socket, 'message:read', {
    messageId,
    chatId
  });
  console.log('📖 socketApi.markMessageRead result:', result);
  return result;
}

export async function addReaction(socket, { messageId, emoji }) {
  return emitWithAck(socket, 'reaction:add', {
    messageId,
    emoji
  });
}

export async function removeReaction(socket, { messageId }) {
  // To remove reaction, just add empty emoji or handle on server
  return emitWithAck(socket, 'reaction:add', {
    messageId,
    emoji: ''
  });
}

// ============================================================================
// CHAT API
// ============================================================================

export async function createChat(socket, { participants, isGroup, name, image, description }) {
  return emitWithAck(socket, 'chat:create', {
    participants,
    isGroup,
    name,
    image,
    description
  });
}

export async function updateChat(socket, { chatId, name, image, description, privacy }) {
  return emitWithAck(socket, 'chat:update', {
    chatId,
    name,
    image,
    description,
    privacy
  });
}

export async function addChatMembers(socket, { chatId, userIds }) {
  return emitWithAck(socket, 'chat:member:add', {
    chatId,
    userIds
  });
}

export async function removeChatMember(socket, { chatId, userId }) {
  return emitWithAck(socket, 'chat:member:remove', {
    chatId,
    userId
  });
}

export async function promoteAdmin(socket, { chatId, userId }) {
  return emitWithAck(socket, 'admin:promote', {
    chatId,
    userId
  });
}

export async function demoteAdmin(socket, { chatId, userId }) {
  return emitWithAck(socket, 'admin:demote', {
    chatId,
    userId
  });
}

// ============================================================================
// FRIEND API
// ============================================================================

export async function sendFriendRequest(socket, { handle, message }) {
  return emitWithAck(socket, 'friend:request:create', {
    handle,
    message
  });
}

export async function acceptFriendRequest(socket, { requestId }) {
  return emitWithAck(socket, 'friend:request:action', {
    requestId,
    action: 'accept'
  });
}

export async function rejectFriendRequest(socket, { requestId }) {
  return emitWithAck(socket, 'friend:request:action', {
    requestId,
    action: 'reject'
  });
}

export async function cancelFriendRequest(socket, { requestId }) {
  return emitWithAck(socket, 'friend:request:action', {
    requestId,
    action: 'cancel'
  });
}

export async function removeFriend(socket, { friendId }) {
  return emitWithAck(socket, 'friend:remove', {
    friendId
  });
}

// ============================================================================
// USER API
// ============================================================================

export async function updateProfile(socket, { name, bio, image, handle }) {
  return emitWithAck(socket, 'profile:update', {
    name,
    bio,
    image,
    handle
  });
}

export async function blockUser(socket, { userId }) {
  return emitWithAck(socket, 'user:block', {
    userId
  });
}

export async function unblockUser(socket, { userId }) {
  return emitWithAck(socket, 'user:unblock', {
    userId
  });
}

// ============================================================================
// TYPING API
// ============================================================================

export function startTyping(socket, { chatId }) {
  if (socket && socket.connected) {
    socket.emit('typing:start', { chatId });
  }
}

export function stopTyping(socket, { chatId }) {
  if (socket && socket.connected) {
    socket.emit('typing:stop', { chatId });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Setup socket event listeners for real-time updates
 * @param {Object} socket - Socket instance
 * @param {Object} handlers - Event handlers
 */
export function setupSocketListeners(socket, handlers = {}) {
  if (!socket) return () => {};

  const {
    onMessageNew,
    onMessageEdit,
    onMessageDelete,
    onMessageRead,
    onReactionUpdate,
    onChatCreated,
    onChatUpdated,
    onChatLeft,
    onChatRemoved,
    onFriendRequestNew,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    onFriendRequestCancelled,
    onFriendRemoved,
    onProfileUpdated,
    onUserBlocked,
    onUserUnblocked,
    onTypingStart,
    onTypingStop,
    onPresenceUpdate,
  } = handlers;

  // Message events
  if (onMessageNew) socket.on('message:new', onMessageNew);
  if (onMessageEdit) socket.on('message:edit', onMessageEdit);
  if (onMessageDelete) socket.on('message:delete', onMessageDelete);
  if (onMessageRead) socket.on('message:read', onMessageRead);
  if (onReactionUpdate) socket.on('reaction:update', onReactionUpdate);

  // Chat events
  if (onChatCreated) socket.on('chat:created', onChatCreated);
  if (onChatUpdated) socket.on('chat:updated', onChatUpdated);
  if (onChatLeft) socket.on('chat:left', onChatLeft);
  if (onChatRemoved) socket.on('chat:removed', onChatRemoved);

  // Friend events
  if (onFriendRequestNew) socket.on('friend:request:new', onFriendRequestNew);
  if (onFriendRequestAccepted) socket.on('friend:request:accepted', onFriendRequestAccepted);
  if (onFriendRequestRejected) socket.on('friend:request:rejected', onFriendRequestRejected);
  if (onFriendRequestCancelled) socket.on('friend:request:cancelled', onFriendRequestCancelled);
  if (onFriendRemoved) socket.on('friend:removed', onFriendRemoved);

  // User events
  if (onProfileUpdated) socket.on('profile:updated', onProfileUpdated);
  if (onUserBlocked) socket.on('user:blocked', onUserBlocked);
  if (onUserUnblocked) socket.on('user:unblocked', onUserUnblocked);

  // Typing events
  if (onTypingStart) socket.on('typing:start', onTypingStart);
  if (onTypingStop) socket.on('typing:stop', onTypingStop);

  // Presence events
  if (onPresenceUpdate) socket.on('presence:update', onPresenceUpdate);

  // Return cleanup function
  return () => {
    if (onMessageNew) socket.off('message:new', onMessageNew);
    if (onMessageEdit) socket.off('message:edit', onMessageEdit);
    if (onMessageDelete) socket.off('message:delete', onMessageDelete);
    if (onMessageRead) socket.off('message:read', onMessageRead);
    if (onReactionUpdate) socket.off('reaction:update', onReactionUpdate);
    if (onChatCreated) socket.off('chat:created', onChatCreated);
    if (onChatUpdated) socket.off('chat:updated', onChatUpdated);
    if (onChatLeft) socket.off('chat:left', onChatLeft);
    if (onChatRemoved) socket.off('chat:removed', onChatRemoved);
    if (onFriendRequestNew) socket.off('friend:request:new', onFriendRequestNew);
    if (onFriendRequestAccepted) socket.off('friend:request:accepted', onFriendRequestAccepted);
    if (onFriendRequestRejected) socket.off('friend:request:rejected', onFriendRequestRejected);
    if (onFriendRequestCancelled) socket.off('friend:request:cancelled', onFriendRequestCancelled);
    if (onFriendRemoved) socket.off('friend:removed', onFriendRemoved);
    if (onProfileUpdated) socket.off('profile:updated', onProfileUpdated);
    if (onUserBlocked) socket.off('user:blocked', onUserBlocked);
    if (onUserUnblocked) socket.off('user:unblocked', onUserUnblocked);
    if (onTypingStart) socket.off('typing:start', onTypingStart);
    if (onTypingStop) socket.off('typing:stop', onTypingStop);
    if (onPresenceUpdate) socket.off('presence:update', onPresenceUpdate);
  };
}
