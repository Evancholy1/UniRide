import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
if (!supabaseKey) {
  throw new Error('SUPABASE_KEY is not defined in the environment variables')
}

// Create Supabase client with persistent sessions
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth'
  }
})

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession()
  return !!data.session
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data.user
}