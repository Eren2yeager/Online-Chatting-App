# ChatApp - Real-time Chat Application

A modern, production-ready chat application built with Next.js, featuring real-time messaging, friend management, group chats, and more.

## Features

### 🔐 Authentication & Profiles
- Google OAuth authentication with NextAuth.js
- User profiles with customizable avatars, bios, and status
- Unique handles for easy friend discovery
- QR code sharing for friend invitations

### 👥 Friend System
- Send, accept, and reject friend requests
- Multiple invitation methods:
  - QR code scanning
  - Handle/username search
  - Email search
- Friend status and presence indicators

### 💬 Chat & Messaging
- 1:1 and group chats
- Real-time messaging with Socket.IO
- Message types: text, images, videos, files
- Message reactions and emoji support
- Reply to messages
- Message deletion (for me/everyone)
- Typing indicators
- Read receipts and delivery status

### 🎨 UI/UX
- Responsive design (mobile-first)
- Dark/light theme support
- Smooth animations with Framer Motion
- Modern, clean interface
- Mobile-optimized navigation

### 🔒 Security
- Input validation with Zod
- Rate limiting
- Secure file uploads with Cloudinary
- Authentication on all protected routes
- Security headers

## Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Socket.IO
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js with Google OAuth
- **File Storage**: Cloudinary
- **Real-time**: Socket.IO
- **Validation**: Zod
- **Animations**: Framer Motion
- **UI Components**: Heroicons, Emoji Mart

## Prerequisites

- Node.js 18+ 
- MongoDB database
- Google OAuth credentials
- Cloudinary account

## Installation

1. **Clone the repository**
```bash
   git clone <repository-url>
cd online-chatting-app
   ```

2. **Install dependencies**
   ```bash
npm install
```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/chat-app

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key-here

   # Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Socket.IO Server
   SOCKET_SERVER_PORT=3001
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # Message Deletion Window (in milliseconds)
   MESSAGE_DELETE_WINDOW=120000
   ```

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

5. **Set up Cloudinary**
   - Create a Cloudinary account
   - Get your cloud name, API key, and API secret
   - Configure upload presets if needed

6. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Create a database for the application

## Running the Application

### Development Mode

1. **Start the Socket.IO server**
   ```bash
   npm run dev:socket
   ```

2. **Start the Next.js development server**
   ```bash
   npm run dev:next
   ```

   Or run both simultaneously:
```bash
npm run dev
```

3. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Mode

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Project Structure

```
online-chatting-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication routes
│   │   ├── chats/                # Chat management
│   │   ├── friends/              # Friend requests
│   │   ├── messages/             # Message handling
│   │   ├── uploads/              # File uploads
│   │   └── users/                # User management
│   ├── chats/                    # Chat pages
│   ├── invite/                   # QR code invite page
│   └── signin/                   # Sign-in page
├── components/                   # React components
│   ├── chat/                     # Chat-related components
│   ├── layout/                   # Layout components
│   └── providers/                # Context providers
├── lib/                          # Utility libraries
│   ├── auth.js                   # NextAuth configuration
│   ├── cloudinary.js             # Cloudinary utilities
│   ├── mongodb.js                # Database connection
│   ├── socket.js                 # Socket.IO client
│   ├── validators.js             # Zod validation schemas
│   └── rateLimit.js              # Rate limiting utilities
├── models/                       # Mongoose models
│   ├── User.js                   # User model
│   ├── Chat.js                   # Chat model
│   ├── Message.js                # Message model
│   ├── FriendRequest.js          # Friend request model
│   └── Notification.js           # Notification model
├── server/                       # Socket.IO server
│   └── socket-server.js          # Real-time server
└── public/                       # Static assets
```

## API Endpoints

### Authentication
- `GET /api/auth/[...nextauth]` - NextAuth.js authentication

### Users
- `GET /api/users/[id]` - Get user profile
- `PATCH /api/users/[id]` - Update user profile

### Friends
- `GET /api/friends/search` - Search for users
- `POST /api/friends/requests` - Send friend request
- `GET /api/friends/requests` - Get friend requests
- `PATCH /api/friends/requests/[id]` - Accept/reject request
- `DELETE /api/friends/requests/[id]` - Cancel request

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat

### Messages
- `GET /api/messages` - Get chat messages
- `POST /api/messages` - Send message

### Uploads
- `GET /api/uploads/signature` - Get Cloudinary upload signature

## Socket.IO Events

### Client to Server
- `message:new` - Send new message
- `message:edit` - Edit message
- `message:delete` - Delete message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `reaction:add` - Add reaction to message
- `message:read` - Mark message as read

### Server to Client
- `message:new` - New message received
- `message:edit` - Message edited
- `message:delete` - Message deleted
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `reaction:update` - Message reactions updated
- `message:read` - Message read by user
- `presence:update` - User presence updated

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/yourusername/online-chatting-app/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Cloudinary](https://cloudinary.com/) - File storage
- [MongoDB](https://www.mongodb.com/) - Database
