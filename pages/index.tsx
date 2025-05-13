import { supabase } from '@/lib/supabaseClient'
import RideCard from '@/components/RideCard'

export async function getServerSideProps() {
  const { data: rides, error } = await supabase
    .from('rides')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Supabase error:', error.message)
    return { props: { rides: [] } }
  }

  return { props: { rides: rides ?? [] } }
}

export default function HomePage({ rides }: { rides: any[] }) {
  return (
    <div className="max-w-xl mx-auto mt-8 space-y-4">
      <h1 className="text-3xl font-bold mb-4">🎿 Find a Ride</h1>
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
