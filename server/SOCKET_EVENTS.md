# Socket Events Documentation

This document lists all available socket events in the chat application.

## Authentication

All socket connections require authentication via JWT token or userId in `socket.handshake.auth.token`.

## Message Events

### `message:new`
Send a new message to a chat.

**Emit:**
```javascript
socket.emit("message:new", {
  chatId: "chat_id",
  text: "message text",
  media: [{ url, publicId, width, height, mime, size, filename }],
  replyTo: "message_id" // optional
}, (response) => {
  // response: { success: true, message: {...} }
});
```

**Listen:**
```javascript
socket.on("message:new", ({ message, chatId }) => {
  // New message received
});
```

### `message:edit`
Edit your own message (within 15 minutes).

**Emit:**
```javascript
socket.emit("message:edit", {
  messageId: "message_id",
  text: "updated text",
  media: []
}, (response) => {
  // response: { success: true, message: {...} }
});
```

**Listen:**
```javascript
socket.on("message:edit", ({ message, chatId }) => {
  // Message was edited
});
```

### `message:delete`
Delete a message for yourself or everyone (within 2 minutes for everyone).

**Emit:**
```javascript
socket.emit("message:delete", {
  messageId: "message_id",
  deleteForEveryone: true // or false
}, (response) => {
  // response: { success: true }
});
```

**Listen:**
```javascript
socket.on("message:delete", ({ messageId, chatId, deleteForEveryone }) => {
  // Message was deleted
});
```

### `message:read`
Mark a message as read.

**Emit:**
```javascript
socket.emit("message:read", {
  messageId: "message_id",
  chatId: "chat_id"
}, (response) => {
  // response: { success: true }
});
```

**Listen:**
```javascript
socket.on("message:read", ({ messageId, userId, chatId }) => {
  // Message was read by userId
});
```

### `reaction:add`
Add or update your reaction to a message.

**Emit:**
```javascript
socket.emit("reaction:add", {
  messageId: "message_id",
  emoji: "👍"
}, (response) => {
  // response: { success: true, reactions: [...] }
});
```

**Listen:**
```javascript
socket.on("reaction:update", ({ messageId, reactions, chatId }) => {
  // Reactions updated
});
```

## Chat Events

### `chat:create`
Create a new direct or group chat.

**Emit:**
```javascript
socket.emit("chat:create", {
  participants: ["user_id1", "user_id2"],
  isGroup: true, // optional, default false
  name: "Group Name", // required for groups
  image: "/path/to/image.jpg", // optional
  description: "Group description" // optional
}, (response) => {
  // response: { success: true, chat: {...}, existing: false }
});
```

**Listen:**
```javascript
socket.on("chat:created", ({ chat }) => {
  // New chat created
});
```

### `chat:update`
Update chat settings (admin only).

**Emit:**
```javascript
socket.emit("chat:update", {
  chatId: "chat_id",
  name: "New Name",
  image: "/new/image.jpg",
  description: "New description",
  privacy: "admin_only" // or "member_invite"
}, (response) => {
  // response: { success: true, chat: {...} }
});
```

**Listen:**
```javascript
socket.on("chat:updated", ({ chat }) => {
  // Chat was updated
});
```

### `chat:member:add`
Add members to a group chat (admin only).

**Emit:**
```javascript
socket.emit("chat:member:add", {
  chatId: "chat_id",
  userIds: ["user_id1", "user_id2"]
}, (response) => {
  // response: { success: true, chat: {...} }
});
```

### `chat:member:remove`
Remove a member from group chat (admin or self).

**Emit:**
```javascript
socket.emit("chat:member:remove", {
  chatId: "chat_id",
  userId: "user_id"
}, (response) => {
  // response: { success: true, chat: {...} }
});
```

**Listen:**
```javascript
socket.on("chat:left", ({ chatId }) => {
  // You were removed from chat
});
```

### `admin:promote`
Promote a user to admin (creator only).

**Emit:**
```javascript
socket.emit("admin:promote", {
  chatId: "chat_id",
  userId: "user_id"
}, (response) => {
  // response: { success: true, chat: {...} }
});
```

### `admin:demote`
Demote an admin to regular member (creator only).

**Emit:**
```javascript
socket.emit("admin:demote", {
  chatId: "chat_id",
  userId: "user_id"
}, (response) => {
  // response: { success: true, chat: {...} }
});
```

## Friend Events

### `friend:request:create`
Send a friend request.

**Emit:**
```javascript
socket.emit("friend:request:create", {
  handle: "@username",
  message: "Optional message"
}, (response) => {
  // response: { success: true, request: {...} }
});
```

**Listen:**
```javascript
socket.on("friend:request:new", ({ request }) => {
  // New friend request received
});
```

### `friend:request:action`
Accept, reject, or cancel a friend request.

**Emit:**
```javascript
socket.emit("friend:request:action", {
  requestId: "request_id",
  action: "accept" // or "reject", "cancel"
}, (response) => {
  // response: { success: true, message: "accepted" }
});
```

**Listen:**
```javascript
socket.on("friend:request:accepted", ({ requestId, from, to }) => {
  // Friend request accepted
});

socket.on("friend:request:rejected", ({ request }) => {
  // Friend request rejected
});

socket.on("friend:request:cancelled", ({ requestId, from, to }) => {
  // Friend request cancelled
});
```

### `friend:remove`
Remove a friend.

**Emit:**
```javascript
socket.emit("friend:remove", {
  friendId: "user_id"
}, (response) => {
  // response: { success: true }
});
```

**Listen:**
```javascript
socket.on("friend:removed", ({ userId }) => {
  // Friend removed you
});
```

## User Events

### `profile:update`
Update your profile.

**Emit:**
```javascript
socket.emit("profile:update", {
  name: "New Name",
  bio: "New bio",
  image: "/new/image.jpg",
  handle: "newhandle"
}, (response) => {
  // response: { success: true, user: {...} }
});
```

**Listen:**
```javascript
socket.on("profile:updated", ({ userId, name, bio, image, handle }) => {
  // Friend's profile updated
});
```

### `user:block`
Block a user.

**Emit:**
```javascript
socket.emit("user:block", {
  userId: "user_id"
}, (response) => {
  // response: { success: true, blockedUserId: "..." }
});
```

**Listen:**
```javascript
socket.on("user:blocked", ({ userId }) => {
  // You were blocked by userId
});

socket.on("chat:removed", ({ chatId }) => {
  // Chat removed due to blocking
});
```

### `user:unblock`
Unblock a user.

**Emit:**
```javascript
socket.emit("user:unblock", {
  userId: "user_id"
}, (response) => {
  // response: { success: true, unblockedUserId: "..." }
});
```

**Listen:**
```javascript
socket.on("user:unblocked", ({ userId }) => {
  // You were unblocked by userId
});
```

## Typing Events

### `typing:start`
Indicate you're typing in a chat.

**Emit:**
```javascript
socket.emit("typing:start", {
  chatId: "chat_id"
});
```

**Listen:**
```javascript
socket.on("typing:start", ({ chatId, user }) => {
  // User started typing
});
```

### `typing:stop`
Indicate you stopped typing.

**Emit:**
```javascript
socket.emit("typing:stop", {
  chatId: "chat_id"
});
```

**Listen:**
```javascript
socket.on("typing:stop", ({ chatId, user }) => {
  // User stopped typing
});
```

## Presence Events

**Listen:**
```javascript
socket.on("presence:update", ({ userId, status, lastSeen }) => {
  // User went online/offline
  // status: "online" | "offline"
});
```

## Error Handling

All events with acknowledgment callbacks return:
```javascript
{
  success: true,
  // ... additional data
}
// or
{
  success: false,
  error: "Error message"
}
```

## Notes

- All events are real-time and broadcast to relevant users
- System messages are automatically created for group events
- Typing indicators auto-cleanup after 5 seconds
- Message edits allowed within 15 minutes
- Message deletion for everyone allowed within 2 minutes
- All operations include proper permission checks
