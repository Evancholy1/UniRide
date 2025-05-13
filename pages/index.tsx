import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import RideCard from '@/components/RideCard'

export default function HomePage() {
  const [rides, setRides] = useState<any[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUserAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUserEmail(session.user.email)

      const { data: rides, error } = await supabase
        .from('rides')
        .select('*')
        .order('date', { ascending: true })

      if (error) {
        console.error('Failed to fetch rides:', error.message)
      } else {
        setRides(rides ?? [])
      }

      setLoading(false)
    }

    checkUserAndLoad()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">🎿 Find a Ride</h1>
        <div className="text-right text-sm">
          <p>Welcome, {userEmail}</p>
          <button onClick={handleLogout} className="text-red-600 underline hover:text-red-800 mt-1">
            Log out
          </button>
        </div>
      </div>

      {rides.length > 0 ? (
        rides.map((ride) => (
          <RideCard key={ride.id} {...ride} />
        ))
      ) : (
        <p>No rides found.</p>
      )}
    </div>
  )
}
