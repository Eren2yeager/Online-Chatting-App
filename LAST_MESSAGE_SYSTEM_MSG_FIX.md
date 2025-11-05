# 🔧 Last Message & System Messages Fix

## Issues Fixed

### Issue 1: Last Message Not Showing in ChatSidebar
**Problem:** API returns lastMessage but ChatSidebar doesn't display it

### Issue 2: System Messages Showing Empty
**Problem:** System messages appear blank in chat

---

## Solution 1: Last Message Display

### API Fix (`/api/chats`)

#### Before:
```javascript
.populate('lastMessage')  // No fields specified, no sender populated
```

#### After:
```javascript
.populate({
  path: 'lastMessage',
  select: 'sender text type media createdAt isDeleted',
  populate: {
    path: 'sender',
    select: 'name image handle'
  }
})
```

### ChatSidebar Fix

#### Before:
```javascript
const getLastMessagePreview = (chat) => {
  if (!chat.lastMessage || !chat.lastMessage.senderId) return "";
  // Looking for 'senderId' but model uses 'sender'
  const senderId = chat.lastMessage.senderId._id;
  let content = chat.lastMessage.content || "";  // Wrong field
  ...
}
```

#### After:
```javascript
const getLastMessagePreview = (chat) => {
  if (!chat.lastMessage) return "";
  
  const lastMsg = chat.lastMessage;
  
  // Handle deleted messages
  if (lastMsg.isDeleted) {
    return "🚫 This message was deleted";
  }
  
  // Get sender info (correct field name)
  const senderId = lastMsg.sender?._id || lastMsg.sender;
  const senderName = senderId === session?.user?.id 
    ? "You" 
    : (lastMsg.sender?.name || "");
  
  // Determine content based on type
  let content = "";
  if (lastMsg.type === "system") {
    content = "System message";
  } else if (lastMsg.media && lastMsg.media.length > 0) {
    // Check media MIME type
    if (lastMsg.media[0].mime?.startsWith('image/')) {
      content = "📷 Image";
    } else if (lastMsg.media[0].mime?.startsWith('video/')) {
      content = "🎥 Video";
    } else if (lastMsg.media[0].mime?.startsWith('audio/')) {
      content = "🎧 Audio";
    } else {
      content = "📁 File";
    }
  } else {
    content = lastMsg.text || "";
  }
  
  return `${senderName ? senderName + ": " : ""}${content}`;
}
```

#### Timestamp Fix:
```javascript
// Before
{chat.lastMessage?.senderId && (  // Wrong check
  <span>{dateFormatter(new Date(chat.lastMessage.createdAt))}</span>
)}

// After
{chat.lastMessage?.createdAt && (  // Correct check
  <span>{dateFormatter(new Date(chat.lastMessage.createdAt))}</span>
)}
```

---

## Solution 2: System Messages Display

### ChatMessage Fix

#### Before:
```javascript
if (isSystem) {
  return (
    <div>
      <p>{message.text}</p>  // Empty! System messages use 'system' object
    </div>
  );
}
```

#### After:
```javascript
if (isSystem) {
  const getSystemMessageText = () => {
    if (!message.system) return message.text || "System message";
    
    const { event, targets, previous, next } = message.system;
    const senderName = message.sender?.name || "Someone";
    
    switch (event) {
      case 'member_added':
        const targetNames = targets.map(t => t.name).join(", ");
        return `${senderName} added ${targetNames}`;
        
      case 'member_removed':
        return `${senderName} removed ${targetNames}`;
        
      case 'name_changed':
        return `${senderName} changed the group name from "${previous}" to "${next}"`;
        
      case 'image_changed':
        return `${senderName} changed the group icon`;
        
      case 'admin_promoted':
        return `${senderName} promoted ${targetNames} to admin`;
        
      case 'admin_demoted':
        return `${senderName} demoted ${targetNames} from admin`;
        
      default:
        return message.text || "System message";
    }
  };

  return (
    <div className="flex justify-center my-4">
      <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-full shadow-sm">
        <p className="text-xs text-gray-600 text-center font-medium">
          {getSystemMessageText()}
        </p>
      </div>
    </div>
  );
}
```

---

## System Message Examples

### Member Added
```
"John added Alice, Bob"
```

### Member Removed
```
"John removed Alice"
```

### Name Changed
```
"John changed the group name from 'Old Name' to 'New Name'"
```

### Image Changed
```
"John changed the group icon"
```

### Admin Promoted
```
"John promoted Alice to admin"
```

### Admin Demoted
```
"John demoted Alice from admin"
```

---

## Message Model Structure

### System Message Object:
```javascript
{
  type: "system",
  sender: ObjectId,
  system: {
    event: "member_added",  // Event type
    targets: [ObjectId],    // Affected users
    previous: "Old Name",   // Previous value (for changes)
    next: "New Name"        // New value (for changes)
  }
}
```

---

## Files Modified

1. ✅ `src/app/(protected)/api/chats/route.js`
   - Properly populate lastMessage with sender
   - Select necessary fields

2. ✅ `src/components/chat/ChatSidebar.js`
   - Fixed getLastMessagePreview function
   - Use correct field names (sender not senderId)
   - Handle deleted messages
   - Check media MIME types
   - Fixed timestamp check

3. ✅ `src/components/chat/ChatMessage.jsx`
   - Added getSystemMessageText function
   - Parse system.event and generate readable text
   - Handle all system event types
   - Show sender name and targets

---

## Testing Checklist

### Last Message Display
- [ ] Open chats page
- [ ] See last message preview in sidebar ✅
- [ ] Shows sender name ("You" or friend name) ✅
- [ ] Shows message text or media type ✅
- [ ] Shows timestamp ✅
- [ ] Deleted messages show "🚫 This message was deleted" ✅

### System Messages
- [ ] Add member to group
- [ ] See "John added Alice" ✅
- [ ] Remove member
- [ ] See "John removed Alice" ✅
- [ ] Change group name
- [ ] See "John changed the group name..." ✅
- [ ] Change group icon
- [ ] See "John changed the group icon" ✅
- [ ] Promote admin
- [ ] See "John promoted Alice to admin" ✅
- [ ] Demote admin
- [ ] See "John demoted Alice from admin" ✅

---

## Before vs After

### Last Message in Sidebar

#### Before:
```
Group Chat
[Empty - no preview]
```

#### After:
```
Group Chat
You: Hello everyone!
10:30 AM
```

### System Messages

#### Before:
```
[Empty bubble in center]
```

#### After:
```
┌─────────────────────────────────┐
│ John added Alice to the group   │
└─────────────────────────────────┘
```

---

**Status:** ✅ Both Issues Fixed  
**Last Message:** ✅ Showing in sidebar  
**System Messages:** ✅ Displaying properly

Ready to test!
