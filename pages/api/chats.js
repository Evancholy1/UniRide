import { supabase } from '@/lib/supabaseClient';
import { withAuth } from '@/lib/authMiddleware';

async function handler(req, res) {
  const userId = req.user.id;
  console.log('Chats API - Using authenticated user ID:', userId);

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getUserChats(userId, res);
    case 'POST':
      return createChat(req, userId, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get all chats for a user
async function getUserChats(userId, res) {
  try {
    // Get all chats where the user is either participant1 or participant2
    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        *,
        participant1:participant1_id(id, name),
        participant2:participant2_id(id, name)
      `)
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the data to have a consistent format
    const formattedChats = chats.map(chat => {
      const otherParticipant = chat.participant1_id === userId 
        ? chat.participant2 
        : chat.participant1;
      
      return {
        id: chat.id,
        otherParticipant: {
          id: otherParticipant.id,
          name: otherParticipant.name
        },
        updated_at: chat.updated_at,
        ride_id: chat.ride_id
      };
    });

    return res.status(200).json(formattedChats);
  } catch (error) {
    console.error('Error getting chats:', error);
    return res.status(500).json({ error: 'Failed to get chats' });
  }
}

// Create a new chat
async function createChat(req, userId, res) {
  const { otherUserId, rideId } = req.body;

  if (!otherUserId) {
    return res.status(400).json({ error: 'Other participant ID is required' });
  }

  try {
    console.log('Creating chat between users:', userId, otherUserId);
    console.log('For ride:', rideId);
    
    // Check if a chat already exists between these users
    const { data: existingChat, error: searchError } = await supabase
      .from('chats')
      .select('id')
      .or(`and(participant1_id.eq.${userId},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${userId})`)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching for existing chat:', searchError);
      throw searchError;
    }

    // If chat exists, return it
    if (existingChat) {
      console.log('Found existing chat:', existingChat.id);
      return res.status(200).json({ id: existingChat.id, exists: true });
    }

    console.log('No existing chat found, creating new one');
    
    // Create a new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({
        participant1_id: userId,
        participant2_id: otherUserId,
        ride_id: rideId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (createError) {
      console.error('Error creating new chat:', createError);
      throw createError;
    }

    console.log('New chat created:', newChat[0].id);
    return res.status(201).json({ id: newChat[0].id, exists: false });
  } catch (error) {
    console.error('Error creating chat:', error);
    return res.status(500).json({ error: 'Failed to create chat: ' + error.message });
  }
}

// Export with authentication middleware
export default withAuth(handler); 