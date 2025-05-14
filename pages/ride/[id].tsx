import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function RideDetailsPage() {
  const router = useRouter()
  const { id } = router.query
  const [ride, setRide] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchRide = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*, users ( name, email )') // join with user info if foreign key exists
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching ride:', error)
      } else {
        setRide(data)
      }

      setLoading(false)
    }

    fetchRide()
  }, [id])

  if (loading) return <p className="text-center mt-10">Loading ride details...</p>
  if (!ride) return <p className="text-center mt-10">Ride not found.</p>

  const formattedDate = new Date(ride.date).toLocaleString()

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-xl shadow-md p-6 space-y-4">
      <h1 className="text-3xl font-bold text-blue-700">🚗 Trip to {ride.destination}</h1>

      <div className="flex justify-between text-gray-600">
        <p><strong>🗓️ Date:</strong> {formattedDate}</p>
        <p><strong>🪑 Seats left:</strong> {ride.seats_left}</p>
      </div>

      <div className="bg-gray-100 rounded p-4">
        <p className="text-gray-700 whitespace-pre-wrap">{ride.ride_description || 'No description provided.'}</p>
      </div>

      <div className="border-t pt-4">
        <h2 className="text-xl font-semibold mb-1">Driver</h2>
        <p className="text-gray-800">{ride.users?.name || 'Unknown'}</p>
        <p className="text-blue-600 underline">{ride.users?.email}</p>
      </div>

      <button
        onClick={() => alert('Messaging not yet implemented.')}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        💬 Message Driver
      </button>
    </div>
  )
}
