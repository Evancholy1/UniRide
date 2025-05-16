import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function ProfilePage() {
  const router = useRouter()
  const { id } = router.query

  const [user, setUser] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [completedRides, setCompletedRides] = useState<any[]>([])
  const [userReviews, setUserReviews] = useState<any[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [authUserId, setAuthUserId] = useState<string | null>(null)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthUserId(session?.user?.id || null)
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!id && !authUserId) return;
    setLoading(true);
    const fetchProfileData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const sessionUser = session.user;
      setCurrentUser(sessionUser);
      let profileId = id;
      if (id === 'me') {
        profileId = sessionUser.id;
      }
      // USERS TABLE
      let userData;
      let userError;
      {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', profileId)
          .single();
        userData = data;
        userError = error;
      }
      if (!userData) {
        const { data: newUser } = await supabase
          .from('users')
          .insert([{ id: profileId, email: sessionUser.email, name: sessionUser.user_metadata?.full_name || '' }])
          .select()
          .single();
        setUser(newUser);
      } else {
        setUser(userData);
      }
      // PROFILES TABLE
      let profileData;
      let profileError;
      {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        profileData = data;
        profileError = error;
      }
      if (!profileData) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ id: profileId, email: sessionUser.email, name: sessionUser.user_metadata?.full_name || '' }])
          .select()
          .single();
        setProfile(newProfile);
      } else {
        setProfile(profileData);
      }

      try {
        // Get user's completed rides as a driver - use simpler query first
        const { data: driverRides, error: driverError } = await supabase
          .from('rides')
          .select('*')
          .eq('driver_id', profileId)
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
          .eq('rater_id', profileId)
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
          .eq('driver_id', profileId)

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
  }, [id, authUserId])

  if (loading) return <p className="text-center mt-10">Loading profile...</p>

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
  {profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt="Profile"
      className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
    />
  ) : (
    <span className="text-4xl">👤</span>
  )}
    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
    {user.name || 'User'}
    {user.verified && (
      <span
        title="Verified Student"
        className="text-green-400 text-sm font-medium px-2 py-1 bg-green-900 rounded-full"
      >
        ✅ Verified Student
      </span>
          )}
      </h1>
        </div>


      {/* User Info */}
      <div className="bg-gray-800 rounded shadow p-6 text-white">
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
            <span className="text-gray-400 italic">No ratings yet</span>
          )}
        </div>
      </div>

      {/* Completed Rides */}
      <div className="bg-gray-800 p-4 rounded shadow text-white">
        <h2 className="text-xl font-semibold mb-3">Completed Rides</h2>
        {completedRides.length > 0 ? (
          <ul className="space-y-3">
            {completedRides.map((ride) => (
              <li 
                key={ride.id}
                className="p-4 border border-gray-700 rounded bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
                onClick={() => router.push(`/ride/${ride.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">To {ride.destination}</div>
                    <div className="text-sm text-gray-300">
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
                  <span className="text-gray-400">
                    {ride.ratings?.length || 0} {ride.ratings?.length === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic">No completed rides yet.</p>
        )}
      </div>

      {/* Reviews Made */}
      <div className="bg-gray-800 p-4 rounded shadow text-white">
        <h2 className="text-xl font-semibold mb-3">Reviews on Other Rides</h2>
        {userReviews.length > 0 ? (
          <ul className="space-y-3">
            {userReviews.map((review) => (
              <li
                key={review.id}
                className="p-4 border border-gray-700 rounded bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
                onClick={() => router.push(`/ride/${review.ride_id}`)}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">
                      Ride to {review.rides.destination}
                    </div>
                    <div className="text-sm text-gray-300">
                      Driver: {review.rides.users.name}
                    </div>
                    <div className="text-sm text-gray-300">
                      {new Date(review.rides.date).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-yellow-500 font-bold">
                    {review.score} ⭐
                  </div>
                </div>
                {review.comment && (
                  <div className="mt-2 italic text-gray-300 border-t border-gray-700 pt-2">
                    "{review.comment}"
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  Posted on {new Date(review.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic">No reviews made yet.</p>
        )}
      </div>
    </div>
  )
}
