import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function MyRidesPage() {
  const [user, setUser] = useState<any>(null)
  const [driving, setDriving] = useState<any[]>([])
  const [joined, setJoined] = useState<any[]>([])
  const [completedRides, setCompletedRides] = useState<any[]>([])
  const [ridesToRate, setRidesToRate] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDriving, setShowDriving] = useState(true)
  const [showJoined, setShowJoined] = useState(true)
  const [showRidesToRate, setShowRidesToRate] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  const [currentRideToRate, setCurrentRideToRate] = useState<any>(null)
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [ratingError, setRatingError] = useState('')

  const router = useRouter()

    const fetchRides = async () => {
      const { data: session } = await supabase.auth.getUser()
      const currentUser = session.user
      setUser(currentUser)

      if (!currentUser) {
        router.push('/login')
        return
      }

    // Get all driving rides
      const { data: drivingRides } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', currentUser.id)
      .eq('is_completed', false)
      setDriving(drivingRides || [])

    // Get completed rides you're driving
    const { data: completedDrivingRides } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', currentUser.id)
      .eq('is_completed', true)

    // Get passenger links
      const { data: links } = await supabase
        .from('ride_passengers')
        .select('ride_id')
        .eq('passenger_id', currentUser.id)

      const rideIds = links?.map(r => r.ride_id) || []

    // Get all joined rides (not completed)
      if (rideIds.length > 0) {
        const { data: joinedRides } = await supabase
          .from('rides')
          .select('*')
          .in('id', rideIds)
        .eq('is_completed', false)

        setJoined(joinedRides || [])

      // Get completed rides that need rating
      const { data: completedJoinedRides } = await supabase
        .from('rides')
        .select('*')
        .in('id', rideIds)
        .eq('is_completed', true)

      if (completedJoinedRides && completedJoinedRides.length > 0) {
        // Check which rides user has already rated
        const rideRatings = await Promise.all(
          completedJoinedRides.map(async (ride) => {
            const { data: rating } = await supabase
              .from('ratings')
              .select('*')
              .eq('ride_id', ride.id)
              .eq('rater_id', currentUser.id)
              .maybeSingle()
            
            return { ride, hasRating: !!rating }
          })
        )

        // Split into rides to rate and completed rides
        const toRate = rideRatings.filter(item => !item.hasRating).map(item => item.ride)
        const rated = rideRatings.filter(item => item.hasRating).map(item => item.ride)
        
        setRidesToRate(toRate)
        setCompletedRides([...(completedDrivingRides || []), ...rated])
      } else {
        setCompletedRides(completedDrivingRides || [])
      }
    } else {
      setCompletedRides(completedDrivingRides || [])
      }

      setLoading(false)
    }

  useEffect(() => {
    fetchRides()
  }, [])

  const handleComplete = async (rideId: string) => {
    const { error } = await supabase
      .from('rides')
      .update({ is_completed: true })
      .eq('id', rideId)

    if (!error) {
      await fetchRides() // Refresh all ride data
    }
  }

  const openRatingForm = (ride: any) => {
    setCurrentRideToRate(ride)
    setScore(5)
    setComment('')
    setRatingError('')
  }

  const closeRatingForm = () => {
    setCurrentRideToRate(null)
  }

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRatingError('')

    if (!user || !currentRideToRate) return

    const { error } = await supabase.from('ratings').insert({
      ride_id: currentRideToRate.id,
      driver_id: currentRideToRate.driver_id,
      rater_id: user.id,
      score,
      comment,
    })

    if (error) {
      console.error(error)
      setRatingError('Error submitting rating.')
    } else {
      closeRatingForm()
      await fetchRides() // Refresh all ride data
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

  if (loading) return <p className="text-center mt-10">Loading your rides...</p>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4"> My Rides</h1>

      {/* Driving section */}
      <div className="bg-gray-800 p-4 rounded shadow">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowDriving(!showDriving)}
        >
          <h2 className="text-xl font-semibold"> Driving</h2>
          <span className="text-blue-600 text-sm">
            {showDriving ? 'Hide' : 'Show'}
          </span>
        </div>
        {showDriving && (
          <ul className="mt-3 space-y-2">
            {driving.length > 0 ? (
              driving.map((ride) => (
                <li
                  key={ride.id}
                   className="p-4 border border-gray-700 rounded bg-gray-800 hover:bg-gray-700 text-white transition"
                >
                  <div className="cursor-pointer" onClick={() => router.push(`/ride/${ride.id}`)}>
                    <div className="flex justify-between items-center">
                  <div className="font-medium">To {ride.destination}</div>
                      {ride.category && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {getCategoryIcon(ride.category)} {ride.category}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300">
                    {new Date(ride.date).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-400 mt-2">No active rides posted.</p>
            )}
          </ul>
        )}
      </div>

      {/* Joined section */}
      <div className="bg-gray-800 p-4 rounded shadow">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowJoined(!showJoined)}
        >
          <h2 className="text-xl font-semibold"> Joined Rides</h2>
          <span className="text-blue-600 text-sm">
            {showJoined ? 'Hide' : 'Show'}
          </span>
        </div>
        {showJoined && (
          <ul className="mt-3 space-y-2">
            {joined.length > 0 ? (
              joined.map((ride) => (
                <li
                  key={ride.id}
                   className="p-4 border border-gray-700 rounded bg-gray-800 hover:bg-gray-700 text-white transition"
                >
                  <div className="cursor-pointer" onClick={() => router.push(`/ride/${ride.id}`)}>
                    <div className="flex justify-between items-center">
                      <div className="font-medium">To {ride.destination}</div>
                      {ride.category && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {getCategoryIcon(ride.category)} {ride.category}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300">
                      {new Date(ride.date).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-400 mt-2">No active rides joined.</p>
            )}
          </ul>
        )}
      </div>

      {/* Rides to Rate section */}
      <div className="bg-gray-800 p-4 rounded shadow">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowRidesToRate(!showRidesToRate)}
        >
          <h2 className="text-xl font-semibold">⭐ Rides to Rate</h2>
          <span className="text-blue-600 text-sm">
            {showRidesToRate ? 'Hide' : 'Show'}
          </span>
        </div>
        {showRidesToRate && (
          <ul className="mt-3 space-y-2">
            {ridesToRate.length > 0 ? (
              ridesToRate.map((ride) => (
                <li
                  key={ride.id}
                  className="p-4 border border-gray-700 rounded bg-gray-800 hover:bg-gray-700 text-white transition"
                >
                  <div className="cursor-pointer" onClick={() => router.push(`/ride/${ride.id}`)}>
                    <div className="flex justify-between items-center">
                      <div className="font-medium">To {ride.destination}</div>
                      {ride.category && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {getCategoryIcon(ride.category)} {ride.category}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300">
                      {new Date(ride.date).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => openRatingForm(ride)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      ⭐ Rate This Ride
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-400 mt-2">No rides to rate.</p>
            )}
          </ul>
        )}
      </div>

      {/* Completed Rides section */}
      <div className="bg-gray-800 p-4 rounded shadow">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowCompleted(!showCompleted)}
        >
          <h2 className="text-xl font-semibold">✅ Completed Rides</h2>
          <span className="text-blue-600 text-sm">
            {showCompleted ? 'Hide' : 'Show'}
          </span>
        </div>
        {showCompleted && (
          <ul className="mt-3 space-y-2">
            {completedRides.length > 0 ? (
              completedRides.map((ride) => (
                <li
                  key={ride.id}
                  className="p-4 border border-gray-700 rounded bg-gray-800 hover:bg-gray-700 text-white transition"
                >
                  <div className="cursor-pointer" onClick={() => router.push(`/ride/${ride.id}`)}>
                    <div className="flex justify-between items-center">
                  <div className="font-medium">To {ride.destination}</div>
                      {ride.category && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {getCategoryIcon(ride.category)} {ride.category}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300">
                    {new Date(ride.date).toLocaleString()}
                    </div>
                    <div className="text-green-600 text-sm font-medium mt-1">
                      ✅ Completed
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-400 mt-2">No completed rides.</p>
            )}
          </ul>
        )}
      </div>

      {/* Rating Modal */}
      {currentRideToRate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-white">Rate your ride to {currentRideToRate.destination}</h3>
            
            {ratingError && <p className="text-red-500 text-sm mb-3">{ratingError}</p>}
            
            <form onSubmit={handleRatingSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-300">Rating (1–5)</span>
                <select
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="mt-1 block w-full border border-gray-600 bg-gray-700 text-white rounded p-2"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-300">Comment (optional)</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1 block w-full border border-gray-600 bg-gray-700 text-white rounded p-2"
                  placeholder="Any feedback?"
                />
              </label>

              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={closeRatingForm}
                  className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
