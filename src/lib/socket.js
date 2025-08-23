const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their personal room
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      socket.userId = userId;
      
      // Broadcast user online status
      socket.broadcast.emit('user-online', { userId, status: 'online' });
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation-${conversationId}`);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation-${conversationId}`);
      console.log(`User left conversation: ${conversationId}`);
    });

    // Handle new message
    socket.on('send-message', (data) => {
      const { conversationId, message } = data;
      
      // Broadcast message to all users in the conversation
      io.to(`conversation-${conversationId}`).emit('new-message', {
        conversationId,
        message
      });

      // Update conversation last message for all participants
      io.to(`conversation-${conversationId}`).emit('conversation-updated', {
        conversationId,
        lastMessage: {
          content: message.content,
          type: message.type,
          senderName: message.sender.name,
          createdAt: new Date()
        }
      });
    });

    // Handle message deletion
    socket.on('delete-message', (data) => {
      const { conversationId, messageId, deletedFor } = data;
      
      // Broadcast message deletion to all users in the conversation
      io.to(`conversation-${conversationId}`).emit('message-deleted', {
        conversationId,
        messageId,
        deletedFor
      });
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { conversationId, userId, userName } = data;
      socket.to(`conversation-${conversationId}`).emit('user-typing', {
        conversationId,
        userId,
        userName,
        isTyping: true
      });
    });

    socket.on('typing-stop', (data) => {
      const { conversationId, userId } = data;
      socket.to(`conversation-${conversationId}`).emit('user-typing', {
        conversationId,
        userId,
        isTyping: false
      });
    });

    // Handle user profile updates
    socket.on('profile-updated', (data) => {
      const { userId, updates } = data;
      socket.broadcast.emit('user-profile-updated', { userId, updates });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        // Broadcast user offline status
        socket.broadcast.emit('user-offline', { 
          userId: socket.userId, 
          status: 'offline' 
        });
      }
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
