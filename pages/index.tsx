import { supabase } from '@/lib/supabaseClient'
import RideCard from '@/components/RideCard'

export async function getServerSideProps() {
  const { data: rides, error } = await supabase
    .from('rides')
    .select('*')
    .order('date', { ascending: true })

  return { props: { rides } }
}

export default function HomePage({ rides }: { rides: any[] }) {
  return (
    <div className="max-w-xl mx-auto mt-8 space-y-4">
      <h1 className="text-3xl font-bold mb-4">🎿 Find a Ride</h1>
      {rides.map(ride => (
        <RideCard key={ride.id} {...ride} />
      ))}
    </div>
  )
}
