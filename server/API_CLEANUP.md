# API Cleanup Guide

This document lists HTTP API routes that can be removed or kept after socket migration.

## ✅ Can Be Removed (Now Handled by Sockets)

### Chat APIs
- ❌ `POST /api/chats` → Use `chat:create` socket event
- ❌ `PATCH /api/chats/[chatId]` → Use `chat:update` socket event
- ❌ `POST /api/chats/[chatId]/members` → Use `chat:member:add` socket event
- ❌ `DELETE /api/chats/[chatId]/members` → Use `chat:member:remove` socket event
- ❌ `POST /api/chats/[chatId]/admins` → Use `admin:promote` socket event
- ❌ `DELETE /api/chats/[chatId]/admins` → Use `admin:demote` socket event

### Message APIs
- ❌ `POST /api/messages` → Use `message:new` socket event
- ❌ `PATCH /api/messages/[messageId]` → Use `message:edit` socket event
- ❌ `DELETE /api/messages/[messageId]` → Use `message:delete` socket event
- ❌ `POST /api/messages/[messageId]/reactions` → Use `reaction:add` socket event
- ❌ `DELETE /api/messages/[messageId]/reactions` → Use `reaction:add` with empty emoji
- ❌ `POST /api/chats/[chatId]/read` → Use `message:read` socket event

### Friend APIs
- ❌ `POST /api/friends/requests` → Use `friend:request:create` socket event
- ❌ `PUT /api/friends/requests/[requestId]` → Use `friend:request:action` socket event
- ❌ `DELETE /api/friends/requests/[requestId]` → Use `friend:request:action` with "cancel"
- ❌ `DELETE /api/users/friends/[friendId]` → Use `friend:remove` socket event

### User APIs
- ❌ `PUT /api/users/profile` → Use `profile:update` socket event
- ❌ `POST /api/users/block` → Use `user:block` socket event
- ❌ `DELETE /api/users/block` → Use `user:unblock` socket event

## ✅ Keep (Still Needed for Initial Data Loading)

### Chat APIs
- ✅ `GET /api/chats` - Get all user's chats (initial load)
- ✅ `GET /api/chats/[chatId]` - Get chat details (initial load)
- ✅ `GET /api/chats/[chatId]/media` - Get media gallery (pagination)
- ✅ `GET /api/chats/[chatId]/links` - Get shared links (pagination)
- ✅ `DELETE /api/chats/[chatId]` - Delete chat (could migrate to socket if needed)

### Message APIs
- ✅ `GET /api/messages?chatId=...` - Get messages with pagination

### Friend APIs
- ✅ `GET /api/friends/requests` - Get all friend requests (initial load)
- ✅ `GET /api/friends/requests/count` - Get pending request count
- ✅ `GET /api/friends/search` - Search for users

### User APIs
- ✅ `GET /api/users` - Get all users (for search/add friends)
- ✅ `GET /api/users/[id]` - Get user profile by ID
- ✅ `GET /api/users/by-handle/[handle]` - Get user by handle
- ✅ `GET /api/users/profile` - Get current user profile
- ✅ `GET /api/users/friends` - Get friends list
- ✅ `GET /api/users/block` - Get blocked users list
- ✅ `PATCH /api/users/[id]` - Update user (admin only, if applicable)
- ✅ `POST /api/users` - Create/update user (for initial setup)

### Upload APIs
- ✅ `POST /api/upload` - Upload files to Cloudinary

## Migration Steps

### 1. Update Client Code
Replace HTTP API calls with socket events in your client code.

### 2. Test Socket Events
Ensure all socket events work correctly before removing APIs.

### 3. Remove API Routes
Delete the following files:

```bash
# Chat routes to remove
rm src/app/(protected)/api/chats/route.js  # Keep GET, remove POST
rm src/app/(protected)/api/chats/[chatId]/route.js  # Keep GET, remove PATCH
rm src/app/(protected)/api/chats/[chatId]/members/route.js
rm src/app/(protected)/api/chats/[chatId]/admins/route.js
rm src/app/(protected)/api/chats/[chatId]/read/route.js

# Message routes to remove
rm src/app/(protected)/api/messages/route.js  # Keep GET, remove POST
rm src/app/(protected)/api/messages/[messageId]/route.js
rm src/app/(protected)/api/messages/[messageId]/reactions/route.js

# Friend routes to remove
rm src/app/(protected)/api/friends/requests/route.js  # Keep GET, remove POST
rm src/app/(protected)/api/friends/requests/[requestId]/route.js
rm src/app/(protected)/api/users/friends/[friendId]/route.js

# User routes to remove
rm src/app/(protected)/api/users/profile/route.js  # Keep GET, remove PUT
rm src/app/(protected)/api/users/block/route.js  # Keep GET, remove POST/DELETE
```

### 4. Update Remaining Routes

For routes that need both GET and write operations, keep only GET:

**Example: `src/app/(protected)/api/chats/route.js`**
```javascript
// Keep only GET, remove POST
export async function GET(request) {
  // ... existing GET logic
}

// Remove POST - now handled by socket
```

**Example: `src/app/(protected)/api/messages/route.js`**
```javascript
// Keep only GET, remove POST
export async function GET(request) {
  // ... existing GET logic for pagination
}

// Remove POST - now handled by socket
```

## Benefits After Cleanup

1. **Reduced Code** - Less API routes to maintain
2. **Consistency** - All write operations via sockets
3. **Real-time** - Instant updates for all users
4. **Simpler Client** - Single socket connection instead of multiple HTTP calls
5. **Better UX** - No loading states for real-time operations

## Gradual Migration

You can migrate gradually:

1. **Phase 1**: Keep both HTTP and Socket working in parallel
2. **Phase 2**: Update client to use sockets, keep APIs as fallback
3. **Phase 3**: Remove HTTP APIs once socket events are stable

## Testing Checklist

Before removing APIs, test:

- [ ] Chat creation (direct and group)
- [ ] Chat updates (name, image, description)
- [ ] Adding/removing members
- [ ] Promoting/demoting admins
- [ ] Sending messages
- [ ] Editing messages
- [ ] Deleting messages
- [ ] Reactions
- [ ] Read receipts
- [ ] Friend requests (send, accept, reject, cancel)
- [ ] Removing friends
- [ ] Profile updates
- [ ] Blocking/unblocking users
- [ ] Typing indicators
- [ ] Presence updates

## Rollback Plan

If issues arise:

1. Keep old API routes in a backup branch
2. Monitor socket connection stability
3. Have HTTP fallback ready if needed
4. Test thoroughly in staging before production

## Performance Monitoring

After migration, monitor:

- Socket connection count
- Event latency
- Message delivery rate
- Reconnection frequency
- Error rates

## Questions?

Refer to:
- `SOCKET_EVENTS.md` - Complete event documentation
- `MIGRATION_GUIDE.md` - Migration examples
- `README.md` - Server overview
