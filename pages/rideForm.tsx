import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function CreateRidePage() {
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [seats, setSeats] = useState(1)
  const [notes, setNotes] = useState('')
  const [category, setCategory] = useState('Other')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user || userError) {
      setError('User not found. Please log in.')
      return
    }

    console.log('Attempting ride insert with driver ID:', user.id)


    const { error: insertError } = await supabase.from('rides').insert({
      destination,
      date,
      seats_left: seats,
      ride_description: notes,
      driver_id: user.id, // ✅ foreign key to users table
      category, // Add the category field
    })

    if (insertError) {
      console.error(insertError)
      setError('Failed to create ride. Check your fields and try again.')
    } else {
      router.push('/') // redirect to homepage
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-12 bg-gray-800 p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">🚗 Post a New Ride</h1>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Destination (e.g., Eldora)"
          className="w-full border p-2 rounded"
          value={destination}
          onChange={e => setDestination(e.target.value)}
          required
        />

        <input
          type="datetime-local"
          className="w-full border p-2 rounded"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />

        <select
          className="w-full border p-2 rounded"
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
        >
          <option value="Airport">Airport</option>
          <option value="Outdoor Activity">Outdoor Activity</option>
          <option value="Event">Event</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="number"
          min={1}
          placeholder="Seats available"
          className="w-full border p-2 rounded"
          value={seats}
          onChange={e => setSeats(Number(e.target.value))}
          required
        />

        <textarea
          placeholder="Notes (gear, car type, etc.)"
          className="w-full border p-2 rounded"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />


        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
          Create Ride
        </button>
      </form>
    </div>
  )
}
