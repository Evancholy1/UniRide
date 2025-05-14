import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { HoverEffect } from '@/components/hoverCardGrid'
import RideCard from '@/components/RideCard'

interface RideFromDB {
  id: string
  destination: string
  date: string
  seats_left: number
  driver_id: string
  ride_description: string
  category: string
  driver: {
    name: string
  }
}

interface TransformedRide {
  id: string
  destination: string
  date: string
  seats_left: number
  driver: string
  notes: string
  category: string
}

export async function getServerSideProps() {
  const { data: rides, error } = await supabase
    .from('rides')
    .select(`
      *,
      driver:driver_id(name)
    `)
    .gte('seats_left', 1)
    .eq('is_completed', false)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching rides:', error.message)
    return { props: { rides: [] } }
  }

  const transformedRides = (rides ?? []).map(ride => ({
    id: ride.id,
    destination: ride.destination,
    date: ride.date,
    seats_left: ride.seats_left,
    driver: ride.driver?.name || 'Unknown',
    notes: ride.ride_description,
    category: ride.category || 'Other'
  }))

  return { props: { rides: transformedRides } }
}

export default function HomePage({ rides: initialRides }: { rides: TransformedRide[] }) {
  const [rides, setRides] = useState<TransformedRide[]>(initialRides)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUserAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUserEmail(session.user.email ?? null)
      setUserId(session.user.id)

      const { data: rides, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id(name)
        `)
        .gte('seats_left', 1)
        .eq('is_completed', false)
        .order('date', { ascending: true })

      if (error) {
        console.error('Failed to fetch rides:', error.message)
      } else {
        const transformedRides = (rides ?? []).map(ride => ({
          id: ride.id,
          destination: ride.destination,
          date: ride.date,
          seats_left: ride.seats_left,
          driver: ride.driver?.name || 'Unknown',
          notes: ride.ride_description,
          category: ride.category || 'Other'
        }))
        setRides(transformedRides)
      }

      setLoading(false)
    }

    checkUserAndLoad()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateRide = () => {
    router.push('/rideForm')
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">🎿 Find a Ride</h1>
        <h2 className="text-4xl text-red-500 font-bold">Tailwind is working!</h2>

        <div className="text-right text-sm space-y-1">
  <p>Welcome, {userEmail}</p>
  
    <div className="flex gap-2 flex-wrap justify-end">
        <button
          onClick={() => router.push('/my_rides')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-4 rounded border shadow-sm transition"
        >
          My Rides
        </button>

        <button
          onClick={() => userId && router.push(`/profile/${userId}`)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-4 rounded border shadow-sm transition"
        >
          Profile
        </button>

        <button
          onClick={handleCreateRide}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded shadow-sm transition"
        >
          + Create Ride
        </button>

        <button
          onClick={handleLogout}
          className="text-red-600 underline hover:text-red-800"
        >
          Log out
        </button>
            </div>
        </div>
      </div>

      {rides.length > 0 ? (
        <div className="max-w-6xl mx-auto">
          <HoverEffect
              items={rides.map(ride => ({
                ...ride,
                link: `/ride/${ride.id}` // dynamic route
              }))}

            />
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No rides available at the moment.</p>
          <button
            onClick={handleCreateRide}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors duration-200 flex items-center"
          >
            Be the first to create a ride!
          </button>
        </div>
      )}
    </div>
  )
}
