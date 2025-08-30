import { apiRequest } from './api.js';

export async function fetchMessages({ chatId, limit = 50, before }) {
  const params = new URLSearchParams({ chatId, limit: String(limit) });
  if (before) params.append('before', before);
  return apiRequest(`/api/messages?${params.toString()}`);
}

export async function sendMessage({ chatId, text, media, replyTo }) {
  return apiRequest('/api/messages', { method: 'POST', body: { chatId, text, media, replyTo } });
}

export async function addReaction({ messageId, emoji }) {
  return apiRequest(`/api/messages/${messageId}/reactions`, { method: 'POST', body: { emoji } });
}

export async function removeReaction({ messageId, emoji }) {
  return apiRequest(`/api/messages/${messageId}/reactions`, { method: 'DELETE', body: emoji ? { emoji } : undefined });
}

export async function markChatRead({ chatId, upToMessageId }) {
  return apiRequest(`/api/chats/${chatId}/read`, { method: 'POST', body: upToMessageId ? { upToMessageId } : {} });
}


