# Socket Server

Real-time Socket.IO server for the chat application.

## Structure

```
server/
├── handlers/           # Event handlers organized by feature
│   ├── chat.handler.js      # Chat management events
│   ├── friend.handler.js    # Friend request events
│   ├── message.handler.js   # Message events
│   ├── typing.handler.js    # Typing indicators
│   ├── user.handler.js      # User profile & blocking
│   ├── call.handler.js      # WebRTC calling (NEW)
│   └── index.js             # Handler exports
├── utils/              # Utility functions
│   ├── auth.js              # Socket authentication
│   ├── presence.js          # User online/offline status
│   ├── rooms.js             # Chat room management
│   └── typing.js            # Typing indicator tracking
├── socket-server.js    # Main server file
├── SOCKET_EVENTS.md    # Complete event documentation
├── CALLING_SYSTEM.md   # WebRTC calling documentation (NEW)
├── MIGRATION_GUIDE.md  # HTTP to Socket migration guide
└── README.md           # This file
```

## Features

### Real-time Messaging
- Send, edit, delete messages
- Message reactions
- Read receipts
- Typing indicators
- Reply to messages
- Media attachments

### WebRTC Calling (NEW)
- Peer-to-peer audio calls
- Peer-to-peer video calls
- Call signaling via Socket.IO
- Mute/unmute audio
- Toggle video on/off
- Screen sharing with track replacement
- ICE candidate exchange for NAT traversal

### Chat Management
- Create direct and group chats
- Update chat settings (name, image, description)
- Add/remove members
- Promote/demote admins
- Leave chats

### Friend System
- Send friend requests
- Accept/reject/cancel requests
- Remove friends
- Real-time friend status updates

### User Features
- Profile updates
- Block/unblock users
- Online/offline presence
- Last seen tracking

## Running the Server

The socket server runs on the same port as Next.js:

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Custom port
node server/socket-server.js -p 3001
```

## Environment Variables

Required in `.env.local`:

```env
MONGODB_URI=mongodb://...
NEXTAUTH_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
```

## Authentication

Socket connections require authentication via JWT token or userId:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: userIdOrJWT
  }
});
```

## Event Handlers

### Chat Handler (`handlers/chat.handler.js`)
- `chat:create` - Create new chats
- `chat:update` - Update chat settings
- `chat:member:add` - Add members to group
- `chat:member:remove` - Remove members from group
- `admin:promote` - Promote user to admin
- `admin:demote` - Demote admin to member

### Friend Handler (`handlers/friend.handler.js`)
- `friend:request:create` - Send friend request
- `friend:request:action` - Accept/reject/cancel request
- `friend:remove` - Remove friend

### Message Handler (`handlers/message.handler.js`)
- `message:new` - Send new message
- `message:edit` - Edit message (15 min window)
- `message:delete` - Delete message (2 min for everyone)
- `message:read` - Mark message as read
- `reaction:add` - Add/update reaction

### Typing Handler (`handlers/typing.handler.js`)
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

### User Handler (`handlers/user.handler.js`)
- `profile:update` - Update user profile
- `user:block` - Block a user
- `user:unblock` - Unblock a user

### Call Handler (`handlers/call.handler.js`) - NEW
- `call:initiate` - Start a call with another user
- `call:accept` - Accept an incoming call
- `call:reject` - Reject an incoming call
- `call:end` - End an active call
- `call:ice-candidate` - Exchange ICE candidates
- `call:toggle-audio` - Mute/unmute audio
- `call:toggle-video` - Turn video on/off
- `call:screen-share` - Start/stop screen sharing

### Call Handler V2 (`handlers/call-v2.handler.js`) - ROOM-BASED (ACTIVE)
- `call:initiate` - Start a call (creates room & MongoDB record)
- `call:accept` - Accept and join call room
- `call:reject` - Reject incoming call
- `call:leave` - Leave/end call
- `call:cancel` - Cancel call before anyone joins
- `call:offer` - Send WebRTC offer
- `call:answer` - Send WebRTC answer
- `call:ice-candidate` - Exchange ICE candidates
- `call:toggle-audio` - Mute/unmute audio
- `call:toggle-video` - Turn video on/off
- `call:screen-share` - Start/stop screen sharing
- `call:add-participant` - Add user to ongoing call

## Utilities

### Authentication (`utils/auth.js`)
- `authenticateSocket()` - Verify JWT or userId
- `authMiddleware()` - Socket.IO middleware

### Presence (`utils/presence.js`)
- `updateUserPresence()` - Update online/offline status

### Rooms (`utils/rooms.js`)
- `joinUserToChats()` - Join user to all their chat rooms

### Typing (`utils/typing.js`)
- `addTypingUser()` - Track typing with auto-cleanup
- `removeTypingUser()` - Remove from typing list
- `cleanupUserTyping()` - Clean up on disconnect

## System Messages

Automatic system messages are created for:
- Member added to group
- Member removed from group
- Chat name changed
- Chat image changed
- Admin promoted
- Admin demoted

## Broadcasting

Events are broadcast to relevant users:
- Chat events → All chat participants
- Friend events → Both users involved
- Profile updates → All friends
- Presence updates → All connected users

## Error Handling

All events with acknowledgments return:
```javascript
{ success: true, ...data }
// or
{ success: false, error: "Error message" }
```

## Performance

- Connection pooling for MongoDB
- Efficient room-based broadcasting
- Auto-cleanup of typing indicators
- Optimized queries with proper indexes

## Monitoring

Server logs include:
- User connections/disconnections
- Room joins
- Event errors
- Authentication failures

## Testing

Test events in browser console:
```javascript
socket.emit('message:new', {
  chatId: 'xxx',
  text: 'Hello'
}, console.log);
```

## Documentation

- See `SOCKET_EVENTS.md` for complete event reference
- See `MIGRATION_GUIDE.md` for HTTP to Socket migration

## Next Steps

1. Update client code to use socket events
2. Remove redundant HTTP API routes
3. Test all real-time features
4. Monitor socket connections in production
