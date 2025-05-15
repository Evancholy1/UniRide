import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function RideDetailsPage() {
  const router = useRouter()
  const { id } = router.query

  const [ride, setRide] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [rideRatings, setRideRatings] = useState<any[]>([])
  const [passengers, setPassengers] = useState<any[]>([])
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [ratingError, setRatingError] = useState('')
  const [submittedRating, setSubmittedRating] = useState(false)

  useEffect(() => {
    if (!id) return // ⛔ skip if id isn't ready yet
  
    const fetchData = async () => {
      const { data: session } = await supabase.auth.getUser()
      const currentUser = session.user
      setUser(currentUser)
  
      const { data: rideData } = await supabase
        .from('rides')
        .select('*, users(name, email)')
        .eq('id', id)
        .single()
  
      setRide(rideData)
  
      if (!currentUser || !rideData) return
  
      // Check if current user has joined
      const { data: joined } = await supabase
        .from('ride_passengers')
        .select('*')
        .eq('ride_id', id)
        .eq('passenger_id', currentUser.id)
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
  
        // Check if the current user has already submitted a rating
        const userRating = ratings?.find((rating: any) => rating.rater_id === currentUser.id)
        if (userRating) {
          setSubmittedRating(true)
        }
      }
    }
  
    fetchData()
  }, [id])

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

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRatingError('')

    if (!user || !ride) return

    try {
    const { error } = await supabase.from('ratings').insert({
      ride_id: ride.id,
      driver_id: ride.driver_id,
      rater_id: user.id,
      score,
      comment,
    })

    if (error) {
        console.error('Rating error:', error)
        setRatingError(error.message)
    } else {
      setSubmittedRating(true)
        await refreshRide() // Refresh ride data to show the new rating
      }
    } catch (err: any) {
      console.error('Error submitting rating:', err)
      setRatingError(err.message)
    }
  }

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

  if (!ride || !user) return <p>Loading...</p>

  const isDriver = ride.driver_id === user.id

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-800 rounded shadow space-y-4">
      {/* Centered warning at the top */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-700 p-3 rounded text-sm text-gray-200 border border-gray-600 text-center max-w-lg">
          ⚠️ To manage this ride (mark as complete or rate), please visit the <a href="/my_rides" className="text-blue-400 hover:underline">My Rides</a> page.
        </div>
      </div>
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
      <p>
        <strong>Driver:</strong> {' '}
        <a 
          className="text-blue-600 hover:underline"
          href={`/profile/${ride.driver_id}`}
        >
          {ride.users?.name}
        </a> ({ride.users?.email})
      </p>

      {/* Passengers Section */}
      <div className="border-t pt-4 mt-4">
        <h2 className="text-lg font-semibold mb-2">
          🧍 Passengers ({passengers.length})
        </h2>
        
        {passengers.length > 0 ? (
          <ul className="space-y-2">
            {passengers.map((passenger) => (
              <li key={passenger.passenger_id} className="flex items-center">
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

      {/* Show all reviews for a completed ride */}
      {ride.is_completed && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Reviews for this ride</h3>
          {rideRatings.length > 0 ? (
            <ul className="space-y-4">
              {rideRatings.map((rating) => (
                <li key={rating.id} className="bg-gray-700 rounded p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{rating.users?.name || 'User'}</span>
                    <span className="text-yellow-400">{rating.score} ⭐</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(rating.created_at).toLocaleString()}</span>
                  </div>
                  {rating.comment && (
                    <div className="text-gray-200 italic">"{rating.comment}"</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic">No reviews for this ride yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
