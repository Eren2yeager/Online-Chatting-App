# Migration Guide: HTTP APIs to Socket Events

This guide helps you migrate from HTTP API calls to Socket.IO events.

## What Changed?

The following operations now use Socket.IO instead of HTTP APIs for real-time efficiency:

### ✅ Already Migrated (Working)
- Sending messages
- Editing messages
- Deleting messages
- Reactions
- Read receipts
- Typing indicators
- Friend requests (create, accept, reject, cancel)
- Friend removal

### 🆕 Newly Added Socket Events
- Chat creation
- Chat updates
- Admin promotion/demotion
- User blocking/unblocking
- Profile updates

## Migration Examples

### 1. Creating a Chat

**Before (HTTP):**
```javascript
const response = await fetch('/api/chats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participants: ['user1', 'user2'],
    isGroup: true,
    name: 'My Group'
  })
});
const data = await response.json();
```

**After (Socket):**
```javascript
socket.emit('chat:create', {
  participants: ['user1', 'user2'],
  isGroup: true,
  name: 'My Group'
}, (response) => {
  if (response.success) {
    console.log('Chat created:', response.chat);
  }
});

// Listen for chat creation
socket.on('chat:created', ({ chat }) => {
  // Add chat to your state
});
```

### 2. Updating Chat Settings

**Before (HTTP):**
```javascript
const response = await fetch(`/api/chats/${chatId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Name',
    description: 'New description'
  })
});
```

**After (Socket):**
```javascript
socket.emit('chat:update', {
  chatId,
  name: 'New Name',
  description: 'New description'
}, (response) => {
  if (response.success) {
    console.log('Chat updated:', response.chat);
  }
});

// Listen for updates
socket.on('chat:updated', ({ chat }) => {
  // Update chat in your state
});
```

### 3. Blocking a User

**Before (HTTP):**
```javascript
const response = await fetch('/api/users/block', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId })
});
```

**After (Socket):**
```javascript
socket.emit('user:block', { userId }, (response) => {
  if (response.success) {
    console.log('User blocked');
  }
});

// Listen for being blocked
socket.on('user:blocked', ({ userId }) => {
  // Handle being blocked
});

// Listen for chat removal
socket.on('chat:removed', ({ chatId }) => {
  // Remove chat from state
});
```

### 4. Updating Profile

**Before (HTTP):**
```javascript
const response = await fetch('/api/users/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Name',
    bio: 'New bio'
  })
});
```

**After (Socket):**
```javascript
socket.emit('profile:update', {
  name: 'New Name',
  bio: 'New bio'
}, (response) => {
  if (response.success) {
    console.log('Profile updated:', response.user);
  }
});

// Listen for friend profile updates
socket.on('profile:updated', ({ userId, name, bio, image, handle }) => {
  // Update friend's profile in your state
});
```

### 5. Promoting Admin

**Before (HTTP):**
```javascript
const response = await fetch(`/api/chats/${chatId}/admins`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId })
});
```

**After (Socket):**
```javascript
socket.emit('admin:promote', {
  chatId,
  userId
}, (response) => {
  if (response.success) {
    console.log('Admin promoted');
  }
});

// Updates come via chat:updated event
socket.on('chat:updated', ({ chat }) => {
  // Chat.admins array is updated
});
```

## What to Keep as HTTP

These should remain as HTTP GET requests for initial data loading:

- `GET /api/chats` - Get all chats
- `GET /api/chats/[chatId]` - Get chat details
- `GET /api/messages?chatId=...` - Get messages (pagination)
- `GET /api/users` - Search users
- `GET /api/users/friends` - Get friends list
- `GET /api/friends/requests` - Get friend requests
- `GET /api/chats/[chatId]/media` - Get media gallery
- `POST /api/upload` - Upload files

## Benefits of Socket Events

1. **Real-time updates** - All participants get updates instantly
2. **Single source of truth** - Server broadcasts to all clients
3. **Reduced latency** - No HTTP overhead
4. **Automatic reconnection** - Socket.IO handles reconnects
5. **Acknowledgments** - Built-in response callbacks
6. **System messages** - Automatic event logging in chat

## Client Setup

Make sure your socket client is properly initialized:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: userIdOrJWT // Your auth token
  },
  transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from socket server');
});

// Register all your event listeners
socket.on('message:new', handleNewMessage);
socket.on('chat:created', handleChatCreated);
socket.on('chat:updated', handleChatUpdated);
// ... etc
```

## Error Handling

All socket events with acknowledgments return a response:

```javascript
socket.emit('chat:create', data, (response) => {
  if (response.success) {
    // Success
    console.log(response.chat);
  } else {
    // Error
    console.error(response.error);
    // Show error to user
  }
});
```

## Testing

Test your socket events using the browser console:

```javascript
// In browser console
socket.emit('chat:create', {
  participants: ['userId1'],
  isGroup: false
}, console.log);
```

## Next Steps

1. Update your client code to use socket events instead of HTTP APIs
2. Remove old HTTP API routes that are now handled by sockets
3. Test all functionality thoroughly
4. Monitor socket connections and events in production

## Questions?

Refer to `SOCKET_EVENTS.md` for complete event documentation.
