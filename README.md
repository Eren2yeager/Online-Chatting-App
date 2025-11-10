# 💬 ChatApp - Real-time Messaging Application

A modern, feature-rich real-time chat application built with Next.js 15, Socket.IO, and MongoDB. Experience seamless communication with friends and groups, complete with media sharing, real-time notifications, and an intuitive user interface.

![Landing Page](./sceenshots/landingPage.png)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Socket Events](#-socket-events)
- [Security](#-security)
- [Performance](#-performance)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🔐 Authentication & User Management

- **Google OAuth Integration**: Secure authentication using NextAuth.js with Google provider
- **Session Management**: Server-side session handling with JWT tokens
- **User Profiles**: Customizable profiles with avatars, bios, and unique handles
- **QR Code Sharing**: Generate and scan QR codes for quick friend additions
- **Profile Customization**: Update name, bio, profile picture, and handle

![Sign In Page](./sceenshots/signinpage.png)
![Profile Page](./sceenshots/profilepage.png)

### 👥 Friends & Social Features

- **Friend System**: Send, accept, and reject friend requests
- **Friend Search**: Find friends by name or unique handle
- **Profile Viewing**: View detailed friend profiles with online status
- **Block/Unblock Users**: Manage blocked users list for privacy
- **Online Status**: Real-time online/offline indicators
- **Last Seen**: Track when users were last active

![Friends Page](./sceenshots/friendspage.png)

### 💬 Direct Messaging

- **1-on-1 Chats**: Private conversations with friends
- **Real-time Delivery**: Instant message delivery using Socket.IO WebSockets
- **Read Receipts**: See when messages are delivered and read
- **Typing Indicators**: Real-time typing status with auto-cleanup
- **Message Actions**: Edit (15-minute window), delete, reply to messages
- **Delete Options**: Delete for yourself or everyone (2-minute window)
- **Message Reactions**: React to messages with emojis
- **Reply Threading**: Quote and reply to specific messages

![Direct Chat](./sceenshots/chat-direct.png)
![Message Context Menu](./sceenshots/messageContextMenu.png)

### 👨‍👩‍👧‍👦 Group Chats

- **Create Groups**: Start group conversations with multiple friends
- **Group Management**: Add/remove members dynamically
- **Admin Controls**: Promote/demote admins (creator-only feature)
- **Group Settings**: Customize group name, description, and image
- **Invite Links**: Generate and share invite links with unique codes
- **Privacy Settings**: Control who can add members (admin-only or member-invite)
- **Member Management**: View all members with admin badges
- **System Messages**: Automatic notifications for group events

![Create Group](./sceenshots/create-group.png)
![Group Overview](./sceenshots/group-overview.png)
![Group Members](./sceenshots/group-member.png)
![Group Invite](./sceenshots/group-invite-page.png)

### 📎 Media & File Sharing

- **Image Sharing**: Upload and view images in chat with Cloudinary integration
- **Video Support**: Share and play videos with built-in player
- **Audio Messages**: Send voice messages (coming soon)
- **Document Sharing**: Share PDFs and documents
- **Media Gallery**: View all shared media organized by chat
- **Full-Screen Viewer**: View media in full-screen with zoom and navigation controls
- **Upload Progress**: Real-time upload progress indicators
- **Media Optimization**: Automatic image optimization with Next.js Image component

![Media Uploading](./sceenshots/media-uploading.png)
![Media Viewer](./sceenshots/media-viewer.png)
![Group Media](./sceenshots/group-media.png)

### 🔗 Link Management

- **Link Detection**: Automatically detect and display links in messages
- **Link Preview**: See previews of shared links (coming soon)
- **Link Gallery**: View all shared links organized by chat

![Group Links](./sceenshots/group-links.png)

### 🎨 Rich Messaging Features

- **Emoji Picker**: Express yourself with a comprehensive emoji picker
- **Message Reactions**: React to messages with multiple emoji options
- **Message Editing**: Edit sent messages within 15 minutes
- **Message Deletion**: Delete messages for yourself or everyone (2-minute window for everyone)
- **Reply to Messages**: Quote and reply to specific messages with threading
- **Context Menu**: Right-click for quick message actions
- **Text Formatting**: Support for URLs and text content

![Emoji Picker](./sceenshots/emoji-picker.png)

### 🔔 Notifications

- **Real-time Notifications**: Get notified of new messages, friend requests, and group invites
- **Notification Center**: View all notifications in one organized place
- **Silent Mode**: Toggle notification sounds on/off across the app
- **Unread Badges**: See unread message counts at a glance
- **Notification Types**: Support for messages, friend requests, group invites, and system events
- **Mark as Read**: Mark individual or all notifications as read
- **Notification Sounds**: Audio alerts for new notifications (when not in silent mode)

![Notifications](./sceenshots/notificationpage.png)

### ⚙️ Settings & Customization

- **Silent Mode**: Toggle notification sounds globally
- **Blocked Users**: View and manage blocked users list
- **Account Management**: Delete account with full data cleanup
- **Resizable Chat**: Adjust chat sidebar width on desktop (260px - 500px)
- **Responsive Design**: Fully responsive layout for all screen sizes
- **Theme Support**: Clean, modern UI with consistent design language

![Settings Page](./sceenshots/settingspage.png)

### 📱 Progressive Web App (PWA)

- **Mobile Optimized**: Fully responsive design for all devices
- **Touch Friendly**: Optimized touch interactions for mobile
- **Adaptive Layout**: UI adapts to screen size automatically
- **Install as App**: Install as a standalone app on mobile devices
- **App Manifest**: Configured with icons and metadata
- **Service Worker**: Offline support (coming soon)

### 🔍 Additional Features

- **QR Code Scanner**: Scan QR codes to add friends instantly
- **Group Invites**: Join groups via shareable invite links
- **Search Functionality**: Search messages, friends, and groups
- **SEO Optimized**: Proper meta tags, Open Graph, and structured data
- **Accessibility**: ARIA labels and keyboard navigation support
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Smooth loading indicators throughout the app

![QR Scanner](./sceenshots/qr-scanner.png)

---

## 🛠️ Tech Stack

### Frontend

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router and Server Components
- **[React 19](https://react.dev/)** - UI library with latest features
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library for smooth transitions
- **[Socket.IO Client](https://socket.io/)** - Real-time bidirectional communication
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication for Next.js
- **[React Hook Form](https://react-hook-form.com/)** - Performant form management
- **[Emoji Picker React](https://www.npmjs.com/package/emoji-picker-react)** - Emoji selection component
- **[React Icons](https://react-icons.github.io/react-icons/)** - Icon library
- **[Heroicons](https://heroicons.com/)** - Beautiful hand-crafted SVG icons
- **[React Hot Toast](https://react-hot-toast.com/)** - Toast notifications
- **[QRCode.react](https://www.npmjs.com/package/qrcode.react)** - QR code generation
- **[@yudiel/react-qr-scanner](https://www.npmjs.com/package/@yudiel/react-qr-scanner)** - QR code scanning
- **[date-fns](https://date-fns.org/)** - Modern date utility library

### Backend

- **[Node.js](https://nodejs.org/)** - JavaScript runtime environment
- **[Socket.IO](https://socket.io/)** - WebSocket server for real-time features
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database
- **[Mongoose](https://mongoosejs.com/)** - MongoDB ODM with schema validation
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication with Google OAuth
- **[JWT](https://jwt.io/)** - JSON Web Tokens for secure authentication
- **[Cloudinary](https://cloudinary.com/)** - Cloud-based image and video management
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[PostCSS](https://postcss.org/)** - CSS transformations
- **[Concurrently](https://www.npmjs.com/package/concurrently)** - Run multiple commands concurrently
- **[dotenv](https://www.npmjs.com/package/dotenv)** - Environment variable management

---

## 🏗️ Architecture

### Application Architecture

The application follows a modern full-stack architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Next.js    │  │  Socket.IO   │  │   NextAuth   │  │
│  │  App Router  │  │    Client    │  │    Client    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Next.js Server                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  API Routes  │  │  Middleware  │  │   NextAuth   │  │
│  │   (REST)     │  │    (Auth)    │  │   Provider   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Socket.IO Server                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Message    │  │     Chat     │  │    Friend    │  │
│  │   Handlers   │  │   Handlers   │  │   Handlers   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    MongoDB Database                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Users     │  │   Messages   │  │    Chats     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   Friends    │  │Notifications │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Real-time Communication Flow

1. **Client connects** to Socket.IO server with JWT authentication
2. **Server authenticates** user and joins them to their chat rooms
3. **User sends message** via Socket.IO event
4. **Server validates** and saves message to MongoDB
5. **Server broadcasts** message to all participants in the chat room
6. **Clients receive** message in real-time and update UI

### Database Schema

#### User Model
```javascript
{
  name: String,
  email: String (unique),
  image: String,
  handle: String (unique),
  bio: String,
  friends: [ObjectId],
  blockedUsers: [ObjectId],
  isOnline: Boolean,
  lastSeen: Date,
  createdAt: Date
}
```

#### Chat Model
```javascript
{
  participants: [ObjectId],
  isGroup: Boolean,
  name: String,
  image: String,
  description: String,
  admins: [ObjectId],
  creator: ObjectId,
  lastMessage: ObjectId,
  inviteCode: String,
  privacy: String,
  createdAt: Date
}
```

#### Message Model
```javascript
{
  chat: ObjectId,
  sender: ObjectId,
  text: String,
  media: [{url, publicId, width, height, mime, size, filename}],
  replyTo: ObjectId,
  reactions: [{user: ObjectId, emoji: String}],
  readBy: [ObjectId],
  isEdited: Boolean,
  isDeleted: Boolean,
  deletedFor: [ObjectId],
  createdAt: Date
}
```

#### FriendRequest Model
```javascript
{
  from: ObjectId,
  to: ObjectId,
  message: String,
  status: String (pending/accepted/rejected),
  createdAt: Date
}
```

#### Notification Model
```javascript
{
  user: ObjectId,
  type: String,
  title: String,
  message: String,
  link: String,
  read: Boolean,
  createdAt: Date
}
```

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **MongoDB** 6.x or higher (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Google OAuth Credentials** ([Get credentials](https://console.cloud.google.com/))
- **Cloudinary Account** ([Sign up](https://cloudinary.com/))

### Setup Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/online-chatting-app.git
cd online-chatting-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up MongoDB**

Option A: Local MongoDB
```bash
# Install MongoDB locally
# Start MongoDB service
mongod --dbpath /path/to/data/directory
```

Option B: MongoDB Atlas
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string
- Whitelist your IP address

4. **Configure Google OAuth**

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing one
- Enable Google+ API
- Create OAuth 2.0 credentials
- Add authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google` (development)
  - `https://yourdomain.com/api/auth/callback/google` (production)

5. **Set up Cloudinary**

- Sign up at [Cloudinary](https://cloudinary.com/)
- Get your Cloud Name, API Key, and API Secret from the dashboard
- Create an upload preset (optional)

6. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here
NODE_ENV=development
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chatapp
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: Google Site Verification
GOOGLE_VERIFICATION_CODE=your_verification_code
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🚀 Running the Application

### Development Mode

The application runs both Next.js and Socket.IO server together:

```bash
npm run dev
```

This command starts:
- Next.js development server on `http://localhost:3000`
- Socket.IO server on the same port
- Hot module replacement for instant updates

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Mode

1. **Build the application**

```bash
npm run build
```

2. **Start the production server**

```bash
npm start
```

### Running Separately (Advanced)

If you need to run Next.js and Socket.IO on different ports:

**Terminal 1 - Next.js:**
```bash
npx next dev -p 3000
```

**Terminal 2 - Socket.IO:**
```bash
node server/server.mjs
```

Update `NEXT_PUBLIC_SOCKET_URL` in your environment variables to point to the Socket.IO server.

---

## 📁 Project Structure

```
online-chatting-app/
├── .next/                      # Next.js build output
├── .vscode/                    # VS Code configuration
├── node_modules/               # Dependencies
├── public/                     # Static assets
│   ├── sounds/                 # Notification sounds
│   ├── apple-touch-icon.png    # iOS app icon
│   ├── icon-192.png            # PWA icon (192x192)
│   ├── icon-512.png            # PWA icon (512x512)
│   ├── logo.png                # App logo
│   ├── og-image.jpg            # Open Graph image
│   ├── sw.js                   # Service worker
│   └── manifest.json           # PWA manifest
├── sceenshots/                 # App screenshots for README
├── server/                     # Socket.IO server
│   ├── handlers/               # Socket event handlers
│   │   ├── chat.handler.mjs    # Chat management events
│   │   ├── friend.handler.mjs  # Friend request events
│   │   ├── message.handler.mjs # Message events
│   │   ├── typing.handler.mjs  # Typing indicators
│   │   ├── user.handler.mjs    # User profile & blocking
│   │   ├── notification.handler.mjs # Notification events
│   │   └── index.mjs           # Handler exports
│   ├── utils/                  # Server utilities
│   │   ├── auth.mjs            # Socket authentication
│   │   ├── presence.mjs        # User online/offline status
│   │   ├── rooms.mjs           # Chat room management
│   │   └── typing.mjs          # Typing indicator tracking
│   ├── server.mjs              # Main server file
│   ├── README.md               # Server documentation
│   └── SOCKET_EVENTS.md        # Socket events reference
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (protected)/        # Protected routes (require auth)
│   │   │   ├── chats/          # Chat pages
│   │   │   │   ├── [chatId]/   # Individual chat page
│   │   │   │   └── page.js     # Chats list page
│   │   │   ├── friends/        # Friends page
│   │   │   ├── invite/         # Group invite page
│   │   │   │   └── [code]/     # Invite code handler
│   │   │   ├── notifications/  # Notifications page
│   │   │   ├── profile/        # User profiles
│   │   │   │   ├── [userId]/   # User profile page
│   │   │   │   └── page.js     # Own profile page
│   │   │   ├── settings/       # Settings pages
│   │   │   │   ├── blocked/    # Blocked users page
│   │   │   │   └── page.js     # Main settings page
│   │   │   └── layout.js       # Protected layout
│   │   ├── api/                # API routes
│   │   │   ├── account/        # Account management
│   │   │   ├── chats/          # Chat API endpoints
│   │   │   ├── settings/       # Settings API
│   │   │   └── users/          # User API endpoints
│   │   ├── signin/             # Sign-in page
│   │   ├── favicon.ico         # Favicon
│   │   ├── globals.css         # Global styles
│   │   ├── layout.js           # Root layout
│   │   ├── manifest.js         # PWA manifest generator
│   │   ├── page.js             # Home page (redirects)
│   │   ├── robots.js           # Robots.txt generator
│   │   └── sitemap.js          # Sitemap generator
│   ├── components/              # React components
│   │   ├── auth/               # Authentication components
│   │   │   └── SignInButton.js
│   │   ├── chat/               # Chat components
│   │   │   ├── chatSpareParts/ # Chat sub-components
│   │   │   ├── ChatInput.jsx   # Message input component
│   │   │   ├── ChatMessage.jsx # Message display component
│   │   │   ├── ChatSidebar.js  # Chat list sidebar
│   │   │   ├── ChatWindow.js   # Main chat window
│   │   │   ├── CreateGroupModal.jsx
│   │   │   ├── FriendRequestsModal.jsx
│   │   │   ├── ManageChatModal.jsx
│   │   │   ├── MessageContextMenu.jsx
│   │   │   ├── ResizableLayout.jsx
│   │   │   ├── TypingIndicator.js
│   │   │   └── UnreadBadge.jsx
│   │   ├── common/             # Shared components
│   │   │   ├── EmojiPicker.jsx
│   │   │   └── mediaFullViewer.jsx
│   │   ├── friends/            # Friend components
│   │   │   └── AddFriendModal.jsx
│   │   ├── icons/              # Custom icons
│   │   │   └── CustomChatIcon.jsx
│   │   ├── layout/             # Layout components
│   │   │   ├── header.jsx
│   │   │   ├── mediaFullViewContext.js
│   │   │   ├── Navigation.js
│   │   │   ├── NavigationContext.js
│   │   │   ├── NotificationContext.jsx
│   │   │   ├── SecureLayout.js
│   │   │   ├── ToastContext.js
│   │   │   └── UnreadCountContext.jsx
│   │   ├── notifications/      # Notification components
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── NotificationDropdown.jsx
│   │   │   ├── NotificationItem.jsx
│   │   │   ├── NotificationPermission.jsx
│   │   │   ├── NotificationTester.jsx
│   │   │   ├── ServiceWorkerInit.jsx
│   │   │   └── index.js
│   │   ├── providers/          # Context providers
│   │   │   └── SessionProvider.js
│   │   ├── seo/                # SEO components
│   │   │   └── JsonLd.jsx
│   │   └── ui/                 # UI components
│   │       ├── Avatar.jsx
│   │       ├── Badge.jsx
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── ContextPortal.jsx
│   │       ├── Input.jsx
│   │       ├── Loader.jsx
│   │       ├── Modal.jsx
│   │       ├── Spinner.jsx
│   │       ├── Toast.jsx
│   │       ├── UserAvatar.jsx
│   │       └── index.js
│   ├── functions/              # Utility functions
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Core libraries
│   │   ├── auth.js             # NextAuth configuration
│   │   ├── mongodb.js          # MongoDB connection
│   │   ├── socket.js           # Socket.IO client setup
│   │   └── silentMode.js       # Silent mode service
│   └── models/                 # Mongoose models
│       ├── Chat.mjs
│       ├── FriendRequest.mjs
│       ├── Message.mjs
│       ├── Notification.mjs
│       └── User.mjs
├── .env.local                  # Environment variables (not in git)
├── .gitignore                  # Git ignore rules
├── eslint.config.mjs           # ESLint configuration
├── jsconfig.json               # JavaScript configuration
├── middleware.js               # Next.js middleware (auth)
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies and scripts
├── package-lock.json           # Dependency lock file
├── postcss.config.mjs          # PostCSS configuration
├── README.md                   # This file
└── tailwind.config.js          # Tailwind CSS configuration
```

---

## 📡 API Documentation

### REST API Endpoints

#### Authentication
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signin/google` - Sign in with Google
- `POST /api/auth/signout` - Sign out

#### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update current user profile
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/search?q=query` - Search users

#### Chats
- `GET /api/chats` - Get all user chats
- `GET /api/chats/:chatId` - Get chat by ID
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats/:chatId/invite` - Generate invite link
- `GET /api/chats/invite/:code` - Get chat by invite code

#### Settings
- `GET /api/settings/silent-mode` - Get silent mode status
- `POST /api/settings/silent-mode` - Toggle silent mode
- `GET /api/settings/blocked` - Get blocked users
- `DELETE /api/account` - Delete account

---

## 🔌 Socket Events

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: userId // or JWT token
  }
});
```

### Message Events

#### Send Message
```javascript
socket.emit('message:new', {
  chatId: 'chat_id',
  text: 'Hello!',
  media: [], // optional
  replyTo: 'message_id' // optional
}, (response) => {
  console.log(response); // { success: true, message: {...} }
});
```

#### Edit Message
```javascript
socket.emit('message:edit', {
  messageId: 'message_id',
  text: 'Updated text',
  media: []
}, (response) => {
  console.log(response);
});
```

#### Delete Message
```javascript
socket.emit('message:delete', {
  messageId: 'message_id',
  deleteForEveryone: true // or false
}, (response) => {
  console.log(response);
});
```

#### Mark as Read
```javascript
socket.emit('message:read', {
  messageId: 'message_id',
  chatId: 'chat_id'
});
```

#### Add Reaction
```javascript
socket.emit('reaction:add', {
  messageId: 'message_id',
  emoji: '👍'
}, (response) => {
  console.log(response);
});
```

### Chat Events

#### Create Chat
```javascript
socket.emit('chat:create', {
  participants: ['user_id1', 'user_id2'],
  isGroup: true,
  name: 'Group Name',
  image: '/path/to/image.jpg',
  description: 'Group description'
}, (response) => {
  console.log(response);
});
```

#### Update Chat
```javascript
socket.emit('chat:update', {
  chatId: 'chat_id',
  name: 'New Name',
  image: '/new/image.jpg',
  description: 'New description'
}, (response) => {
  console.log(response);
});
```

#### Add Member
```javascript
socket.emit('chat:member:add', {
  chatId: 'chat_id',
  userIds: ['user_id1', 'user_id2']
}, (response) => {
  console.log(response);
});
```

#### Remove Member
```javascript
socket.emit('chat:member:remove', {
  chatId: 'chat_id',
  userId: 'user_id'
}, (response) => {
  console.log(response);
});
```

### Friend Events

#### Send Friend Request
```javascript
socket.emit('friend:request:create', {
  handle: '@username',
  message: 'Optional message'
}, (response) => {
  console.log(response);
});
```

#### Accept/Reject/Cancel Friend Request
```javascript
socket.emit('friend:request:action', {
  requestId: 'request_id',
  action: 'accept' // or 'reject', 'cancel'
}, (response) => {
  console.log(response);
});
```

#### Remove Friend
```javascript
socket.emit('friend:remove', {
  friendId: 'user_id'
}, (response) => {
  console.log(response);
});
```

### User Events

#### Update Profile
```javascript
socket.emit('profile:update', {
  name: 'New Name',
  bio: 'New bio',
  image: '/new/image.jpg',
  handle: 'newhandle'
}, (response) => {
  console.log(response);
});
```

#### Block User
```javascript
socket.emit('user:block', {
  userId: 'user_id'
}, (response) => {
  console.log(response);
});
```

#### Unblock User
```javascript
socket.emit('user:unblock', {
  userId: 'user_id'
}, (response) => {
  console.log(response);
});
```

### Typing Events

#### Start Typing
```javascript
socket.emit('typing:start', {
  chatId: 'chat_id'
});
```

#### Stop Typing
```javascript
socket.emit('typing:stop', {
  chatId: 'chat_id'
});
```

### Listening to Events

```javascript
// New message received
socket.on('message:new', ({ message, chatId }) => {
  console.log('New message:', message);
});

// Message edited
socket.on('message:edit', ({ message, chatId }) => {
  console.log('Message edited:', message);
});

// Message deleted
socket.on('message:delete', ({ messageId, chatId, deleteForEveryone }) => {
  console.log('Message deleted:', messageId);
});

// User typing
socket.on('typing:start', ({ chatId, user }) => {
  console.log(`${user.name} is typing...`);
});

// User stopped typing
socket.on('typing:stop', ({ chatId, user }) => {
  console.log(`${user.name} stopped typing`);
});

// Presence update
socket.on('presence:update', ({ userId, status, lastSeen }) => {
  console.log(`User ${userId} is ${status}`);
});

// Friend request received
socket.on('friend:request:new', ({ request }) => {
  console.log('New friend request:', request);
});

// Chat created
socket.on('chat:created', ({ chat }) => {
  console.log('New chat created:', chat);
});
```

For complete Socket.IO event documentation, see [server/SOCKET_EVENTS.md](server/SOCKET_EVENTS.md).

---

## 🔒 Security

### Authentication & Authorization

- **NextAuth.js**: Secure authentication with Google OAuth 2.0
- **JWT Tokens**: Signed tokens for session management
- **Session Validation**: Server-side session validation on every request
- **Protected Routes**: Middleware-based route protection
- **Socket Authentication**: JWT-based socket connection authentication

### Data Security

- **Input Validation**: Zod schema validation on all inputs
- **XSS Protection**: Sanitized user inputs and outputs
- **CSRF Protection**: Built-in Next.js CSRF protection
- **SQL Injection**: MongoDB with Mongoose prevents injection attacks
- **Password Hashing**: Bcrypt for secure password storage (if applicable)

### Security Headers

Configured in `next.config.mjs`:

```javascript
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; ..."
}
```

### File Upload Security

- **File Type Validation**: Only allowed file types accepted
- **File Size Limits**: Maximum file size enforced
- **Cloudinary Integration**: Secure cloud storage with signed uploads
- **Malware Scanning**: Cloudinary automatic malware detection

### Privacy Features

- **Block Users**: Users can block unwanted contacts
- **Private Chats**: Direct messages are private between participants
- **Group Privacy**: Admin-only or member-invite group settings
- **Data Deletion**: Complete account deletion with data cleanup

---

## ⚡ Performance

### Optimization Techniques

#### Frontend Optimizations

- **Code Splitting**: Automatic code splitting with Next.js
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Memoization**: React.memo and useMemo for expensive computations
- **Debouncing**: Search and input debouncing
- **Virtual Scrolling**: Efficient message list rendering (coming soon)

#### Backend Optimizations

- **Connection Pooling**: MongoDB connection pooling (maxPoolSize: 10)
- **Efficient Queries**: Optimized MongoDB queries with proper indexes
- **Room-based Broadcasting**: Socket.IO rooms for targeted message delivery
- **Auto-cleanup**: Typing indicators auto-cleanup after 5 seconds
- **Caching**: Strategic caching of frequently accessed data

#### Database Indexes

```javascript
// User indexes
{ email: 1 } // unique
{ handle: 1 } // unique

// Chat indexes
{ participants: 1 }
{ inviteCode: 1 } // unique, sparse

// Message indexes
{ chat: 1, createdAt: -1 }
{ sender: 1 }

// FriendRequest indexes
{ from: 1, to: 1 }
{ status: 1 }
```

### Performance Metrics

- **First Contentful Paint (FCP)**: < 1.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Message Delivery**: < 100ms (real-time)

---

## 🚢 Deployment

### Render Deployment (Recommended)

This application is deployed on [Render](https://render.com/), which provides excellent support for Node.js applications with Socket.IO.

1. **Push code to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/chatapp.git
git push -u origin main
```

2. **Deploy to Render**

- Go to [Render](https://render.com/)
- Click "New +" and select "Web Service"
- Connect your GitHub repository
- Configure the service:
  - **Name**: chatapp (or your preferred name)
  - **Environment**: Node
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: Free or paid plan

3. **Environment Variables**

Add these in Render dashboard (Environment tab):

```
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=your_secret
MONGODB_URI=your_mongodb_atlas_uri
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=production
PORT=3000
```

4. **Update Google OAuth**

Add your Render domain to authorized redirect URIs in Google Cloud Console:
- `https://your-app-name.onrender.com/api/auth/callback/google`

5. **Deploy**

Click "Create Web Service" and Render will automatically deploy your application.

**Note:** Render's free tier may spin down after inactivity. Consider upgrading to a paid plan for production use.

### Alternative Deployment Options

#### Vercel

1. Go to [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. Add environment variables
4. Deploy
5. Note: You may need to deploy Socket.IO server separately

#### Railway

1. Create a new project on [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Add environment variables
4. Deploy

#### DigitalOcean App Platform

1. Create a new app on [DigitalOcean](https://www.digitalocean.com/products/app-platform)
2. Connect your GitHub repository
3. Configure build and run commands
4. Add environment variables
5. Deploy

### MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for all IPs)
4. Get connection string
5. Replace `<password>` with your database user password

### Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test Google OAuth login
- [ ] Test Socket.IO connection
- [ ] Verify image uploads to Cloudinary
- [ ] Test real-time messaging
- [ ] Check MongoDB connection
- [ ] Verify SSL certificate
- [ ] Test on mobile devices
- [ ] Monitor error logs
- [ ] Set up analytics (optional)

---

## 🧪 Testing

### Manual Testing

Test the following features:

**Authentication:**
- [ ] Sign in with Google
- [ ] Sign out
- [ ] Session persistence
- [ ] Protected route access

**Messaging:**
- [ ] Send text message
- [ ] Send image
- [ ] Edit message (within 15 min)
- [ ] Delete message
- [ ] Reply to message
- [ ] Add reaction
- [ ] Read receipts

**Friends:**
- [ ] Send friend request
- [ ] Accept friend request
- [ ] Reject friend request
- [ ] Remove friend
- [ ] Block user
- [ ] Unblock user

**Groups:**
- [ ] Create group
- [ ] Add members
- [ ] Remove members
- [ ] Promote admin
- [ ] Update group settings
- [ ] Generate invite link
- [ ] Join via invite link

**Real-time:**
- [ ] Typing indicators
- [ ] Online status
- [ ] Message delivery
- [ ] Notifications

### Browser Testing

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

---

## 🐛 Troubleshooting

### Common Issues

#### Socket.IO Connection Failed

**Problem:** Socket.IO fails to connect

**Solutions:**
- Check if server is running on correct port
- Verify `NEXTAUTH_SECRET` is set
- Check browser console for errors
- Ensure MongoDB is connected
- Try different transport (websocket/polling)

#### Google OAuth Error

**Problem:** "Error 400: redirect_uri_mismatch"

**Solutions:**
- Add correct redirect URI in Google Console
- Format: `http://localhost:3000/api/auth/callback/google`
- Ensure `NEXTAUTH_URL` matches your domain
- Clear browser cache and cookies

#### MongoDB Connection Error

**Problem:** "MongoServerError: Authentication failed"

**Solutions:**
- Verify MongoDB URI is correct
- Check database user credentials
- Whitelist IP address in MongoDB Atlas
- Ensure network access is configured

#### Images Not Uploading

**Problem:** Image upload fails

**Solutions:**
- Verify Cloudinary credentials
- Check file size (max 10MB)
- Ensure file type is supported
- Check browser console for errors
- Verify API key permissions

#### Messages Not Sending

**Problem:** Messages don't appear in real-time

**Solutions:**
- Check Socket.IO connection status
- Verify user is authenticated
- Check MongoDB connection
- Ensure chat exists and user is participant
- Check browser console for errors

### Debug Mode

Enable debug logging:

```javascript
// In socket.js
const socket = io(SOCKET_URL, {
  auth: { token: userId },
  debug: true
});
```



## 🗺️ Roadmap

### Planned Features

#### Phase 1 (Q1 2025)
- [ ] Voice calling (WebRTC)
- [ ] Video calling (WebRTC)
- [ ] End-to-end encryption
- [ ] Message search functionality
- [ ] Advanced media viewer (zoom, rotate)

#### Phase 2 (Q2 2025)
- [ ] Custom themes and dark mode
- [ ] Message scheduling
- [ ] Polls and surveys in groups
- [ ] Story/Status feature
- [ ] Voice messages
- [ ] File sharing improvements

#### Phase 3 (Q3 2025)
- [ ] Desktop app (Electron)
- [ ] Mobile apps (React Native)
- [ ] Push notifications
- [ ] Offline support
- [ ] Message backup and export

#### Phase 4 (Q4 2025)
- [ ] AI-powered features
- [ ] Translation services
- [ ] Advanced analytics
- [ ] Bot integration
- [ ] API for third-party integrations

### Community Requests

Vote for features on our [Discussions](https://github.com/yourusername/chatapp/discussions) page!

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository
- 📢 Share with others

### Development Setup

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Test thoroughly
6. Submit a pull request

### Pull Request Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation
- Keep PRs focused and small
- Reference related issues

### Code Style

- Use ESLint configuration
- Follow React best practices
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Commit Message Format

```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(chat): add message reactions

- Add emoji picker for reactions
- Update message component
- Add socket event handlers

Closes #123
```

## 🙏 Acknowledgments

### Technologies

- [Next.js](https://nextjs.org/) - The React Framework for Production
- [Socket.IO](https://socket.io/) - Real-time bidirectional event-based communication
- [MongoDB](https://www.mongodb.com/) - The most popular NoSQL database
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Cloudinary](https://cloudinary.com/) - Media management platform
- [Render](https://render.com/) - Platform for developers

### Inspiration

- WhatsApp - For messaging UX patterns
- Discord - For group chat features
- Telegram - For media handling
- Slack - For workspace organization


<!-- Add contributor avatars here -->

---

## 📞 Contact & Support

### Get in Touch

- **Portfolio**: [Get in touch with Developer](https://portfolio-samar-gautam.netlify.app)



