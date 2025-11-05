import { apiRequest } from './api.js';
import * as socketApi from './socket-api.js';

// Keep HTTP for fetching messages (pagination)
export async function fetchMessages({ chatId, limit = 50, before }) {
  const params = new URLSearchParams({ chatId, limit: String(limit) });
  if (before) params.append('before', before);
  return apiRequest(`/api/messages?${params.toString()}`);
}

// Use socket for sending messages (real-time)
export async function sendMessage(socket, { chatId, text, media, replyTo }) {
  return socketApi.sendMessage(socket, { chatId, text, media, replyTo });
}

// Use socket for reactions (real-time)
export async function addReaction(socket, { messageId, emoji }) {
  return socketApi.addReaction(socket, { messageId, emoji });
}

export async function removeReaction(socket, { messageId }) {
  return socketApi.removeReaction(socket, { messageId });
}

// Use socket for read receipts (real-time)
export async function markChatRead(socket, { chatId, messageId }) {
  return socketApi.markMessageRead(socket, { chatId, messageId });
}


