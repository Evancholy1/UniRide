import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/AuthProvider'

interface Chat {
  id: string
  otherParticipant: {
    id: string
    name: string
  }
  updated_at: string
  ride_id: string | null
}

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated && user) {
      fetchChats()
    }
  }, [isAuthenticated, authLoading, user])

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats')
      }
      
      const data = await response.json()
      setChats(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching chats:', error)
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    // If it's today, show only the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    // If it's this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
    
    // Otherwise show full date
    return date.toLocaleDateString()
  }

  if (authLoading || loading) {
    return <div className="text-center p-10">Loading messages...</div>
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">💬 Messages</h1>
        <button 
          onClick={() => router.push('/')}
          className="text-blue-600 text-sm"
        >
          Back to Homepage
        </button>
      </div>
      
      {chats.length > 0 ? (
        <ul className="space-y-2 bg-white rounded-lg shadow">
          {chats.map((chat) => (
            <li key={chat.id}>
              <button
                onClick={() => router.push(`/messages/${chat.id}`)}
                className="w-full text-left p-4 border-b hover:bg-gray-50 transition flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{chat.otherParticipant.name}</p>
                  {chat.ride_id && (
                    <p className="text-sm text-gray-500">
                      Ride: <span className="text-blue-600">#{chat.ride_id.slice(0, 8)}</span>
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(chat.updated_at)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No messages yet.</p>
          <p className="text-sm text-gray-500">
            Start a conversation by messaging a driver or passenger from a ride page.
          </p>
        </div>
      )}
    </div>
  )
} 