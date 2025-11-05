# Socket Server Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (React/Next.js with Socket.IO Client)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ WebSocket Connection
                         │ (Persistent, Bidirectional)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   Socket.IO Server                           │
│                  (server/socket-server.js)                   │
├─────────────────────────────────────────────────────────────┤
│  • Connection Management                                     │
│  • Authentication Middleware                                 │
│  • Room Management                                           │
│  • Event Broadcasting                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Event Handlers                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Chat       │  │   Message    │  │   Friend     │     │
│  │   Handler    │  │   Handler    │  │   Handler    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   User       │  │   Typing     │                        │
│  │   Handler    │  │   Handler    │                        │
│  └──────────────┘  └──────────────┘                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      Utilities                               │
├─────────────────────────────────────────────────────────────┤
│  • Authentication (JWT/Token)                                │
│  • Presence Management (Online/Offline)                      │
│  • Room Management (Join/Leave)                              │
│  • Typing Tracking (Auto-cleanup)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
├─────────────────────────────────────────────────────────────┤
│  • Users Collection                                          │
│  • Chats Collection                                          │
│  • Messages Collection                                       │
│  • FriendRequests Collection                                 │
│  • Notifications Collection                                  │
└─────────────────────────────────────────────────────────────┘
```

## Event Flow

### Example: User Sends a Message

```
┌──────────┐                                              ┌──────────┐
│  User A  │                                              │  User B  │
│ (Client) │                                              │ (Client) │
└────┬─────┘                                              └────┬─────┘
     │                                                          │
     │ 1. Emit: message:new                                    │
     │    { chatId, text }                                     │
     ├──────────────────────────────────┐                     │
     │                                   ↓                     │
     │                          ┌─────────────────┐            │
     │                          │  Socket Server  │            │
     │                          └────────┬────────┘            │
     │                                   │                     │
     │                          2. Authenticate                │
     │                             Validate                    │
     │                                   │                     │
     │                                   ↓                     │
     │                          ┌─────────────────┐            │
     │                          │ Message Handler │            │
     │                          └────────┬────────┘            │
     │                                   │                     │
     │                          3. Create in DB                │
     │                                   │                     │
     │                                   ↓                     │
     │                          ┌─────────────────┐            │
     │                          │    MongoDB      │            │
     │                          └────────┬────────┘            │
     │                                   │                     │
     │                          4. Broadcast to                │
     │                             chat room                   │
     │                                   │                     │
     │ 5. Acknowledgment        ┌────────┴────────┐            │
     │    { success, message }  │                 │            │
     │◄─────────────────────────┤                 ├───────────►│
     │                          │                 │  6. Receive │
     │                          └─────────────────┘     message │
     │                                                          │
```

## Handler Architecture

### Chat Handler Flow

```
chat:create event
    ↓
Validate input
    ↓
Check permissions
    ↓
Check for existing chat (if direct)
    ↓
Create chat in DB
    ↓
Populate chat data
    ↓
Notify all participants
    ↓
Send acknowledgment
```

### Message Handler Flow

```
message:new event
    ↓
Validate chatId & text
    ↓
Verify user is participant
    ↓
Create message in DB
    ↓
Populate sender & reply info
    ↓
Update chat lastActivity
    ↓
Broadcast to chat room
    ↓
Create notifications for offline users
    ↓
Send acknowledgment
```

## Room Management

```
User Connects
    ↓
Authenticate
    ↓
Find all user's chats
    ↓
Join rooms: chat:${chatId}
    ↓
Store in userRooms Map
    ↓
Update presence to online
```

### Room Structure

```
Socket Rooms:
├── chat:507f1f77bcf86cd799439011  (Chat 1)
│   ├── User A (socket-id-1)
│   ├── User B (socket-id-2)
│   └── User C (socket-id-3)
│
├── chat:507f1f77bcf86cd799439012  (Chat 2)
│   ├── User A (socket-id-1)
│   └── User D (socket-id-4)
│
└── Global Room (all connected users)
    ├── User A (socket-id-1)
    ├── User B (socket-id-2)
    ├── User C (socket-id-3)
    └── User D (socket-id-4)
```

## Data Flow Patterns

### 1. Broadcast to Room

```javascript
// Emit to all users in a chat
io.to(`chat:${chatId}`).emit('message:new', data);
```

### 2. Emit to Specific User

```javascript
// Emit to one user by socket ID
const socketId = userSockets.get(userId);
io.to(socketId).emit('friend:request:new', data);
```

### 3. Emit to All Except Sender

```javascript
// Broadcast to others in room
socket.to(`chat:${chatId}`).emit('typing:start', data);
```

### 4. Emit to Everyone

```javascript
// Broadcast to all connected users
io.emit('presence:update', data);
```

## State Management

### Server-Side State

```javascript
// User socket mappings
userSockets: Map<userId, socketId>
  "user123" → "socket-abc"
  "user456" → "socket-def"

// User room memberships
userRooms: Map<userId, roomIds[]>
  "user123" → ["chat:xxx", "chat:yyy"]
  "user456" → ["chat:xxx", "chat:zzz"]

// Typing indicators
typingUsers: Map<chatId, Map<userId, {user, timeout}>>
  "chat:xxx" → {
    "user123" → { user: {...}, timeout: 12345 }
  }
```

## Authentication Flow

```
Client connects
    ↓
Send auth token in handshake
    ↓
Server: authMiddleware
    ↓
Verify JWT or userId
    ↓
Query User from DB
    ↓
Attach user to socket
    ↓
socket.userId = user._id
socket.user = user
    ↓
Allow connection
```

## Error Handling

```
Event received
    ↓
Try {
    Validate input
    Check permissions
    Execute operation
    Send success response
}
    ↓
Catch (error) {
    Log error
    Send error response
    { success: false, error: "..." }
}
```

## Scalability Architecture

### Single Server (Current)

```
┌─────────────┐
│   Client 1  │──┐
└─────────────┘  │
                 │    ┌──────────────┐      ┌──────────┐
┌─────────────┐  ├───►│ Socket.IO    │─────►│ MongoDB  │
│   Client 2  │──┤    │   Server     │      └──────────┘
└─────────────┘  │    └──────────────┘
                 │
┌─────────────┐  │
│   Client 3  │──┘
└─────────────┘
```

### Multi-Server (Future with Redis)

```
┌─────────────┐
│   Client 1  │──┐
└─────────────┘  │    ┌──────────────┐
                 ├───►│  Server 1    │──┐
┌─────────────┐  │    └──────────────┘  │
│   Client 2  │──┘                       │
└─────────────┘                          │    ┌──────────┐
                                         ├───►│  Redis   │
┌─────────────┐                          │    │ Adapter  │
│   Client 3  │──┐    ┌──────────────┐  │    └────┬─────┘
└─────────────┘  ├───►│  Server 2    │──┘         │
                 │    └──────────────┘            │
┌─────────────┐  │                                │
│   Client 4  │──┘                                ↓
└─────────────┘                            ┌──────────┐
                                           │ MongoDB  │
                                           └──────────┘
```

## Performance Optimizations

### 1. Connection Pooling
```javascript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,  // Reuse connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});
```

### 2. Room-Based Broadcasting
```javascript
// Only emit to relevant users
io.to(`chat:${chatId}`).emit('message:new', data);
// Instead of: io.emit() to everyone
```

### 3. Efficient Queries
```javascript
// Use indexes
ChatSchema.index({ participants: 1 });
MessageSchema.index({ chatId: 1, createdAt: -1 });

// Populate only needed fields
.populate('sender', 'name image handle')
```

### 4. Auto-Cleanup
```javascript
// Typing indicators auto-remove after 5s
setTimeout(() => removeTypingUser(chatId, userId), 5000);

// Notifications auto-delete after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
```

## Security Layers

```
1. Connection Level
   └─ JWT/Token authentication

2. Event Level
   └─ Permission checks per event

3. Data Level
   └─ Validate user is participant/admin

4. Database Level
   └─ Schema validation & constraints
```

## Monitoring Points

```
┌─────────────────────────────────────┐
│         Metrics to Monitor          │
├─────────────────────────────────────┤
│ • Active connections count          │
│ • Events per second                 │
│ • Average event latency             │
│ • Error rate                        │
│ • Reconnection frequency            │
│ • Database query time               │
│ • Memory usage                      │
│ • CPU usage                         │
└─────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────┐
│              Load Balancer                    │
│         (Sticky Sessions Enabled)             │
└────────────────┬─────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌───────▼──────┐
│  Server 1    │  │  Server 2    │
│  (Node.js)   │  │  (Node.js)   │
└───────┬──────┘  └───────┬──────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  MongoDB Atlas  │
        │   (Replica Set) │
        └─────────────────┘
```

## Summary

This architecture provides:
- ✅ Real-time bidirectional communication
- ✅ Scalable room-based broadcasting
- ✅ Modular, maintainable code
- ✅ Efficient database operations
- ✅ Comprehensive error handling
- ✅ Security at multiple layers
- ✅ Ready for horizontal scaling
