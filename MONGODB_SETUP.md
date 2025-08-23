# MongoDB Setup Guide for ChatApp

This guide will help you set up MongoDB for the ChatApp application.

## 🚀 Quick Setup Options

### Option 1: MongoDB Atlas (Cloud - Recommended for Beginners)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select your preferred cloud provider and region
   - Click "Create"

3. **Set Up Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password (save these!)
   - Select "Read and write to any database"
   - Click "Add User"

4. **Set Up Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `chatapp`

6. **Update Environment Variables**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB Installation

#### Windows
1. **Download MongoDB Community Server**
   - Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Select "Windows" and download the MSI installer

2. **Install MongoDB**
   - Run the MSI installer
   - Choose "Complete" installation
   - Install MongoDB Compass (GUI tool) if prompted

3. **Start MongoDB Service**
   - Open Command Prompt as Administrator
   - Run: `net start MongoDB`

4. **Create Database**
   - Open MongoDB Compass
   - Connect to `mongodb://localhost:27017`
   - Create a new database named `chatapp`

#### macOS
1. **Install with Homebrew**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Start MongoDB Service**
   ```bash
   brew services start mongodb/brew/mongodb-community
   ```

3. **Create Database**
   ```bash
   mongosh
   use chatapp
   exit
   ```

#### Linux (Ubuntu)
1. **Install MongoDB**
   ```bash
   sudo apt update
   sudo apt install mongodb
   ```

2. **Start MongoDB Service**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Create Database**
   ```bash
   mongosh
   use chatapp
   exit
   ```

## 🔧 Environment Configuration

Update your `.env.local` file:

```env
# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/chatapp

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp?retryWrites=true&w=majority
```

## 🧪 Testing the Connection

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Check Console Logs**
   - Look for MongoDB connection success messages
   - No connection errors should appear

3. **Test Database Operations**
   - Try to sign in with Google
   - Create a conversation
   - Send a message

## 🚨 Troubleshooting

### Connection Refused
- Ensure MongoDB service is running
- Check if port 27017 is available
- Verify firewall settings

### Authentication Failed
- Check username/password in connection string
- Ensure user has proper permissions
- Verify database name is correct

### Network Timeout
- Check internet connection (for Atlas)
- Verify IP whitelist (for Atlas)
- Check network firewall settings

## 📊 MongoDB Compass (Optional)

MongoDB Compass is a GUI tool for managing MongoDB:

1. **Download**: [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. **Connect**: Use your connection string
3. **Explore**: Browse collections, documents, and run queries

## 🔒 Security Best Practices

### For Development
- Use local MongoDB with default settings
- No authentication required

### For Production
- Use MongoDB Atlas with authentication
- Enable network access restrictions
- Use strong passwords
- Enable MongoDB Cloud security features

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas Tutorial](https://docs.atlas.mongodb.com/getting-started/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [NextAuth.js MongoDB Adapter](https://next-auth.js.org/adapters/mongodb)

---

**Need help? Check the main README.md or create an issue in the repository.**
