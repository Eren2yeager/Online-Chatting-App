"use client"
import { io } from 'socket.io-client';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';

// Socket context
const SocketContext = createContext();

/**
 * Socket.IO client provider for real-time communication
 * Handles connection, authentication, and event management
 */
export function SocketProvider({ children }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!session?.user?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection with authentication (same-origin)
    const newSocket = io({
      auth: {
        // Send user id as token for server-side authentication fallback
        token: session?.user?.id,
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [session?.user?.id, session?.accessToken, session?.token]);

  const value = {
    socket,
    isConnected,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to use socket context
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

/**
 * Hook to emit socket events with error handling
 */
export function useSocketEmit() {
  const { socket, isConnected } = useSocket();

  const emit = (event, data) => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return false;
    }

    try {
      console.log('Emitting socket event:', event, data);
      socket.emit(event, data);
      return true;
    } catch (error) {
      console.error('Error emitting socket event:', error);
      return false;
    }
  };

  const emitAck = (event, data) => {
    return new Promise((resolve) => {
      if (!socket || !isConnected) {
        console.warn('Socket not connected, cannot emitAck event:', event);
        resolve({ success: false, error: 'not_connected' });
        return;
      }
      try {
        socket.emit(event, data, (response) => {
          resolve(response);
        });
      } catch (error) {
        console.error('Error emitting socket event with ack:', error);
        resolve({ success: false, error: 'emit_failed' });
      }
    });
  };

  return { emit, emitAck, isConnected };
}

/**
 * Hook to listen to socket events
 */
export function useSocketListener(event, callback) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
}

/**
 * Hook for typing indicators
 */
export function useTypingIndicator(chatId) {
  const { socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState(new Map()); // Use Map with userId as key

  useEffect(() => {
    if (!socket || !chatId) return;

    const handleTypingStart = (data) => {
      if (data.chatId === chatId && data.user) {
        const userId = data.user._id || data.user.id;
        setTypingUsers(prev => {
          // Only update if user is not already typing
          if (prev.has(userId)) return prev;
          
          const newMap = new Map(prev);
          newMap.set(userId, data.user);
          return newMap;
        });
      }
    };

    const handleTypingStop = (data) => {
      if (data.chatId === chatId && data.user) {
        const userId = data.user._id || data.user.id;
        setTypingUsers(prev => {
          // Only update if user is actually typing
          if (!prev.has(userId)) return prev;
          
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, chatId]);

  // Memoize the result to prevent unnecessary re-renders
  return useMemo(() => Array.from(typingUsers.values()), [typingUsers]);
}

/**
 * Hook for presence updates
 */
export function usePresence() {
  const { socket } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };

    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [socket]);

  return Array.from(onlineUsers);
}
