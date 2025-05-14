import { Server } from 'socket.io';
import { supabase } from '@/lib/supabaseClient';
import { withAuth } from '@/lib/authMiddleware';

async function handler(req, res) {
  // If the socket server is already running, don't create a new one
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  try {
    console.log('Setting up socket.io server');
    const io = new Server(res.socket.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    res.socket.server.io = io;

    io.on('connection', async (socket) => {
      console.log('Client connected:', socket.id);

      // Handle joining a chat room
      socket.on('join-chat', (chatId) => {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat: ${chatId}`);
      });

      // Handle sending messages
      socket.on('send-message', async (messageData) => {
        const { chatId, senderId, message, senderName } = messageData;
        
        try {
          console.log('Received message:', { chatId, senderId, message });
          
          // Store message in database
          const { data, error } = await supabase.from('messages').insert({
            chat_id: chatId,
            sender_id: senderId,
            content: message,
            created_at: new Date().toISOString(),
          }).select();

          if (error) {
            console.error('Error saving message:', error);
            return;
          }

          console.log('Message saved to database:', data[0].id);

          // Broadcast the message to all users in the chat room
          const fullMessage = {
            ...data[0],
            sender_name: senderName
          };
          
          io.to(chatId).emit('new-message', fullMessage);
        } catch (err) {
          console.error('Socket message error:', err);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.end();
  } catch (error) {
    console.error('Socket initialization error:', error);
    res.status(500).end();
  }
}

// Export with authentication middleware
export default withAuth(handler); 