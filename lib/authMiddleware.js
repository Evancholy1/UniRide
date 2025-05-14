import { supabase } from './supabaseClient';

// Middleware to check authentication for API routes
export const withAuth = (handler) => {
  return async (req, res) => {
    // Check for authentication
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    console.log('Auth middleware - Session check:', session ? 'Session exists' : 'No session');
    
    if (!session) {
      return res.status(401).json({ 
        error: 'Not authenticated', 
        details: 'No valid session found. Please log in again.' 
      });
    }
    
    // Add user info to the request
    req.user = session.user;
    console.log('Auth middleware - Authenticated user:', req.user.id);
    
    // Continue to the actual handler
    return handler(req, res);
  };
}; 