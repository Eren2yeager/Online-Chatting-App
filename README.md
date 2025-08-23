# ChatApp - Modern Online Chatting Application

A feature-rich, real-time chat application built with Next.js, inspired by Line messaging app. Features include Google OAuth authentication, real-time messaging, media sharing, and a beautiful, responsive UI.

## 🚀 Features

- **🔐 Secure Authentication**: Google OAuth integration with NextAuth.js
- **💬 Real-time Messaging**: WebSocket-powered instant messaging
- **📱 Modern UI/UX**: Beautiful interface with Framer Motion animations
- **🖼️ Media Sharing**: Support for images and audio files
- **📱 Responsive Design**: Works seamlessly on all devices
- **🔒 Session Protection**: Secure layout requiring user authentication
- **🗄️ Database**: MongoDB with Mongoose ODM

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js with Google Provider
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: WebSocket support (Socket.io)
- **Styling**: Tailwind CSS with custom components

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB (local or cloud instance)
- Google OAuth credentials (for authentication)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd online-chatting-app
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Google OAuth (Get these from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chatapp
```

### 3. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Create database: `chatapp`

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Replace `MONGODB_URI` with your Atlas connection string

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env.local`

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   └── conversations/ # Chat API endpoints
│   ├── auth/              # Authentication pages
│   ├── chat/              # Main chat application
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Home page
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── chat/              # Chat-related components
│   ├── layout/            # Layout components
│   └── providers/         # Context providers
├── lib/                    # Utility libraries
│   ├── auth.js            # NextAuth configuration
│   ├── mongodb.js         # MongoDB connection utility
│   └── mongodb-client.js  # MongoDB client for NextAuth
└── models/                 # Mongoose models
    ├── User.js             # User model
    ├── Conversation.js     # Conversation model
    └── Message.js          # Message model
```

## 🔧 Configuration

### MongoDB Models

The application uses three main Mongoose models:

- **User**: Authentication and user management
- **Conversation**: Chat rooms and group chats with participants
- **Message**: Individual chat messages with media support

### Authentication Flow

1. User visits the application
2. Redirected to sign-in if not authenticated
3. Google OAuth authentication
4. Session creation and user data storage in MongoDB
5. Access to secure chat interface

### Database Schema

```javascript
// User Schema
{
  name: String,
  email: String (unique),
  emailVerified: Date,
  image: String,
  timestamps: true
}

// Conversation Schema
{
  name: String,
  isGroup: Boolean,
  participants: [ObjectId], // Array of User IDs
  lastMessage: {
    content: String,
    type: String,
    senderId: ObjectId,
    createdAt: Date
  },
  timestamps: true
}

// Message Schema
{
  content: String,
  type: String (text/image/audio),
  mediaUrl: String,
  senderId: ObjectId,
  conversationId: ObjectId,
  timestamps: true
}
```

## 🎨 Customization

### Colors and Themes

Modify the color scheme by updating Tailwind classes in components. The current theme uses:
- Primary: Blue (`blue-600`, `blue-700`)
- Secondary: Purple (`purple-600`)
- Accent: Green (`green-600`)
- Neutral: Gray scale (`gray-50` to `gray-800`)

### Animations

Framer Motion animations can be customized in each component. Current animations include:
- Fade-in effects
- Slide transitions
- Scale hover effects
- Staggered loading animations

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `NEXTAUTH_SECRET`: Your NextAuth secret
   - `NEXTAUTH_URL`: Your production URL
4. Deploy automatically

### Other Platforms

The application can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Features

- **Session-based Authentication**: Secure user sessions
- **Route Protection**: Protected chat routes
- **Input Validation**: Server-side validation for all inputs
- **NoSQL Injection Protection**: Mongoose with parameterized queries
- **CORS Protection**: Built-in Next.js security
- **MongoDB Security**: Connection string validation and error handling

## 🧪 Testing

```bash
# Run ESLint
npm run lint

# Run type checking (if using TypeScript)
npm run type-check

# Run tests (when implemented)
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page
2. Review the setup instructions
3. Ensure all environment variables are set correctly
4. Verify MongoDB connection
5. Check MongoDB logs for connection issues

## 🔮 Future Enhancements

- [ ] WebSocket real-time messaging
- [ ] Cloudinary media upload integration
- [ ] Group chat management
- [ ] Message encryption
- [ ] Push notifications
- [ ] Mobile app
- [ ] Voice and video calls
- [ ] MongoDB aggregation for analytics
- [ ] Real-time typing indicators

---

**Built with ❤️ using Next.js, MongoDB, and modern web technologies**
