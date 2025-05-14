import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function ProfilePage() {
  const router = useRouter()
  const { id } = router.query

  const [user, setUser] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [completedRides, setCompletedRides] = useState<any[]>([])
  const [userReviews, setUserReviews] = useState<any[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchProfileData = async () => {
      // Get current logged in user
      const { data: sessionData } = await supabase.auth.getUser()
      setCurrentUser(sessionData.user)

      // Get profile user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (userError || !userData) {
        console.error('Error fetching user:', userError)
        router.push('/')
        return
      }

      setUser(userData)

      try {
        // Get user's completed rides as a driver - use simpler query first
        const { data: driverRides, error: driverError } = await supabase
          .from('rides')
          .select('*')
          .eq('driver_id', id)
          .eq('is_completed', true)

        if (driverError) {
          console.error('Error fetching driver rides:', driverError)
        }

        // Then get ratings for each ride if we have completed rides
        let ridesWithRatings = []
        if (driverRides && driverRides.length > 0) {
          ridesWithRatings = await Promise.all(
            driverRides.map(async (ride) => {
              // Get ratings for this specific ride
              const { data: ratings } = await supabase
                .from('ratings')
                .select('*, users:rater_id(id, name)')
                .eq('ride_id', ride.id)

              // Calculate average rating
              const validRatings = ratings || []
              const avgRating = validRatings.length > 0
                ? validRatings.reduce((sum, r) => sum + r.score, 0) / validRatings.length
                : null

              return {
                ...ride,
                ratings: validRatings,
                average_rating: avgRating ? parseFloat(avgRating.toFixed(1)) : null
              }
            })
          )
        }

        setCompletedRides(ridesWithRatings)

        // Get user's reviews on other rides - use a simpler query
        const { data: myReviews, error: reviewsError } = await supabase
          .from('ratings')
          .select('*')
          .eq('rater_id', id)
          .order('created_at', { ascending: false })

        if (reviewsError) {
          console.error('Error fetching user reviews:', reviewsError)
        }

        // Get ride details for each review
        if (myReviews && myReviews.length > 0) {
          const reviewsWithDetails = await Promise.all(
            myReviews.map(async (review) => {
              const { data: rideData } = await supabase
                .from('rides')
                .select('destination, date, driver_id, users:driver_id(name)')
                .eq('id', review.ride_id)
                .single()

              return {
                ...review,
                rides: rideData || { destination: 'Unknown', date: null }
              }
            })
          )
          setUserReviews(reviewsWithDetails)
        } else {
          setUserReviews([])
        }

        // Calculate user's average rating as a driver
        const { data: allRatings, error: ratingsError } = await supabase
          .from('ratings')
          .select('score')
          .eq('driver_id', id)

        if (ratingsError) {
          console.error('Error fetching ratings:', ratingsError)
        } else if (allRatings && allRatings.length > 0) {
          const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length
          setAverageRating(parseFloat(avg.toFixed(1)))
        }

        setLoading(false)
      } catch (error) {
        console.error('Error processing profile data:', error)
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [id])

  if (loading) return <p className="text-center mt-10">Loading profile...</p>

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold mb-4">👤 {user.name}'s Profile</h1>
        {currentUser && currentUser.id === id && (
          <button
            className="text-blue-600 text-sm"
            onClick={() => router.push('/')}
          >
            Back to Homepage
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <div className="mt-3">
          <strong>Average Rating:</strong> {' '}
          {averageRating ? (
            <span className="text-yellow-500 font-bold">
              {averageRating} ⭐
            </span>
          ) : (
            <span className="text-gray-500 italic">No ratings yet</span>
          )}
        </div>
      </div>

      {/* Completed Rides */}
      <div className="bg-gray-50 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Completed Rides</h2>
        {completedRides.length > 0 ? (
          <ul className="space-y-3">
            {completedRides.map((ride) => (
              <li 
                key={ride.id}
                className="p-4 border rounded bg-white hover:bg-gray-50 transition cursor-pointer"
                onClick={() => router.push(`/ride/${ride.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">To {ride.destination}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(ride.date).toLocaleString()}
                    </div>
                    <div className="text-green-600 text-sm font-medium mt-1">
                      ✅ Completed
                    </div>
                  </div>
                  <div>
                    {ride.average_rating ? (
                      <div className="text-yellow-500 font-bold">
                        {ride.average_rating} ⭐
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm italic">No ratings</div>
                    )}
                  </div>
                </div>
                <div className="text-sm mt-1">
                  <span className="text-gray-500">
                    {ride.ratings?.length || 0} {ride.ratings?.length === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No completed rides yet.</p>
        )}
      </div>

      {/* Reviews Made */}
      <div className="bg-gray-50 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Reviews on Other Rides</h2>
        {userReviews.length > 0 ? (
          <ul className="space-y-3">
            {userReviews.map((review) => (
              <li
                key={review.id}
                className="p-4 border rounded bg-white hover:bg-gray-50 transition cursor-pointer"
                onClick={() => router.push(`/ride/${review.ride_id}`)}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">
                      Ride to {review.rides.destination}
                    </div>
                    <div className="text-sm text-gray-600">
                      Driver: {review.rides.users.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(review.rides.date).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-yellow-500 font-bold">
                    {review.score} ⭐
                  </div>
                </div>
                {review.comment && (
                  <div className="mt-2 italic text-gray-700 border-t pt-2">
                    "{review.comment}"
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Posted on {new Date(review.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No reviews made yet.</p>
        )}
      </div>
    </div>
  )
}
