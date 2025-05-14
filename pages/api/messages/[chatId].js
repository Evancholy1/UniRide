import { supabase } from '@/lib/supabaseClient';
import { withAuth } from '@/lib/authMiddleware';

async function handler(req, res) {
  const userId = req.user.id;
  console.log('Messages API - Using authenticated user ID:', userId);
  const { chatId } = req.query;

  if (!chatId) {
    return res.status(400).json({ error: 'Chat ID is required' });
  }

  // Only GET method is allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First verify the user is a participant in this chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (chatError) {
      console.error('Error fetching chat:', chatError);
      return res.status(404).json({ error: 'Chat not found', details: chatError.message });
    }

    // Check if the user is a participant
    if (chat.participant1_id !== userId && chat.participant2_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this chat' });
    }

    // Get messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, name)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender_id: msg.sender_id,
      sender_name: msg.sender.name,
      created_at: msg.created_at,
      is_current_user: msg.sender_id === userId
    }));

    return res.status(200).json(formattedMessages);
  } catch (error) {
    console.error('Error processing messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
}

// Export with authentication middleware
export default withAuth(handler); 