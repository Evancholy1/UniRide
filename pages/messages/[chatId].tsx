import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/AuthProvider'
import useSocket from '@/lib/useSocket'

interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  created_at: string
  is_current_user: boolean
}

interface ChatInfo {
  id: string
  otherParticipant: {
    id: string
    name: string
  }
  ride_id: string | null
}

export default function ChatPage() {
  const router = useRouter()
  const { chatId } = router.query
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isConnected, joinChat, sendMessage, onNewMessage } = useSocket()
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, authLoading, router])
  
  // Fetch messages when chatId is available
  useEffect(() => {
    if (!chatId || !user) return
    
    const fetchMessages = async () => {
      try {
        // Get chat info
        const chatResponse = await fetch('/api/chats', {
          credentials: 'include'
        });
        if (!chatResponse.ok) throw new Error('Failed to fetch chats')
        
        const chats = await chatResponse.json()
        const currentChat = chats.find((chat: any) => chat.id === chatId)
        
        if (!currentChat) {
          router.push('/messages')
          return
        }
        
        setChatInfo(currentChat)
        
        // Get messages
        const messagesResponse = await fetch(`/api/messages/${chatId}`, {
          credentials: 'include'
        });
        if (!messagesResponse.ok) throw new Error('Failed to fetch messages')
        
        const messagesData = await messagesResponse.json()
        setMessages(messagesData)
        setLoading(false)
        
        // Join the chat room via socket
        joinChat(chatId as string)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }
    
    fetchMessages()
  }, [chatId, user])
  
  // Listen for new messages
  useEffect(() => {
    if (!chatId || !user) return
    
    const unsubscribe = onNewMessage((message: any) => {
      setMessages(prev => [...prev, {
        ...message,
        is_current_user: message.sender_id === user?.id
      }])
    })
    
    return unsubscribe
  }, [chatId, user])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !user || !chatInfo) return
    
    // Send message via socket
    sendMessage(
      chatId as string,
      user.id,
      newMessage,
      user.user_metadata?.name || user.email
    )
    
    // Clear input
    setNewMessage('')
  }
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const formatMessageDate = (dateString: string, index: number) => {
    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString([], { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
    
    // Show date divider if first message or different day from previous message
    if (index === 0) return formattedDate
    
    const prevDate = new Date(messages[index - 1].created_at)
    if (date.toDateString() !== prevDate.toDateString()) {
      return formattedDate
    }
    
    return null
  }

  // Show loading state while authentication or chat data is loading
  if (authLoading || loading) {
    return <div className="text-center p-10">Loading chat...</div>
  }

  if (!chatInfo) {
    return <div className="text-center p-10">Chat not found</div>
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Chat Header */}
      <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-semibold">{chatInfo.otherParticipant.name}</h1>
          {chatInfo.ride_id && (
            <p className="text-xs text-gray-500">
              Ride: #{chatInfo.ride_id.slice(0, 8)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => router.push('/messages')}
            className="text-blue-600 text-sm hover:underline"
          >
            Back to Messages
          </button>
          {chatInfo.ride_id && (
            <button 
              onClick={() => router.push(`/ride/${chatInfo.ride_id}`)}
              className="text-blue-600 text-sm hover:underline"
            >
              View Ride
            </button>
          )}
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id}>
                {/* Date divider */}
                {formatMessageDate(message.created_at, index) && (
                  <div className="text-center my-4">
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {formatMessageDate(message.created_at, index)}
                    </span>
                  </div>
                )}
                
                {/* Message bubble */}
                <div className={`flex ${message.is_current_user ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      message.is_current_user 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border text-gray-800'
                    }`}
                  >
                    {!message.is_current_user && (
                      <p className="text-xs font-medium text-gray-600">
                        {message.sender_name}
                      </p>
                    )}
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 text-right ${
                      message.is_current_user ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation</p>
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage}
        className="bg-white p-4 border-t flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !isConnected}
          className="bg-blue-600 text-white rounded-full px-5 py-2 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
      
      {/* Connection status */}
      {!isConnected && (
        <div className="bg-yellow-100 text-yellow-800 text-xs text-center py-1">
          Connecting...
        </div>
      )}
    </div>
  )
} 