'use client'
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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 10;

  useEffect(() => {
    if (!session?.user?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Reset reconnect attempts when session changes
    setReconnectAttempts(0);

    // Create socket connection with authentication (same-origin)
    const newSocket = io({
      auth: {
        // Send JWT token for server-side authentication
        token: session?.user?.id,
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 20000, // Increase timeout to 20 seconds
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0); // Reset reconnect attempts on successful connection
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      // Handle specific disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, attempt to reconnect manually
        newSocket.connect();
      }
      // For other reasons, socket.io will try to reconnect automatically
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      setReconnectAttempts(prev => prev + 1);
      
      // Log detailed error information
      console.error('Connection error details:', {
        message: error.message,
        type: error.type,
        description: error.description,
        attempts: reconnectAttempts + 1
      });
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(typeof error === 'string' ? error : error.message || 'Unknown error');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after all attempts');
      setConnectionError('Failed to connect after multiple attempts. Please refresh the page.');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [session?.user?.id]);

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
 * Hook to emit socket events with error handling and acknowledgment
 * @param {string} eventName - The event name to emit
 * @param {any} data - The data to send
 * @param {Object} options - Options for the emit
 * @returns {Promise} - A promise that resolves with the acknowledgment or rejects with an error
 */
export function useSocketEmit() {
  const { socket, isConnected } = useSocket();

  const emitEvent = async (eventName, data, options = {}) => {
    const { timeout = 5000 } = options;
    
    if (!socket || !isConnected) {
      throw new Error('Socket is not connected');
    }

    return new Promise((resolve, reject) => {
      // Set timeout for acknowledgment
      const timer = setTimeout(() => {
        reject(new Error(`Event ${eventName} acknowledgment timed out after ${timeout}ms`));
      }, timeout);

      // Emit with acknowledgment callback
      socket.emit(eventName, data, (response) => {
        clearTimeout(timer);
        
        if (response && response.success === false) {
          reject(new Error(response.error || 'Unknown error'));
        } else {
          resolve(response);
        }
      });
    });
  };

  return emitEvent;
}

/**
 * Hook to emit socket events
 */
export function useSocketEmitter() {
  const { socket, isConnected } = useSocket();

  const emit = (event, data) => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return false;
    }

    try {
      // console.log('Emitting socket event:', event, data);
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
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePresenceUpdate = (data) => {
      console.log('Presence update:', data);
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

    // Listen for initial online users list
    const handleOnlineUsers = (data) => {
      console.log('Received online users:', data.userIds?.length || 0, 'users');
      setOnlineUsers(new Set(data.userIds || []));
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.on('presence:online-users', handleOnlineUsers);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('presence:online-users', handleOnlineUsers);
    };
  }, [socket, isConnected]);

  // Separate effect to request online users when connected
  useEffect(() => {
    if (!socket || !isConnected) return;

    let retryCount = 0;
    const maxRetries = 3;
    let retryTimer;

    const requestOnlineUsers = () => {
      console.log(`Requesting online users (attempt ${retryCount + 1})...`);
      socket.emit('presence:get-online');
      retryCount++;

      // Retry if no response after 2 seconds
      if (retryCount < maxRetries) {
        retryTimer = setTimeout(() => {
          requestOnlineUsers();
        }, 2000);
      }
    };

    // Initial request with small delay
    const timer = setTimeout(requestOnlineUsers, 100);

    return () => {
      clearTimeout(timer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [socket, isConnected]);

  return Array.from(onlineUsers);
}
