# ChatApp - Real-time Chat Application

A modern, production-ready chat application built with Next.js, featuring real-time messaging, friend management, group chats, and more. This project is designed for scalability, security, and a seamless user experience, making it suitable for both personal and professional use cases.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Socket.IO Events](#socketio-events)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Acknowledgments](#acknowledgments)

---

## Features

| Category         | Features                                                                 |
|------------------|--------------------------------------------------------------------------|
| **Authentication & Profiles** | Google OAuth login, NextAuth.js integration, user avatars, bios, status, unique handles, QR code friend invites |
| **Friend System**| Send/accept/reject/cancel friend requests, search by handle/email, QR code invites, friend status/presence |
| **Chat & Messaging** | 1:1 and group chats, real-time messaging (Socket.IO), text/images/videos/files, reactions, emoji picker, replies, message deletion (for me/everyone), typing indicators, read receipts, delivery status |
| **UI/UX**        | Responsive (mobile-first), dark/light themes, Framer Motion animations, modern clean interface, mobile navigation |
| **Security**     | Input validation (Zod), rate limiting, secure file uploads (Cloudinary), protected routes, security headers |

---

## Tech Stack
- **Frontend:** Next.js 15, React 18, Tailwind CSS
- **Backend:** Next.js API Routes, Socket.IO
- **Database:** MongoDB (Mongoose)
- **Authentication:** NextAuth.js (Google OAuth)
- **File Storage:** Cloudinary
- **Validation:** Zod
- **Animations:** Framer Motion
- **UI Components:** Heroicons, Emoji Mart

---

## Prerequisites
- Node.js v18 or higher
- MongoDB database (local or Atlas)
- Google OAuth credentials
- Cloudinary account

---

## Environment Variables
Create a `.env.local` file in the root directory. Use the following template:

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

**Descriptions:**
- `MONGODB_URI`: MongoDB connection string.
- `NEXTAUTH_URL`: Base URL for NextAuth callbacks.
- `NEXTAUTH_SECRET`: Secret for NextAuth session encryption.
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`: Google OAuth credentials.
- `CLOUDINARY_*`: Cloudinary API credentials for file uploads.
- `SOCKET_SERVER_PORT`: Port for Socket.IO server.
- `RATE_LIMIT_*`: Rate limiting configuration.
- `MESSAGE_DELETE_WINDOW`: Time window for message deletion (ms).

---

## Installation & Setup

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
   # Edit .env.local with your credentials
   ```

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project, enable Google+ API, create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

5. **Set up Cloudinary**
   - Create a Cloudinary account
   - Get your cloud name, API key, and API secret

6. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Create a database for the application

---

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
   - Visit [http://localhost:3000](http://localhost:3000)

### Production Mode

1. **Build the application**
   ```bash
   npm run build
   ```
2. **Start the production server**
   ```bash
   npm start
   ```

---

## Project Structure

```
online-chatting-app/
├── app/                # Next.js App Router (pages, API routes)
│   ├── api/            # API endpoints (auth, chats, friends, messages, uploads, users)
│   ├── chats/          # Chat pages
│   ├── invite/         # QR code invite page
│   └── signin/         # Sign-in page
├── components/         # React components (chat, layout, providers)
├── lib/                # Utility libraries (auth, cloudinary, db, socket, validators, rateLimit)
├── models/             # Mongoose models (User, Chat, Message, FriendRequest, Notification)
├── server/             # Socket.IO server
├── public/             # Static assets
```

**Key Directories/Files:**
- `app/`: Main Next.js app, including API routes and pages.
- `components/`: UI and logic components for chat, layout, and providers.
- `lib/`: Helper libraries for authentication, database, sockets, validation, etc.
- `models/`: Mongoose schemas for MongoDB collections.
- `server/socket-server.js`: Standalone Socket.IO server for real-time features.
- `public/`: Static files (images, icons, etc).

---

## API Documentation

### Authentication
- `GET /api/auth/[...nextauth]` — NextAuth.js authentication endpoints.

### Users
- `GET /api/users/[id]` — Get user profile
  - **Params:** `id` (string, user ID)
  - **Response:**
    ```json
    {
      "_id": "...",
      "name": "...",
      "email": "...",
      "avatar": "...",
      ...
    }
    ```
- `PATCH /api/users/[id]` — Update user profile
  - **Body:** `{ "name": "...", "bio": "...", ... }`

### Friends
- `GET /api/friends/search?query=...` — Search for users
- `POST /api/friends/requests` — Send friend request
  - **Body:** `{ "to": "userId" }`
- `GET /api/friends/requests` — Get friend requests
- `PATCH /api/friends/requests/[id]` — Accept/reject request
  - **Body:** `{ "action": "accept" | "reject" }`
- `DELETE /api/friends/requests/[id]` — Cancel request

### Chats
- `GET /api/chats` — Get user's chats
- `POST /api/chats` — Create new chat
  - **Body:** `{ "members": ["userId1", "userId2", ...] }`

### Messages
- `GET /api/messages?chatId=...` — Get chat messages
- `POST /api/messages` — Send message
  - **Body:** `{ "chatId": "...", "content": "...", "type": "text" | "image" | ... }`

### Uploads
- `GET /api/uploads/signature` — Get Cloudinary upload signature

---

## Socket.IO Events

### Client to Server
- `message:new` — Send new message
- `message:edit` — Edit message
- `message:delete` — Delete message
- `typing:start` — Start typing indicator
- `typing:stop` — Stop typing indicator
- `reaction:add` — Add reaction to message
- `message:read` — Mark message as read

### Server to Client
- `message:new` — New message received
- `message:edit` — Message edited
- `message:delete` — Message deleted
- `typing:start` — User started typing
- `typing:stop` — User stopped typing
- `reaction:update` — Message reactions updated
- `message:read` — Message read by user
- `presence:update` — User presence updated

---

## FAQ

**Q: Can I use a different OAuth provider?**
A: Yes, NextAuth.js supports many providers. You’ll need to update the NextAuth config in `src/lib/auth.js`.

**Q: How do I deploy this app?**
A: Deploy the Next.js app (Vercel, Netlify, etc.), run the Socket.IO server separately (e.g., on a VPS), and set environment variables accordingly.

**Q: How do I add new features?**
A: Fork the repo, create a feature branch, and submit a pull request. See [Contributing](#contributing).

**Q: Where are files stored?**
A: All uploads are stored in Cloudinary. See `src/lib/cloudinary.js` for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/online-chatting-app/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

---

## Acknowledgments
- [Next.js](https://nextjs.org/) - React framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Cloudinary](https://cloudinary.com/) - File storage
- [MongoDB](https://www.mongodb.com/) - Database
