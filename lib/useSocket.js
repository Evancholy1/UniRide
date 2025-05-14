import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

export default function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketInitializedRef = useRef(false);

  useEffect(() => {
    // Only initialize the socket once
    if (!socketInitializedRef.current) {
      socketInitializedRef.current = true;

      // Initialize the socket connection
      const initSocket = async () => {
        // Ensure the socket server is running
        await fetch('/api/socket', {
          credentials: 'include' // Include cookies for authentication
        });
        
        // Create the socket connection
        const socketInstance = io({
          withCredentials: true // Include credentials in socket connection
        });
        
        // Set up event listeners
        socketInstance.on('connect', () => {
          console.log('Socket connected!');
          setIsConnected(true);
        });
        
        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });
        
        socketInstance.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setIsConnected(false);
        });
        
        // Save the socket instance
        setSocket(socketInstance);
      };

      initSocket();
    }

    // Clean up function
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Function to join a specific chat room
  const joinChat = (chatId) => {
    if (socket && isConnected) {
      socket.emit('join-chat', chatId);
    }
  };

  // Function to send a message
  const sendMessage = (chatId, senderId, message, senderName) => {
    if (socket && isConnected) {
      socket.emit('send-message', {
        chatId,
        senderId,
        message,
        senderName
      });
    }
  };

  // Function to listen for new messages
  const onNewMessage = (callback) => {
    if (socket) {
      socket.on('new-message', callback);
    }
    
    // Return a function to remove the listener
    return () => {
      if (socket) {
        socket.off('new-message', callback);
      }
    };
  };

  return {
    socket,
    isConnected,
    joinChat,
    sendMessage,
    onNewMessage
  };
} 