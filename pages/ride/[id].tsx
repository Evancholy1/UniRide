import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/AuthProvider'

export default function RideDetailsPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [ride, setRide] = useState<any>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [rideRatings, setRideRatings] = useState<any[]>([])
  const [passengers, setPassengers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!id || !user) return // ⛔ skip if id isn't ready yet or user not loaded
  
    const fetchData = async () => {
      const { data: rideData } = await supabase
        .from('rides')
        .select('*, users(name, email)')
        .eq('id', id)
        .single()
  
      setRide(rideData)
  
      if (!rideData) return
  
      // Check if current user has joined
      const { data: joined } = await supabase
        .from('ride_passengers')
        .select('*')
        .eq('ride_id', id)
        .eq('passenger_id', user.id)
        .maybeSingle()
  
      if (joined) setHasJoined(true)

      // Fetch all passengers for this ride
      const { data: passengersData } = await supabase
        .from('ride_passengers')
        .select(`
          passenger_id,
          users:passenger_id(id, name, email)
        `)
        .eq('ride_id', id)
      
      setPassengers(passengersData || [])

      // Fetch ratings for this ride if it's completed
      if (rideData.is_completed) {
        const { data: ratings } = await supabase
          .from('ratings')
          .select(`
            *,
            users:rater_id(id, name)
          `)
          .eq('ride_id', id)
          .order('created_at', { ascending: false })

        setRideRatings(ratings || [])
      }
      
      setLoading(false)
    }
  
    fetchData()
  }, [id, user])

  const refreshRide = async () => {
    const { data: updated } = await supabase
      .from('rides')
      .select('*, users(name, email)')
      .eq('id', id)
      .single()
    setRide(updated)

    // Refresh passengers
    const { data: passengersData } = await supabase
      .from('ride_passengers')
      .select(`
        passenger_id,
        users:passenger_id(id, name, email)
      `)
      .eq('ride_id', id)
    
    setPassengers(passengersData || [])

    // Refresh ratings if the ride is completed
    if (updated?.is_completed) {
      const { data: ratings } = await supabase
        .from('ratings')
        .select(`
          *,
          users:rater_id(id, name)
        `)
        .eq('ride_id', id)
        .order('created_at', { ascending: false })

      setRideRatings(ratings || [])
    }
  }

  const handleJoin = async () => {
    if (!user || !ride || ride.seats_left <= 0) return
  
    // 1. Add to passengers
    const { error: joinError } = await supabase.from('ride_passengers').insert({
      ride_id: ride.id,
      passenger_id: user.id,
    })
  
    if (joinError) {
      console.error('Join error:', joinError)
      return
    }
  
    // 2. Update ride with new seats count
    const newSeats = ride.seats_left - 1
  
    const { error: updateError } = await supabase
      .from('rides')
      .update({ seats_left: newSeats })
      .eq('id', ride.id)

    if (updateError) {
      console.error('Update error:', updateError)
    } else {
      await refreshRide()
      setHasJoined(true)
      
      // If no seats left, redirect to home page
      if (newSeats <= 0) {
        router.push('/')
      }
    }
  }

  // Function to start a chat with a user
  const startChat = async (otherUserId: string) => {
    if (!user) return;
    
    try {
      console.log('Starting chat with user:', otherUserId);
      console.log('Current user:', user.id);
      console.log('Ride ID:', id);
      
      // Create or get existing chat
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          otherUserId,
          rideId: id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Response not OK:', response.status, errorData);
        throw new Error('Failed to create chat: ' + (errorData.error || response.statusText));
      }
      
      const data = await response.json();
      console.log('Chat created/found:', data);
      
      // Navigate to the chat page
      router.push(`/messages/${data.id}`);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      alert('Could not start chat. Please try again. Error: ' + error.message);
    }
  };

  // Helper function to get category icon
  const getCategoryIcon = (cat?: string) => {
    switch(cat) {
      case 'Airport': return '✈️';
      case 'Outdoor Activity': return '🏔️';
      case 'Event': return '🎵';
      case 'Other':
      default: return '🚗';
    }
  };

  // Show loading while auth or ride data is loading
  if (authLoading || loading || !ride || !user) return <p>Loading...</p>

  const isDriver = ride.driver_id === user.id

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow space-y-4">
      <h1 className="text-2xl font-bold">🚗 Ride to {ride.destination}</h1>
      
      {ride.category && (
        <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
          {getCategoryIcon(ride.category)} {ride.category}
        </div>
      )}
      
      <p><strong>Date:</strong> {new Date(ride.date).toLocaleString()}</p>
      <p><strong>Seats Left:</strong> {ride.seats_left}</p>
      <p><strong>Description:</strong> {ride.ride_description}</p>
      <p><strong>Completed:</strong> {ride.is_completed ? '✅ Yes' : '❌ No'}</p>
      <div className="flex justify-between items-center">
        <p>
          <strong>Driver:</strong> {' '}
          <a 
            className="text-blue-600 hover:underline"
            href={`/profile/${ride.driver_id}`}
          >
            {ride.users?.name}
          </a> ({ride.users?.email})
        </p>
        
        {/* Message Driver Button */}
        {!isDriver && user && !ride.is_completed && (
          <button
            onClick={() => startChat(ride.driver_id)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-full text-sm flex items-center gap-1"
          >
            <span>💬</span> Message Driver
          </button>
        )}
      </div>

      {/* Passengers Section */}
      <div className="border-t pt-4 mt-4">
        <h2 className="text-lg font-semibold mb-2">
          🧍 Passengers ({passengers.length})
        </h2>
        
        {passengers.length > 0 ? (
          <ul className="space-y-2">
            {passengers.map((passenger) => (
              <li key={passenger.passenger_id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">•</span>
                  <a 
                    href={`/profile/${passenger.passenger_id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {passenger.users?.name}
                  </a>
                  <span className="text-gray-500 text-sm ml-2">
                    ({passenger.users?.email})
                  </span>
                </div>
                
                {/* Message Passenger Button */}
                {user && user.id !== passenger.passenger_id && !ride.is_completed && (
                  <button
                    onClick={() => startChat(passenger.passenger_id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1"
                  >
                    <span>💬</span> Message
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No passengers have joined this ride yet.</p>
        )}
      </div>

      {/* Join Ride */}
      {!isDriver && !hasJoined && ride.seats_left > 0 && !ride.is_completed && (
        <button
          onClick={handleJoin}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          🚗 Join Ride
        </button>
      )}

      {hasJoined && !isDriver && (
        <p className="text-green-600 font-medium">✅ You've joined this ride</p>
      )}

      {/* Ratings & Reviews Section */}
      {ride.is_completed && rideRatings.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">
            ⭐ Ratings & Reviews ({rideRatings.length})
          </h3>
          
          <ul className="space-y-4">
            {rideRatings.map((rating: any) => (
              <li key={rating.id} className="border-b pb-4">
                <div className="flex justify-between">
                  <div>
                    <a 
                      href={`/profile/${rating.rater_id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {rating.users.name}
                    </a>
                  </div>
                  <div className="text-yellow-500 font-bold">
                    {rating.score} ⭐
                  </div>
                </div>
                
                {rating.comment && (
                  <div className="mt-2 italic">
                    "{rating.comment}"
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(rating.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Note about ride management */}
      {(isDriver || hasJoined) && (
        <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 border mt-6">
          <p>⚠️ To manage this ride (mark as complete or rate), please visit the <a href="/my_rides" className="text-blue-600 hover:underline">My Rides</a> page.</p>
        </div>
      )}
    </div>
  )
}
