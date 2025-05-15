import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { HoverEffect } from '@/components/UI/hoverCardGrid'
import { Input } from '@/components/UI/input'

interface _RideFromDB {
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
  verified?: boolean
}

export async function getServerSideProps() {
  const { data: rides, error } = await supabase
    .from('rides')
    .select(`
      *,
      driver:driver_id(name, verified)
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
    verified: ride.driver?.verified || false,
    notes: ride.ride_description,
    category: ride.category || 'Other'
  }))

  return { props: { rides: transformedRides } }
}

export default function HomePage({ rides: initialRides }: { rides: TransformedRide[] }) {
  const [rides, setRides] = useState<TransformedRide[]>(initialRides)
  const [filteredRides, setFilteredRides] = useState<TransformedRide[]>(initialRides)
  const [searchQuery, setSearchQuery] = useState('')
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
          driver:driver_id(name, verified)
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

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRides(rides)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = rides.filter(ride => 
      ride.destination.toLowerCase().includes(query) ||
      ride.driver.toLowerCase().includes(query) ||
      ride.category.toLowerCase().includes(query)
    )
    setFilteredRides(filtered)
  }, [searchQuery, rides])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateRide = () => {
    router.push('/rideForm')
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">🎿 Find a Ride</h1>
  
        <div className="text-right text-sm space-y-1">
          <p className="text-gray-300">Welcome, {userEmail}</p>
        </div>
      </div>
  
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by destination, driver, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
      </div>
  
      <div className="bg-gray-800/30 p-6 rounded-xl shadow-lg border border-gray-700">
        {filteredRides.length > 0 ? (
          <div className="w-full mx-auto">
            <HoverEffect
              items={filteredRides.map((ride) => ({
                id: ride.id,
                destination: ride.destination,
                date: ride.date,
                driver: ride.driver,           // ✅ already a string
                seats_left: ride.seats_left,
                notes: ride.notes,
                category: ride.category,
                verified: ride.verified,       // ✅ this is the actual field
                link: `/ride/${ride.id}`,
              }))}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-300">
              {searchQuery ? 'No rides match your search.' : 'No rides available at the moment.'}
            </p>
            <button
              onClick={handleCreateRide}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors duration-200 mt-4"
            >
              Be the first to create a ride!
            </button>
          </div>
        )}
      </div>
    </div>
  )  
}
