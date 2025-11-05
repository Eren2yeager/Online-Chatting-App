# Testing Socket Events

Quick guide for testing socket events in your chat application.

## Setup

1. Start the server:
```bash
npm run dev
```

2. Open browser console on your app
3. Access the socket instance (usually available as `socket` or via your socket context)

## Browser Console Testing

### Connect to Socket

```javascript
// If not already connected
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-user-id-or-jwt'
  }
});

socket.on('connect', () => console.log('Connected!'));
```

### Test Message Events

```javascript
// Send a message
socket.emit('message:new', {
  chatId: 'your-chat-id',
  text: 'Test message'
}, console.log);

// Edit a message
socket.emit('message:edit', {
  messageId: 'message-id',
  text: 'Updated text'
}, console.log);

// Delete a message
socket.emit('message:delete', {
  messageId: 'message-id',
  deleteForEveryone: false
}, console.log);

// Add reaction
socket.emit('reaction:add', {
  messageId: 'message-id',
  emoji: '👍'
}, console.log);

// Mark as read
socket.emit('message:read', {
  messageId: 'message-id',
  chatId: 'chat-id'
}, console.log);
```

### Test Chat Events

```javascript
// Create a direct chat
socket.emit('chat:create', {
  participants: ['user-id'],
  isGroup: false
}, console.log);

// Create a group chat
socket.emit('chat:create', {
  participants: ['user-id-1', 'user-id-2'],
  isGroup: true,
  name: 'Test Group',
  description: 'Testing group creation'
}, console.log);

// Update chat
socket.emit('chat:update', {
  chatId: 'chat-id',
  name: 'New Group Name',
  description: 'New description'
}, console.log);

// Add member
socket.emit('chat:member:add', {
  chatId: 'chat-id',
  userIds: ['user-id']
}, console.log);

// Remove member
socket.emit('chat:member:remove', {
  chatId: 'chat-id',
  userId: 'user-id'
}, console.log);

// Promote admin
socket.emit('admin:promote', {
  chatId: 'chat-id',
  userId: 'user-id'
}, console.log);

// Demote admin
socket.emit('admin:demote', {
  chatId: 'chat-id',
  userId: 'user-id'
}, console.log);
```

### Test Friend Events

```javascript
// Send friend request
socket.emit('friend:request:create', {
  handle: '@username',
  message: 'Hey, let\'s be friends!'
}, console.log);

// Accept friend request
socket.emit('friend:request:action', {
  requestId: 'request-id',
  action: 'accept'
}, console.log);

// Reject friend request
socket.emit('friend:request:action', {
  requestId: 'request-id',
  action: 'reject'
}, console.log);

// Cancel friend request
socket.emit('friend:request:action', {
  requestId: 'request-id',
  action: 'cancel'
}, console.log);

// Remove friend
socket.emit('friend:remove', {
  friendId: 'user-id'
}, console.log);
```

### Test User Events

```javascript
// Update profile
socket.emit('profile:update', {
  name: 'New Name',
  bio: 'New bio',
  handle: 'newhandle'
}, console.log);

// Block user
socket.emit('user:block', {
  userId: 'user-id'
}, console.log);

// Unblock user
socket.emit('user:unblock', {
  userId: 'user-id'
}, console.log);
```

### Test Typing Events

```javascript
// Start typing
socket.emit('typing:start', {
  chatId: 'chat-id'
});

// Stop typing
socket.emit('typing:stop', {
  chatId: 'chat-id'
});
```

## Listen to Events

Set up listeners to see real-time updates:

```javascript
// Message events
socket.on('message:new', (data) => console.log('New message:', data));
socket.on('message:edit', (data) => console.log('Message edited:', data));
socket.on('message:delete', (data) => console.log('Message deleted:', data));
socket.on('message:read', (data) => console.log('Message read:', data));
socket.on('reaction:update', (data) => console.log('Reaction updated:', data));

// Chat events
socket.on('chat:created', (data) => console.log('Chat created:', data));
socket.on('chat:updated', (data) => console.log('Chat updated:', data));
socket.on('chat:left', (data) => console.log('Left chat:', data));
socket.on('chat:removed', (data) => console.log('Chat removed:', data));

// Friend events
socket.on('friend:request:new', (data) => console.log('New friend request:', data));
socket.on('friend:request:accepted', (data) => console.log('Request accepted:', data));
socket.on('friend:request:rejected', (data) => console.log('Request rejected:', data));
socket.on('friend:request:cancelled', (data) => console.log('Request cancelled:', data));
socket.on('friend:removed', (data) => console.log('Friend removed:', data));

// User events
socket.on('profile:updated', (data) => console.log('Profile updated:', data));
socket.on('user:blocked', (data) => console.log('User blocked you:', data));
socket.on('user:unblocked', (data) => console.log('User unblocked you:', data));

// Typing events
socket.on('typing:start', (data) => console.log('User typing:', data));
socket.on('typing:stop', (data) => console.log('User stopped typing:', data));

// Presence events
socket.on('presence:update', (data) => console.log('Presence update:', data));
```

## Multi-User Testing

To test real-time features, open multiple browser windows:

1. **Window 1**: User A
2. **Window 2**: User B

### Test Scenario 1: Direct Chat

**Window 1 (User A):**
```javascript
socket.emit('chat:create', {
  participants: ['user-b-id'],
  isGroup: false
}, console.log);
```

**Window 2 (User B):**
```javascript
// Should receive chat:created event
socket.on('chat:created', console.log);
```

### Test Scenario 2: Group Chat

**Window 1 (User A - Creator):**
```javascript
socket.emit('chat:create', {
  participants: ['user-b-id'],
  isGroup: true,
  name: 'Test Group'
}, console.log);
```

**Window 2 (User B):**
```javascript
// Should receive chat:created event
socket.on('chat:created', console.log);
```

### Test Scenario 3: Real-time Messaging

**Window 1 (User A):**
```javascript
socket.emit('message:new', {
  chatId: 'chat-id',
  text: 'Hello from User A!'
}, console.log);
```

**Window 2 (User B):**
```javascript
// Should receive message:new event immediately
socket.on('message:new', console.log);
```

### Test Scenario 4: Typing Indicators

**Window 1 (User A):**
```javascript
socket.emit('typing:start', { chatId: 'chat-id' });
```

**Window 2 (User B):**
```javascript
// Should see User A typing
socket.on('typing:start', console.log);

// After 5 seconds, should auto-stop
socket.on('typing:stop', console.log);
```

## Testing with Postman/Insomnia

You can also test socket events using Postman or Insomnia:

1. Create a new WebSocket request
2. Connect to `ws://localhost:3000`
3. Send authentication in handshake:
```json
{
  "auth": {
    "token": "your-user-id-or-jwt"
  }
}
```
4. Send events as JSON:
```json
{
  "event": "message:new",
  "data": {
    "chatId": "chat-id",
    "text": "Test message"
  }
}
```

## Automated Testing

Create test scripts for automated testing:

```javascript
// test-socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'test-user-id' }
});

socket.on('connect', async () => {
  console.log('✅ Connected');
  
  // Test message creation
  socket.emit('message:new', {
    chatId: 'test-chat-id',
    text: 'Test message'
  }, (response) => {
    if (response.success) {
      console.log('✅ Message sent');
    } else {
      console.error('❌ Message failed:', response.error);
    }
  });
  
  // Add more tests...
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

Run with:
```bash
node test-socket.js
```

## Common Issues

### Connection Failed
- Check if server is running
- Verify auth token is valid
- Check CORS settings

### Event Not Received
- Ensure you're listening before emitting
- Check if you're in the correct chat room
- Verify user permissions

### Acknowledgment Timeout
- Check server logs for errors
- Verify data format is correct
- Ensure required fields are provided

## Debugging

Enable socket.io debug logs:

```javascript
localStorage.debug = 'socket.io-client:socket';
```

Or in Node.js:
```bash
DEBUG=socket.io* node server/socket-server.js
```

## Performance Testing

Test with multiple concurrent connections:

```javascript
// stress-test.js
import { io } from 'socket.io-client';

const connections = [];
const numConnections = 100;

for (let i = 0; i < numConnections; i++) {
  const socket = io('http://localhost:3000', {
    auth: { token: `test-user-${i}` }
  });
  
  socket.on('connect', () => {
    console.log(`User ${i} connected`);
  });
  
  connections.push(socket);
}
```

## Next Steps

1. Test all events manually
2. Create automated test suite
3. Test with multiple users
4. Monitor server performance
5. Check error handling
6. Verify permission checks

## Resources

- Socket.IO Client API: https://socket.io/docs/v4/client-api/
- Socket.IO Server API: https://socket.io/docs/v4/server-api/
- Testing Guide: https://socket.io/docs/v4/testing/
