import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Use separate socket URL or fallback to removing /api/v1 from API URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                      (import.meta.env.VITE_API_URL 
                        ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
                        : 'http://localhost:5000');
    
    console.log('🔌 Initializing socket connection to:', socketUrl);

    // Initialize socket connection
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      toast.success('Real-time connection established', { 
        duration: 2000,
        id: 'socket-connected'
      });
    });

    newSocket.on('connected', (data) => {
      console.log('✅ Server confirmed connection:', data);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      toast.error('Real-time connection lost', { 
        duration: 2000,
        id: 'socket-disconnected'
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;