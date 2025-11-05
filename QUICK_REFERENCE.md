# 🚀 Quick Reference Guide

## ChatMessage Component

### Supported File Types

#### Images
```
JPG, JPEG, PNG, GIF, WEBP, SVG, BMP
```

#### Videos
```
MP4, WEBM, OGG, MOV, AVI, MKV
```

#### Audio
```
MP3, WAV, OGG, M4A, AAC, FLAC
```

#### Documents
```
PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD, JSON, XML, CSV
```

#### Archives
```
ZIP, RAR, 7Z, TAR, GZ
```

---

## Usage

### Basic
```jsx
<ChatMessage
  message={message}
  isOwn={message.sender._id === currentUserId}
/>
```

### With Callbacks
```jsx
<ChatMessage
  message={message}
  isOwn={isOwn}
  onReply={(msg) => handleReply(msg)}
  onEdit={(msg) => handleEdit(msg)}
  onDelete={(msg, deleteForEveryone) => handleDelete(msg, deleteForEveryone)}
  onReact={(emoji) => handleReact(emoji)}
  showAvatar={true}
/>
```

---

## Context Menu Actions

### Desktop
- Right-click on message

### Mobile
- Long-press on message

### Available Actions
1. Quick Reactions (8 emojis)
2. Copy Text
3. Reply
4. Edit (own messages only)
5. Download Media
6. Share
7. Message Info
8. Delete for Me
9. Delete for Everyone (own messages only)

---

## Socket Events

### Emit
```javascript
// Add reaction
emit("reaction:add", { messageId, emoji });

// Delete message
emitAck("message:delete", { messageId, deleteForEveryone });
```

### Listen (in ChatWindow)
```javascript
socket.on("message:new", handleNewMessage);
socket.on("message:edit", handleEditMessage);
socket.on("message:delete", handleDeleteMessage);
socket.on("reaction:update", handleReactionUpdate);
```

---

## Media Grid Layouts

- **1 item:** Full width
- **2 items:** 2 columns
- **3 items:** 2 columns (3rd spans full width)
- **4+ items:** 2x2 grid with "+N" overlay

---

## Customization

### Change Bubble Colors
```jsx
// File: ChatMessage.jsx, line ~550
isOwn
  ? "bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600"
  : "bg-gradient-to-br from-white to-gray-50"
```

### Modify Quick Reactions
```jsx
// File: MessageContextMenu.jsx, line ~30
const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];
```

### Adjust Grid Columns
```jsx
// File: ChatMessage.jsx, line ~250
imageVideos.length === 1 ? "grid-cols-1" :
imageVideos.length === 2 ? "grid-cols-2" :
"grid-cols-2" // Change to grid-cols-3 for 3 columns
```

---

## Testing Checklist

- [ ] Upload image (JPG, PNG)
- [ ] Upload video (MP4)
- [ ] Upload audio (MP3)
- [ ] Upload document (PDF)
- [ ] Upload multiple files
- [ ] Right-click context menu
- [ ] Quick reactions
- [ ] Reply to message
- [ ] Edit message
- [ ] Delete message
- [ ] Download media
- [ ] Mobile bottom sheet
- [ ] Socket real-time updates

---

## Common Issues

### Images not loading
- Check Cloudinary configuration
- Verify URL is accessible
- Check CORS settings

### Socket not connecting
- Verify socket server is running
- Check socket URL in config
- Check network tab for errors

### Context menu not showing
- Check z-index conflicts
- Verify event handlers are attached
- Check console for errors

---

## Performance Tips

1. Use lazy loading for images
2. Limit media grid to 4 items initially
3. Compress images before upload
4. Use Cloudinary transformations
5. Implement virtual scrolling for long chats

---

## Accessibility

- All buttons have aria-labels
- Keyboard navigation supported
- Focus indicators visible
- Color contrast WCAG AA compliant
- Screen reader friendly

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Dependencies

- React 18+
- Framer Motion 10+
- Heroicons 2+
- Tailwind CSS 3+
- Socket.io-client 4+

---

## File Structure

```
src/components/chat/
├── ChatMessage.jsx          # Main message component
├── MessageContextMenu.jsx   # Enhanced context menu
├── ChatWindow.js           # Chat container
└── ChatInput.jsx           # Message input
```

---

## API Reference

### Message Object
```typescript
{
  _id: string;
  text?: string;
  sender: { _id, name, image };
  media?: MediaFile[];
  replyTo?: Message;
  reactions?: Reaction[];
  type?: 'system' | 'message';
  createdAt: Date;
  edited?: boolean;
}
```

### MediaFile Object
```typescript
{
  url: string;
  filename?: string;
  mime?: string;
  size?: number;
  width?: number;
  height?: number;
}
```

---

## Keyboard Shortcuts

- **ESC:** Close context menu
- **Enter:** Send message
- **Shift+Enter:** New line
- **Ctrl+V:** Paste image

---

## Mobile Gestures

- **Long press:** Open context menu
- **Tap:** Close menu
- **Swipe down:** Close bottom sheet
- **Pinch:** Zoom image (in full view)

---

## Documentation Files

- `CHATMESSAGE_ENHANCED.md` - Complete documentation
- `PROJECT_COMPLETE.md` - Full project overview
- `QUICK_REFERENCE.md` - This file

---

**Last Updated:** Now
**Version:** 2.0.0
**Status:** Production Ready ✅
