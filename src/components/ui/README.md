# 🎨 Modern UI Components Library

Beautiful, responsive, and animated React components built with Tailwind CSS and Framer Motion.

## 📦 Components

### Button
Modern button with gradients, animations, and loading states.

```jsx
import { Button } from '@/components/ui';

// Primary button
<Button variant="primary">Click me</Button>

// With icon
<Button 
  variant="success" 
  icon={<CheckIcon className="h-5 w-5" />}
>
  Save
</Button>

// Loading state
<Button loading>Processing...</Button>

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="warning">Warning</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
```

### Card
Elegant card component with variants and animations.

```jsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card variant="gradient" hover>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Variants
<Card variant="default">Default</Card>
<Card variant="gradient">Gradient</Card>
<Card variant="glass">Glass</Card>
<Card variant="elevated">Elevated</Card>
```

### Modal
Modern modal with backdrop blur and animations.

```jsx
import { Modal, ModalBody, ModalFooter } from '@/components/ui';

<Modal 
  isOpen={isOpen} 
  onClose={onClose}
  title="Modal Title"
  size="md"
>
  <ModalBody>
    <p>Modal content</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </ModalFooter>
</Modal>

// Sizes
<Modal size="sm">Small</Modal>
<Modal size="md">Medium</Modal>
<Modal size="lg">Large</Modal>
<Modal size="xl">Extra Large</Modal>
<Modal size="full">Full Width</Modal>
```

### Input
Beautiful input with floating labels and icons.

```jsx
import { Input } from '@/components/ui';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

<Input 
  label="Email"
  type="email"
  placeholder="Enter your email"
  icon={<EnvelopeIcon className="h-5 w-5" />}
  iconPosition="left"
/>

// With error
<Input 
  label="Password"
  type="password"
  error="Password is required"
/>

// With helper text
<Input 
  label="Username"
  helperText="Choose a unique username"
/>
```

### Avatar
Modern avatar with status indicators.

```jsx
import { Avatar, AvatarGroup } from '@/components/ui';

// Basic avatar
<Avatar 
  src="/user.jpg"
  alt="John Doe"
  size="md"
/>

// With status
<Avatar 
  src="/user.jpg"
  alt="John Doe"
  status="online"
  showStatus
/>

// Sizes
<Avatar size="xs" />
<Avatar size="sm" />
<Avatar size="md" />
<Avatar size="lg" />
<Avatar size="xl" />
<Avatar size="2xl" />

// Avatar Group
<AvatarGroup 
  avatars={[
    { src: '/user1.jpg', alt: 'User 1' },
    { src: '/user2.jpg', alt: 'User 2' },
    { src: '/user3.jpg', alt: 'User 3' },
  ]}
  max={3}
/>
```

### Badge
Colorful badges with variants and animations.

```jsx
import { Badge, NotificationBadge } from '@/components/ui';

// Basic badge
<Badge variant="primary">New</Badge>

// With dot
<Badge variant="success" dot pulse>
  Online
</Badge>

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>

// Notification Badge
<div className="relative">
  <BellIcon className="h-6 w-6" />
  <NotificationBadge count={5} />
</div>
```

### Toast
Beautiful toast notifications.

```jsx
import { toast } from '@/components/ui';

// Success
toast.success('Message sent successfully!');

// Error
toast.error('Failed to send message');

// Loading
const toastId = toast.loading('Sending...');
// Later...
toast.success('Sent!', { id: toastId });

// Custom
toast('Custom message', {
  icon: '👏',
  style: {
    borderRadius: '10px',
    background: '#333',
    color: '#fff',
  },
});
```

### Spinner
Loading spinners with variants.

```jsx
import { Spinner, PageLoader } from '@/components/ui';

// Basic spinner
<Spinner size="md" variant="primary" />

// Sizes
<Spinner size="xs" />
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Spinner size="xl" />

// Full page loader
<PageLoader message="Loading your chats..." />
```

## 🎨 Design Principles

### Gradients
All components use beautiful gradients for a modern look:
- Primary: Blue to Purple
- Success: Green to Emerald
- Danger: Red to Pink
- Warning: Yellow to Orange

### Animations
Smooth animations using Framer Motion:
- Fade in/out
- Scale on hover
- Slide transitions
- Spring physics

### Responsive
All components are fully responsive:
- Mobile-first design
- Touch-friendly
- Adaptive sizing

### Accessibility
Built with accessibility in mind:
- Keyboard navigation
- ARIA labels
- Focus indicators
- Screen reader support

## 🚀 Usage Tips

### Import Components
```jsx
// Import individual components
import { Button, Card, Modal } from '@/components/ui';

// Or import specific component
import Button from '@/components/ui/Button';
```

### Combine Components
```jsx
<Card variant="glass">
  <CardHeader>
    <div className="flex items-center gap-3">
      <Avatar src="/user.jpg" status="online" showStatus />
      <div>
        <h3 className="font-semibold">John Doe</h3>
        <Badge variant="success" dot>Active</Badge>
      </div>
    </div>
  </CardHeader>
  <CardBody>
    <p>Card content here</p>
  </CardBody>
  <CardFooter>
    <Button variant="primary" fullWidth>
      Send Message
    </Button>
  </CardFooter>
</Card>
```

### Custom Styling
All components accept className prop for custom styling:
```jsx
<Button className="my-custom-class">
  Custom Button
</Button>
```

## 📝 Notes

- All components use Tailwind CSS for styling
- Animations powered by Framer Motion
- Icons from Heroicons and React Icons
- Toast notifications from react-hot-toast
- Fully typed with PropTypes (can add TypeScript)

## 🎯 Next Steps

1. Use these components throughout your app
2. Customize colors in tailwind.config.js
3. Add more components as needed
4. Create composite components for specific use cases
