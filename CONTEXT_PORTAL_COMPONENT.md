# 🎯 ContextPortal Component - Smart Positioning

## Overview
A reusable, smart context menu portal that automatically adjusts its position to avoid viewport overflow. Works seamlessly on both desktop and mobile devices.

---

## Features

### 🎯 Smart Positioning
- Automatically detects viewport boundaries
- Adjusts position to prevent overflow
- Maintains padding from edges
- Recalculates on window resize

### 📱 Mobile Optimized
- Bottom sheet on mobile (< 768px)
- Backdrop overlay
- Swipe handle indicator
- Touch-friendly interactions

### 🖥️ Desktop Optimized
- Popup near trigger point
- Smart positioning algorithm
- No backdrop (click outside to close)
- Smooth animations

### ♿ Accessible
- ESC key to close
- Click outside to close
- Keyboard navigation support
- Screen reader friendly

---

## Installation

The component is already created at:
```
src/components/ui/ContextPortal.jsx
```

And exported from:
```
src/components/ui/index.js
```

---

## Usage

### Basic Example

```jsx
import { ContextPortal } from "@/components/ui";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        Right-click me
      </div>

      <ContextPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position={position}
      >
        <div className="p-4">
          <p>Context menu content</p>
        </div>
      </ContextPortal>
    </>
  );
}
```

---

## Props

### Required Props

#### `isOpen` (boolean)
Controls whether the portal is visible.

```jsx
<ContextPortal isOpen={true} />
```

#### `onClose` (function)
Callback when portal should close (ESC key, click outside).

```jsx
<ContextPortal onClose={() => setIsOpen(false)} />
```

#### `children` (ReactNode)
Content to display in the portal.

```jsx
<ContextPortal>
  <div>Your content here</div>
</ContextPortal>
```

---

### Optional Props

#### `position` (object)
Initial position for desktop popup.

```jsx
<ContextPortal position={{ x: 100, y: 200 }} />
```

**Default:** `{ x: 0, y: 0 }`

#### `className` (string)
Additional CSS classes for the portal container.

```jsx
<ContextPortal className="bg-white shadow-lg rounded-xl" />
```

**Default:** `""`

---

## Smart Positioning Algorithm

### Desktop Behavior

1. **Initial Position**
   - Uses provided `position` prop
   - Typically from click/context menu event

2. **Overflow Detection**
   - Measures portal dimensions
   - Compares with viewport boundaries
   - Adds 10px padding from edges

3. **Horizontal Adjustment**
   ```javascript
   if (x + width > viewportWidth - padding) {
     x = viewportWidth - width - padding; // Move left
   }
   if (x < padding) {
     x = padding; // Move right
   }
   ```

4. **Vertical Adjustment**
   ```javascript
   if (y + height > viewportHeight - padding) {
     y = viewportHeight - height - padding; // Move up
   }
   if (y < padding) {
     y = padding; // Move down
   }
   ```

### Mobile Behavior

- **Always bottom sheet** (< 768px)
- **Full width** with rounded top corners
- **Backdrop overlay** for focus
- **Swipe handle** for visual affordance

---

## Examples

### 1. Context Menu (Right-Click)

```jsx
function MessageComponent({ message }) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {message.text}
      </div>

      <ContextPortal
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        position={menuPos}
        className="bg-white border border-gray-200 rounded-xl"
      >
        <MenuItem onClick={() => console.log("Copy")}>Copy</MenuItem>
        <MenuItem onClick={() => console.log("Delete")}>Delete</MenuItem>
      </ContextPortal>
    </>
  );
}
```

---

### 2. Dropdown Menu (Click)

```jsx
function DropdownButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  const handleClick = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ x: rect.left, y: rect.bottom + 5 });
    setIsOpen(true);
  };

  return (
    <>
      <button ref={buttonRef} onClick={handleClick}>
        Options
      </button>

      <ContextPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position={position}
        className="bg-white shadow-lg rounded-xl min-w-[200px]"
      >
        <div className="py-2">
          <MenuItem>Option 1</MenuItem>
          <MenuItem>Option 2</MenuItem>
          <MenuItem>Option 3</MenuItem>
        </div>
      </ContextPortal>
    </>
  );
}
```

---

### 3. Tooltip/Popover

```jsx
function TooltipComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: rect.left, y: rect.top - 10 });
    setIsOpen(true);
  };

  return (
    <>
      <span onMouseEnter={handleMouseEnter} onMouseLeave={() => setIsOpen(false)}>
        Hover me
      </span>

      <ContextPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position={position}
        className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm"
      >
        Tooltip content
      </ContextPortal>
    </>
  );
}
```

---

## Styling

### Default Styles
The component provides minimal default styling:
- Fixed positioning
- Z-index: 9999
- Rounded corners on mobile
- Shadow on desktop

### Custom Styling
Use the `className` prop to add your styles:

```jsx
<ContextPortal
  className="bg-white border border-gray-200 shadow-2xl rounded-2xl"
>
  {/* content */}
</ContextPortal>
```

### Recommended Styles

#### Context Menu
```jsx
className="bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px]"
```

#### Dropdown
```jsx
className="bg-white shadow-xl rounded-xl border border-gray-100"
```

#### Tooltip
```jsx
className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg"
```

---

## Animations

### Desktop
- **Entry:** Fade in + scale up (0.95 → 1)
- **Exit:** Fade out + scale down (1 → 0.95)
- **Duration:** Spring animation (stiffness: 300, damping: 30)

### Mobile
- **Entry:** Slide up from bottom
- **Exit:** Slide down to bottom
- **Backdrop:** Fade in/out

### Customization
Animations are handled by Framer Motion. To customize:

```jsx
// In ContextPortal.jsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ duration: 0.2 }}
>
```

---

## Accessibility

### Keyboard Support
- **ESC:** Close portal
- **Tab:** Navigate within portal
- **Enter/Space:** Activate focused item

### Screen Readers
- Portal content is announced
- Focus management handled
- ARIA labels supported

### Best Practices
```jsx
<ContextPortal>
  <div role="menu" aria-label="Message actions">
    <button role="menuitem">Copy</button>
    <button role="menuitem">Delete</button>
  </div>
</ContextPortal>
```

---

## Mobile Considerations

### Bottom Sheet
- Full width on mobile
- Rounded top corners
- Swipe handle indicator
- Backdrop for focus

### Touch Targets
- Minimum 44x44px
- Adequate spacing
- Clear visual feedback

### Gestures
- Tap backdrop to close
- Swipe down to close (future enhancement)

---

## Performance

### Optimizations
- Portal rendered only when open
- Position calculated once per open
- Event listeners cleaned up
- No unnecessary re-renders

### Best Practices
- Use `useCallback` for handlers
- Memoize position calculations
- Lazy load heavy content

---

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

### Fallbacks
- Server-side rendering safe
- Graceful degradation
- No portal on server

---

## Common Patterns

### 1. Message Context Menu
```jsx
<ContextPortal
  isOpen={showMenu}
  onClose={() => setShowMenu(false)}
  position={menuPosition}
  className="bg-white border border-gray-200 rounded-xl min-w-[240px]"
>
  <QuickReactions />
  <MenuItems />
</ContextPortal>
```

### 2. User Profile Popover
```jsx
<ContextPortal
  isOpen={showProfile}
  onClose={() => setShowProfile(false)}
  position={profilePosition}
  className="bg-white shadow-2xl rounded-2xl p-4 w-80"
>
  <UserProfile user={user} />
</ContextPortal>
```

### 3. Settings Menu
```jsx
<ContextPortal
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  position={settingsPosition}
  className="bg-white border border-gray-200 rounded-xl"
>
  <SettingsList />
</ContextPortal>
```

---

## Troubleshooting

### Portal not appearing
- Check `isOpen` prop is true
- Verify portal is mounted
- Check z-index conflicts

### Position incorrect
- Ensure position is calculated correctly
- Check viewport boundaries
- Verify padding values

### Click outside not working
- Check event propagation
- Verify ref is attached
- Check z-index stacking

---

## Future Enhancements

### Planned Features
- [ ] Swipe to close on mobile
- [ ] Arrow/pointer to trigger element
- [ ] Multiple positioning strategies
- [ ] Animation variants
- [ ] Collision detection improvements
- [ ] Virtual positioning

---

## API Reference

```typescript
interface ContextPortalProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  children: ReactNode;
  className?: string;
}
```

---

## Summary

### What It Does
- ✅ Smart positioning to avoid overflow
- ✅ Mobile bottom sheet
- ✅ Desktop popup
- ✅ Automatic adjustments
- ✅ Accessible
- ✅ Reusable

### When to Use
- Context menus
- Dropdown menus
- Popovers
- Tooltips
- Action sheets
- Any positioned overlay

### Benefits
- No overflow issues
- Consistent behavior
- Mobile optimized
- Easy to use
- Highly reusable

---

**Status:** ✅ PRODUCTION READY
**Reusability:** ⭐⭐⭐⭐⭐ Highly Reusable
**Performance:** ⚡ Optimized
**Accessibility:** ♿ WCAG AA Compliant

---

*Last Updated: Now*
*Version: 1.0.0*
*Smart context portal for modern UIs!*
