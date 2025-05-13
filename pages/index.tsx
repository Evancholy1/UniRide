import { supabase } from '@/lib/supabaseClient'
import RideCard from '@/components/RideCard'
import { useRouter } from 'next/router'

interface RideFromDB {
  id: string
  destination: string
  date: string
  seats_left: number
  driver_id: string
  ride_description: string
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
}

export async function getServerSideProps() {
  const { data: rides, error } = await supabase
    .from('rides')
    .select(`
      *,
      driver:driver_id(name)
    `)
    .order('date', { ascending: true })

  if (error) {
    console.error('Supabase error:', error.message)
    return { props: { rides: [] } }
  }

  // Transform the data to match the RideCard props
  const transformedRides = (rides ?? []).map(ride => ({
    id: ride.id,
    destination: ride.destination,
    date: ride.date,
    seats_left: ride.seats_left,
    driver: ride.driver.name,
    notes: ride.ride_description
  }))

  return { props: { rides: transformedRides } }
}

export default function HomePage({ rides }: { rides: TransformedRide[] }) {
  const router = useRouter();

  const handleCreateRide = () => {
    router.push('/rideForm');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🚗 Find a Ride</h1>
        <button
          onClick={handleCreateRide}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors duration-200 flex items-center"
        >
          <span className="mr-2">+</span> Create Ride
        </button>
      </div>

      {rides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rides.map((ride) => (
            <RideCard 
              key={ride.id}
              id={ride.id}
              destination={ride.destination}
              date={ride.date}
              driver={ride.driver}
              seats_left={ride.seats_left}
              notes={ride.notes}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No rides available at the moment.</p>
          <button
            onClick={handleCreateRide}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Be the first to create a ride!
          </button>
        </div>
      )}
    </div>
  )
}
