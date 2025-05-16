'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { AutocompleteInput } from '@/components/AutocompleteInput'

export default function CreateRidePage() {
  const [title, setTitle] = useState('')                   // maps to `destination`
  const [startingLocation, setStartingLocation] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('Other')
  const [seats, setSeats] = useState(1)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) {
      setError('You must be logged in to post a ride.')
      return
    }

    const { error: insertError } = await supabase
      .from('rides')
      .insert({
        destination: title,               // destination column
        starting_location: startingLocation,
        destination_address: destinationAddress,
        date,
        category,
        seats_left: seats,
        ride_description: notes,
        driver_id: user.id,
      })

    if (insertError) {
      console.error(insertError)
      setError('Failed to create ride—please try again.')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-12 bg-gray-800 p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-white">🚗 Post a New Ride</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1) Title (goes to rides.destination) */}
        <div>
          <label className="block text-gray-200 mb-1">Title</label>
          <input
            type="text"
            className="w-full border border-gray-700 bg-gray-900 text-white p-2 rounded"
            placeholder="Title of your ride."
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        {/* 2) Starting Location */}
        <div>
          <label className="block text-gray-200 mb-1">Starting Location</label>
          <AutocompleteInput
            placeholder="Type your starting address..."
            value={startingLocation}
            onChange={setStartingLocation}
          />
        </div>

        {/* 3) Destination Location */}
        <div>
          <label className="block text-gray-200 mb-1">Destination Location</label>
          <AutocompleteInput
            placeholder="Type your destination address..."
            value={destinationAddress}
            onChange={setDestinationAddress}
          />
        </div>

        {/* 4) Date & Time */}
        <div>
          <label className="block text-gray-200 mb-1">Date & Time</label>
          <input
            type="datetime-local"
            className="w-full border border-gray-700 bg-gray-900 text-white p-2 rounded"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        {/* 5) Category */}
        <div>
          <label className="block text-gray-200 mb-1">Category</label>
          <select
            className="w-full border border-gray-700 bg-gray-900 text-white p-2 rounded"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          >
            <option value="Airport">Airport</option>
            <option value="Outdoor Activity">Outdoor Activity</option>
            <option value="Event">Event</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* 6) Seats Available */}
        <div>
          <label className="block text-gray-200 mb-1">Seats Available</label>
          <input
            type="number"
            min={1}
            className="w-full border border-gray-700 bg-gray-900 text-white p-2 rounded"
            value={seats}
            onChange={e => setSeats(Number(e.target.value))}
            required
          />
        </div>

        {/* 7) Notes */}
        <div>
          <label className="block text-gray-200 mb-1">Notes (optional)</label>
          <textarea
            className="w-full border border-gray-700 bg-gray-900 text-white p-2 rounded"
            placeholder="Any details (gear, meetup spot, etc.)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Create Ride
        </button>
      </form>
    </div>
  )
}
