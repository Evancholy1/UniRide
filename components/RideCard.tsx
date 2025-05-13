type RideCardProps = {
    id: string
    destination: string
    date: string
    driver: string
    seats_left: number
    notes?: string
  }
  
  export default function RideCard({ id, destination, date, driver, seats_left, notes }: RideCardProps) {
    return (
      <a href={`/ride/${id}`} className="block p-4 border rounded shadow hover:bg-gray-50">
        <h3 className="text-xl font-semibold">{destination}</h3>
        <p className="text-sm">📅 {date}</p>
        <p className="text-sm">👤 Driver: {driver}</p>
        <p className="text-sm">🚗 {seats_left} seat(s) left</p>
        {notes && <p className="text-sm italic mt-1">{notes}</p>}
      </a>
    )
  }
  