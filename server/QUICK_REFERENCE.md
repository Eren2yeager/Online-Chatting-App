# Quick Reference Card

## 🚀 Quick Start

```bash
# Start server
npm run dev

# Test in browser console
socket.emit('message:new', { chatId: 'xxx', text: 'Hello' }, console.log);
```

## 📁 File Structure

```
server/
├── handlers/          # Event handlers
├── utils/            # Utilities
├── socket-server.js  # Main server
└── *.md             # Documentation
```

## 🎯 Most Used Events

### Send Message
```javascript
socket.emit('message:new', {
  chatId: 'chat-id',
  text: 'Hello!'
}, (response) => {
  if (response.success) console.log('Sent!');
});
```

### Create Chat
```javascript
socket.emit('chat:create', {
  participants: ['user-id'],
  isGroup: false
}, console.log);
```

### Send Friend Request
```javascript
socket.emit('friend:request:create', {
  handle: '@username',
  message: 'Hi!'
}, console.log);
```

### Update Profile
```javascript
socket.emit('profile:update', {
  name: 'New Name',
  bio: 'New bio'
}, console.log);
```

## 👂 Listen to Events

```javascript
// Messages
socket.on('message:new', ({ message, chatId }) => {
  // Handle new message
});

// Chats
socket.on('chat:created', ({ chat }) => {
  // Handle new chat
});

// Friends
socket.on('friend:request:new', ({ request }) => {
  // Handle friend request
});

// Typing
socket.on('typing:start', ({ chatId, user }) => {
  // Show typing indicator
});
```

## 🔐 Authentication

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-or-userid'
  }
});
```

## ⚡ Event Categories

| Category | Events |
|----------|--------|
| **Messages** | new, edit, delete, read |
| **Reactions** | add, update |
| **Chats** | create, update, member:add, member:remove |
| **Admins** | promote, demote |
| **Friends** | request:create, request:action, remove |
| **Users** | profile:update, block, unblock |
| **Typing** | start, stop |
| **Presence** | update |

## 📊 Response Format

```javascript
// Success
{
  success: true,
  message: {...},  // or chat, user, etc.
}

// Error
{
  success: false,
  error: "Error message"
}
```

## 🛠️ Common Patterns

### Emit with Acknowledgment
```javascript
socket.emit('event:name', data, (response) => {
  if (response.success) {
    // Success
  } else {
    // Error: response.error
  }
});
```

### Listen and Update State
```javascript
socket.on('event:name', (data) => {
  // Update your state/UI
  setState(prevState => [...prevState, data]);
});
```

### Typing Indicator
```javascript
// Start typing
onInputChange = () => {
  socket.emit('typing:start', { chatId });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing:stop', { chatId });
  }, 3000);
};
```

## 🔍 Debugging

```javascript
// Enable debug logs
localStorage.debug = 'socket.io-client:socket';

// Check connection
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));

// Log all events
socket.onAny((event, ...args) => {
  console.log(event, args);
});
```

## ⚠️ Common Issues

### Not Receiving Events
- ✅ Check if you're listening before emitting
- ✅ Verify you're in the correct chat room
- ✅ Check user permissions

### Connection Failed
- ✅ Verify server is running
- ✅ Check auth token is valid
- ✅ Check CORS settings

### Event Not Working
- ✅ Check required fields are provided
- ✅ Verify data format is correct
- ✅ Check server logs for errors

## 📚 Documentation

| Guide | Purpose |
|-------|---------|
| **README.md** | Server overview |
| **SOCKET_EVENTS.md** | Complete event reference |
| **MIGRATION_GUIDE.md** | HTTP to Socket migration |
| **TESTING.md** | Testing guide |
| **ARCHITECTURE.md** | System architecture |
| **API_CLEANUP.md** | API removal guide |
| **CHECKLIST.md** | Migration checklist |

## 🎯 Quick Commands

```bash
# Start server
npm run dev

# Start with custom port
node server/socket-server.js -p 3001

# Enable debug mode
DEBUG=socket.io* npm run dev

# Run tests (if you create them)
npm test
```

## 💡 Pro Tips

1. **Always use acknowledgments** for write operations
2. **Listen before emitting** to catch responses
3. **Handle reconnection** gracefully in your UI
4. **Use typing indicators** for better UX
5. **Show connection status** to users
6. **Implement optimistic updates** for instant feedback
7. **Cache data locally** to reduce server calls
8. **Use rooms efficiently** for targeted broadcasts

## 🔗 Useful Links

- Socket.IO Docs: https://socket.io/docs/v4/
- Socket.IO Client API: https://socket.io/docs/v4/client-api/
- Mongoose Docs: https://mongoosejs.com/docs/

## 📞 Event Cheat Sheet

```javascript
// MESSAGES
socket.emit('message:new', { chatId, text, media, replyTo })
socket.emit('message:edit', { messageId, text, media })
socket.emit('message:delete', { messageId, deleteForEveryone })
socket.emit('message:read', { messageId, chatId })
socket.emit('reaction:add', { messageId, emoji })

// CHATS
socket.emit('chat:create', { participants, isGroup, name, image })
socket.emit('chat:update', { chatId, name, image, description })
socket.emit('chat:member:add', { chatId, userIds })
socket.emit('chat:member:remove', { chatId, userId })
socket.emit('admin:promote', { chatId, userId })
socket.emit('admin:demote', { chatId, userId })

// FRIENDS
socket.emit('friend:request:create', { handle, message })
socket.emit('friend:request:action', { requestId, action })
socket.emit('friend:remove', { friendId })

// USERS
socket.emit('profile:update', { name, bio, image, handle })
socket.emit('user:block', { userId })
socket.emit('user:unblock', { userId })

// TYPING
socket.emit('typing:start', { chatId })
socket.emit('typing:stop', { chatId })
```

## 🎨 UI Integration Example

```javascript
// React Hook Example
function useSocket() {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: { token: getUserToken() }
    });
    
    newSocket.on('connect', () => {
      console.log('Connected');
    });
    
    newSocket.on('message:new', (data) => {
      // Update messages state
    });
    
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, []);
  
  return socket;
}
```

## ✅ Testing Checklist

- [ ] Connection works
- [ ] Authentication works
- [ ] Can send messages
- [ ] Can create chats
- [ ] Can send friend requests
- [ ] Real-time updates work
- [ ] Typing indicators work
- [ ] Presence updates work
- [ ] Error handling works
- [ ] Reconnection works

---

**Keep this card handy for quick reference!**
