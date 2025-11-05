# Notification System - Comprehensive Task List

## Overview
Build a complete, secure, and beautiful notification system for both online and offline users with unread message counts, real-time updates, and browser notifications.

---

## Phase 1: Backend Infrastructure ✅ (Already Exists)

### 1.1 Database Schema ✅
- [x] Notification model exists with proper fields
- [x] Chat model has unreadCounts array
- [x] Message model has readBy and deliveredTo arrays
- [x] Proper indexes for performance

### 1.2 What We Need to Add

#### Task 1.2.1: Create Notification Handler
**File:** `server/handlers/notification.handler.js`
- [ ] Create notification handler with socket events
- [ ] Implement `notification:fetch` - Get all notifications
- [ ] Implement `notification:mark-read` - Mark single notification as read
- [ ] Implement `notification:mark-all-read` - Mark all as read
- [ ] Implement `notification:delete` - Delete notification
- [ ] Implement `notification:get-unread-count` - Get unread count
- [ ] Add proper error handling and validation
- [ ] Add rate limiting

#### Task 1.2.2: Update Message Handler
**File:** `server/handlers/message.handler.js`
- [ ] On new message: Create notification for offline users
- [ ] On new message: Update unreadCounts in Chat model
- [ ] On message read: Update readBy array
- [ ] On message read: Decrement unreadCounts
- [ ] Emit `notification:new` event to offline users
- [ ] Emit `unread:update` event to all participants

#### Task 1.2.3: Update Chat Handler
**File:** `server/handlers/chat.handler.js`
- [ ] On chat open: Mark all messages as read
- [ ] On chat open: Reset unreadCounts for user
- [ ] Emit `unread:update` event

#### Task 1.2.4: Create Notification API Routes
**Files:** 
- `src/app/(protected)/api/notifications/route.js`
- `src/app/(protected)/api/notifications/[id]/route.js`
- `src/app/(protected)/api/notifications/unread-count/route.js`

- [ ] GET /api/notifications - Fetch all notifications (paginated)
- [ ] PATCH /api/notifications/[id] - Mark as read
- [ ] DELETE /api/notifications/[id] - Delete notification
- [ ] POST /api/notifications/mark-all-read - Mark all as read
- [ ] GET /api/notifications/unread-count - Get unread count
- [ ] Add authentication middleware
- [ ] Add rate limiting
- [ ] Add proper error responses

---

## Phase 2: Frontend Infrastructure

### 2.1 Context & State Management

#### Task 2.1.1: Create Notification Context
**File:** `src/components/layout/NotificationContext.jsx`
- [ ] Create NotificationContext with Provider
- [ ] State: notifications array
- [ ] State: unreadCount number
- [ ] State: loading boolean
- [ ] Function: fetchNotifications()
- [ ] Function: markAsRead(id)
- [ ] Function: markAllAsRead()
- [ ] Function: deleteNotification(id)
- [ ] Socket listener: notification:new
- [ ] Socket listener: notification:read
- [ ] Socket listener: notification:deleted
- [ ] Auto-fetch on mount
- [ ] Export useNotifications hook

#### Task 2.1.2: Create Unread Count Context
**File:** `src/components/layout/UnreadCountContext.jsx`
- [ ] Create UnreadCountContext with Provider
- [ ] State: chatUnreadCounts (Map of chatId -> count)
- [ ] State: totalUnreadCount number
- [ ] Function: updateChatUnread(chatId, count)
- [ ] Function: resetChatUnread(chatId)
- [ ] Socket listener: unread:update
- [ ] Auto-fetch on mount
- [ ] Export useUnreadCount hook

#### Task 2.1.3: Update Socket Context
**File:** `src/lib/socket.js`
- [ ] Add notification event listeners
- [ ] Add unread count event listeners
- [ ] Export useNotificationListener hook
- [ ] Export useUnreadListener hook

### 2.2 API Client Functions

#### Task 2.2.1: Create Notification API Client
**File:** `src/lib/client/notifications.js`
- [ ] fetchNotifications(page, limit)
- [ ] markNotificationAsRead(id)
- [ ] markAllNotificationsAsRead()
- [ ] deleteNotification(id)
- [ ] getUnreadCount()
- [ ] Add error handling
- [ ] Add TypeScript types (optional)

#### Task 2.2.2: Create Unread Count API Client
**File:** `src/lib/client/unreadCounts.js`
- [ ] fetchChatUnreadCounts()
- [ ] markChatAsRead(chatId)
- [ ] Add error handling

---

## Phase 3: UI Components

### 3.1 Notification Components

#### Task 3.1.1: Create Notification Bell Icon
**File:** `src/components/layout/NotificationBell.jsx`
- [ ] Bell icon with badge showing unread count
- [ ] Animated badge (pulse when new notification)
- [ ] Click to open notification dropdown
- [ ] Responsive design (mobile & desktop)
- [ ] Beautiful gradient badge
- [ ] Smooth animations
- [ ] Accessibility (ARIA labels)

#### Task 3.1.2: Create Notification Dropdown
**File:** `src/components/layout/NotificationDropdown.jsx`
- [ ] Dropdown panel with notifications list
- [ ] Empty state (no notifications)
- [ ] Loading state (skeleton)
- [ ] Notification items with:
  - [ ] Icon based on type
  - [ ] Title and body
  - [ ] Time ago
  - [ ] Read/unread indicator
  - [ ] Click to navigate
  - [ ] Swipe to delete (mobile)
  - [ ] Mark as read on click
- [ ] "Mark all as read" button
- [ ] "View all" link
- [ ] Infinite scroll / pagination
- [ ] Beautiful gradients and shadows
- [ ] Smooth animations
- [ ] Responsive (mobile drawer, desktop dropdown)

#### Task 3.1.3: Create Notification Page
**File:** `src/app/(protected)/notifications/page.js`
- [ ] Full page notification list
- [ ] Filter by type (all, messages, friend requests, etc.)
- [ ] Search notifications
- [ ] Bulk actions (select multiple, delete, mark read)
- [ ] Pagination
- [ ] Beautiful UI with gradients
- [ ] Responsive design
- [ ] Empty state
- [ ] Loading state

#### Task 3.1.4: Create Notification Item Component
**File:** `src/components/layout/NotificationItem.jsx`
- [ ] Reusable notification item
- [ ] Different layouts for different types
- [ ] Avatar/icon
- [ ] Title and body
- [ ] Time ago
- [ ] Action buttons (mark read, delete)
- [ ] Click handler
- [ ] Unread indicator (dot or background)
- [ ] Beautiful hover effects
- [ ] Smooth animations

### 3.2 Unread Count Badges

#### Task 3.2.1: Update ChatSidebar
**File:** `src/components/chat/ChatSidebar.js`
- [ ] Add unread count badge to each chat item
- [ ] Badge position: top-right of avatar or right side
- [ ] Badge color: gradient (blue to purple)
- [ ] Badge animation: pulse on new message
- [ ] Hide badge when count is 0
- [ ] Show "99+" for counts > 99
- [ ] Responsive sizing
- [ ] Beautiful design

#### Task 3.2.2: Update Chat List Item
**File:** `src/components/chat/ChatListItem.jsx` (if separate)
- [ ] Add unread badge
- [ ] Bold text for unread chats
- [ ] Different background for unread
- [ ] Smooth transitions

#### Task 3.2.3: Update Browser Tab Title
**File:** `src/app/layout.js` or custom hook
- [ ] Show unread count in tab title
- [ ] Format: "(3) ChatApp" or "ChatApp (3 unread)"
- [ ] Update on count change
- [ ] Reset when tab is focused

### 3.3 Browser Notifications

#### Task 3.3.1: Create Browser Notification Service
**File:** `src/lib/browserNotifications.js`
- [ ] Request notification permission
- [ ] Show notification with title, body, icon
- [ ] Handle notification click (focus tab, navigate)
- [ ] Handle notification close
- [ ] Check if notifications are supported
- [ ] Check if permission is granted
- [ ] Store permission in localStorage

#### Task 3.3.2: Create Notification Permission Component
**File:** `src/components/layout/NotificationPermission.jsx`
- [ ] Banner/modal to request permission
- [ ] Show only if not granted and not denied
- [ ] "Enable Notifications" button
- [ ] "Maybe Later" button
- [ ] Beautiful design
- [ ] Dismissible
- [ ] Remember user choice

#### Task 3.3.3: Integrate Browser Notifications
**File:** `src/components/layout/NotificationContext.jsx`
- [ ] On new notification: Show browser notification if:
  - [ ] User is offline OR
  - [ ] User is on different tab/window
  - [ ] Permission is granted
- [ ] On notification click: Focus window and navigate
- [ ] Don't show if user is actively viewing the chat

---

## Phase 4: Integration & Features

### 4.1 Chat Integration

#### Task 4.1.1: Update ChatWindow
**File:** `src/components/chat/ChatWindow.js`
- [ ] On mount: Mark chat as read
- [ ] On new message received: Mark as read if window is focused
- [ ] On window focus: Mark as read
- [ ] Reset unread count for this chat

#### Task 4.1.2: Update ChatSidebar
**File:** `src/components/chat/ChatSidebar.js`
- [ ] Display unread counts from context
- [ ] Sort chats by unread (unread first) or by lastActivity
- [ ] Update in real-time

#### Task 4.1.3: Update Message Sending
**File:** `src/components/chat/ChatInput.jsx`
- [ ] On send: Server creates notifications for offline users
- [ ] On send: Server updates unreadCounts

### 4.2 Friend Request Integration

#### Task 4.2.1: Update Friend Request Handler
**File:** `server/handlers/friend.handler.js`
- [ ] On friend request sent: Create notification
- [ ] On friend request accepted: Create notification
- [ ] On friend request rejected: Delete notification

#### Task 4.2.2: Update Friend Request Components
**Files:** `src/components/chat/FriendRequestsModal.jsx`
- [ ] Show notification badge on friend requests button
- [ ] Mark notification as read when modal opens
- [ ] Update count in real-time

### 4.3 Group Chat Integration

#### Task 4.3.1: Group Invite Notifications
**File:** `server/handlers/chat.handler.js`
- [ ] On member added: Create notification for added user
- [ ] On group update: Create notification for all members
- [ ] On admin promoted: Create notification for promoted user

---

## Phase 5: Advanced Features

### 5.1 Notification Preferences

#### Task 5.1.1: Create Preferences Model
**File:** `src/models/NotificationPreferences.js`
- [ ] User preferences for notifications
- [ ] Enable/disable by type
- [ ] Enable/disable browser notifications
- [ ] Enable/disable sound
- [ ] Quiet hours

#### Task 5.1.2: Create Preferences UI
**File:** `src/app/(protected)/settings/notifications/page.js`
- [ ] Toggle for each notification type
- [ ] Toggle for browser notifications
- [ ] Toggle for sound
- [ ] Quiet hours picker
- [ ] Save preferences
- [ ] Beautiful UI

### 5.2 Notification Sounds

#### Task 5.2.1: Add Sound Files
**Folder:** `public/sounds/`
- [ ] Add notification.mp3
- [ ] Add message.mp3
- [ ] Add mention.mp3

#### Task 5.2.2: Create Sound Service
**File:** `src/lib/sounds.js`
- [ ] Play notification sound
- [ ] Check user preferences
- [ ] Check quiet hours
- [ ] Volume control

### 5.3 Smart Notifications

#### Task 5.3.1: Notification Grouping
- [ ] Group multiple messages from same chat
- [ ] "3 new messages from John"
- [ ] Collapse old notifications

#### Task 5.3.2: Priority Notifications
- [ ] Mark urgent notifications (mentions, DMs)
- [ ] Different badge color for urgent
- [ ] Different sound for urgent

### 5.4 Notification Actions

#### Task 5.4.1: Quick Actions
- [ ] Reply directly from notification
- [ ] Mark as read without opening
- [ ] Snooze notification

---

## Phase 6: Performance & Optimization

### 6.1 Performance

#### Task 6.1.1: Optimize Queries
- [ ] Add database indexes
- [ ] Paginate notifications
- [ ] Cache unread counts
- [ ] Use Redis for real-time counts (optional)

#### Task 6.1.2: Optimize Frontend
- [ ] Lazy load notification dropdown
- [ ] Virtual scrolling for long lists
- [ ] Debounce mark as read
- [ ] Batch API calls

### 6.2 Caching

#### Task 6.2.1: Implement Caching
- [ ] Cache notifications in context
- [ ] Cache unread counts
- [ ] Invalidate on updates
- [ ] Use SWR or React Query (optional)

---

## Phase 7: Testing & Security

### 7.1 Security

#### Task 7.1.1: Backend Security
- [ ] Validate all inputs
- [ ] Check user permissions
- [ ] Rate limit notification creation
- [ ] Prevent notification spam
- [ ] Sanitize notification content

#### Task 7.1.2: Frontend Security
- [ ] Sanitize notification HTML
- [ ] Validate notification data
- [ ] Prevent XSS in notifications

### 7.2 Testing

#### Task 7.2.1: Test Scenarios
- [ ] Test with multiple users
- [ ] Test offline notifications
- [ ] Test real-time updates
- [ ] Test browser notifications
- [ ] Test on mobile devices
- [ ] Test with slow network
- [ ] Test with many notifications
- [ ] Test notification deletion
- [ ] Test mark as read

---

## Phase 8: Polish & UX

### 8.1 Animations

#### Task 8.1.1: Add Animations
- [ ] Badge pulse on new notification
- [ ] Dropdown slide in/out
- [ ] Notification item fade in
- [ ] Smooth transitions
- [ ] Loading skeletons

### 8.2 Responsive Design

#### Task 8.2.1: Mobile Optimization
- [ ] Bottom sheet for notifications on mobile
- [ ] Swipe gestures
- [ ] Touch-friendly buttons
- [ ] Proper spacing

#### Task 8.2.2: Desktop Optimization
- [ ] Dropdown positioning
- [ ] Keyboard shortcuts
- [ ] Hover effects

### 8.3 Accessibility

#### Task 8.3.1: A11y Features
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus management
- [ ] Color contrast

---

## Implementation Order (Priority)

### Sprint 1: Core Backend (Days 1-2)
1. Create notification handler
2. Update message handler for notifications
3. Create notification API routes
4. Test backend with Postman

### Sprint 2: Core Frontend (Days 3-4)
5. Create notification context
6. Create unread count context
7. Create API client functions
8. Test contexts with mock data

### Sprint 3: UI Components (Days 5-7)
9. Create notification bell icon
10. Create notification dropdown
11. Update ChatSidebar with badges
12. Test UI components

### Sprint 4: Integration (Days 8-9)
13. Integrate with ChatWindow
14. Integrate with message sending
15. Test real-time updates
16. Fix bugs

### Sprint 5: Browser Notifications (Day 10)
17. Create browser notification service
18. Create permission component
19. Integrate with notification context
20. Test browser notifications

### Sprint 6: Polish (Days 11-12)
21. Add animations
22. Optimize performance
23. Test on mobile
24. Fix responsive issues
25. Final testing

---

## Success Criteria

### Must Have ✅
- [ ] Unread count badge on chat items
- [ ] Notification bell with count
- [ ] Notification dropdown
- [ ] Real-time updates via sockets
- [ ] Mark as read functionality
- [ ] Browser notifications
- [ ] Mobile responsive
- [ ] Secure and validated

### Nice to Have 🎯
- [ ] Notification preferences
- [ ] Sound notifications
- [ ] Notification grouping
- [ ] Quick actions
- [ ] Notification page

### Future Enhancements 🚀
- [ ] Push notifications (PWA)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Notification analytics

---

## Technical Stack

### Backend
- Node.js + Express
- Socket.io for real-time
- MongoDB + Mongoose
- Rate limiting

### Frontend
- React + Next.js
- Context API for state
- Socket.io-client
- Framer Motion for animations
- Tailwind CSS for styling

### Browser APIs
- Notification API
- Page Visibility API
- Service Worker (future)

---

## Notes & Considerations

### Performance
- Use indexes on notification queries
- Paginate notification lists
- Cache unread counts
- Debounce mark as read calls

### UX
- Don't spam users with notifications
- Group similar notifications
- Allow users to control preferences
- Make notifications actionable

### Security
- Validate all notification data
- Check permissions before creating
- Rate limit notification creation
- Sanitize content to prevent XSS

### Accessibility
- Ensure keyboard navigation
- Add ARIA labels
- Support screen readers
- Maintain focus management

---

**Status:** Ready to implement  
**Estimated Time:** 10-12 days  
**Priority:** High  
**Complexity:** Medium-High
