import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function MyRidesPage() {
  const [user, setUser] = useState<any>(null)
  const [driving, setDriving] = useState<any[]>([])
  const [joined, setJoined] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDriving, setShowDriving] = useState(true)
  const [showJoined, setShowJoined] = useState(true)

  const router = useRouter()

  useEffect(() => {
    const fetchRides = async () => {
      const { data: session } = await supabase.auth.getUser()
      const currentUser = session.user
      setUser(currentUser)

      if (!currentUser) {
        router.push('/login')
        return
      }

      const { data: drivingRides } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', currentUser.id)
      setDriving(drivingRides || [])

      const { data: links } = await supabase
        .from('ride_passengers')
        .select('ride_id')
        .eq('passenger_id', currentUser.id)

      const rideIds = links?.map(r => r.ride_id) || []

      if (rideIds.length > 0) {
        const { data: joinedRides } = await supabase
          .from('rides')
          .select('*')
          .in('id', rideIds)

        setJoined(joinedRides || [])
      }

      setLoading(false)
    }

    fetchRides()
  }, [])

  if (loading) return <p className="text-center mt-10">Loading your rides...</p>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">🚘 My Rides</h1>

      {/* Driving section */}
      <div className="bg-gray-800 p-4 rounded shadow">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowDriving(!showDriving)}
        >
          <h2 className="text-xl font-semibold">🧑‍✈️ Rides You're Driving</h2>
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
                  <div className="font-medium">To {ride.destination}</div>
                  <div className="text-sm text-gray-300">
                    {new Date(ride.date).toLocaleString()}
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500 mt-2">No rides posted yet.</p>
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
          <h2 className="text-xl font-semibold">🧍 Rides You've Joined</h2>
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
                  <div className="font-medium">To {ride.destination}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(ride.date).toLocaleString()}
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500 mt-2">No rides joined yet.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
