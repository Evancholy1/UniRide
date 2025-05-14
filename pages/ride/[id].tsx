import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function RideDetailsPage() {
  const router = useRouter()
  const { id } = router.query

  const [ride, setRide] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [submittedRating, setSubmittedRating] = useState(false)
  const [rideRatings, setRideRatings] = useState<any[]>([])

  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [ratingError, setRatingError] = useState('')

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
  
      const { data: joined } = await supabase
        .from('ride_passengers')
        .select('*')
        .eq('ride_id', id)
        .eq('passenger_id', currentUser.id)
        .maybeSingle()
  
      if (joined) setHasJoined(true)
  
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('*')
        .eq('ride_id', id)
        .eq('rater_id', currentUser.id)
        .maybeSingle()
  
      if (existingRating) setSubmittedRating(true)

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

  const handleComplete = async () => {
    const { error } = await supabase
      .from('rides')
      .update({ is_completed: true })
      .eq('id', id)

    if (error) {
      alert('Failed to mark ride as completed. Please try again.')
    } else {
      refreshRide()
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

    if (!user) return

    const { error } = await supabase.from('ratings').insert({
      ride_id: ride.id,
      driver_id: ride.driver_id,
      rater_id: user.id,
      score,
      comment,
    })

    if (error) {
      console.error(error)
      setRatingError('Error submitting rating.')
    } else {
      setSubmittedRating(true)
      refreshRide()
    }
  }

  if (!ride || !user) return <p>Loading...</p>

  const isDriver = ride.driver_id === user.id

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow space-y-4">
      <h1 className="text-2xl font-bold">🚗 Ride to {ride.destination}</h1>
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

      {/* Mark complete */}
      {isDriver && !ride.is_completed && (
        <button
          onClick={handleComplete}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          ✅ Mark as Completed
        </button>
      )}

      {/* Join Ride */}
      {!isDriver && !hasJoined && ride.seats_left > 0 && (
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

      {/* Rating form */}
      {!isDriver && ride.is_completed && !submittedRating && (
        <form onSubmit={handleRatingSubmit} className="mt-6 space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold">Rate this ride</h3>
          {ratingError && <p className="text-red-500 text-sm">{ratingError}</p>}

          <label className="block">
            <span className="text-sm text-gray-700">Rating (1–5)</span>
            <select
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="mt-1 block w-full border rounded p-2"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-700">Comment (optional)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 block w-full border rounded p-2"
              placeholder="Any feedback?"
            />
          </label>

          <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Submit Rating
          </button>
        </form>
      )}

      {submittedRating && !isDriver && (
        <p className="mt-4 text-green-600 font-medium">✅ You rated this ride</p>
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
    </div>
  )
}
