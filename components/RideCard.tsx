type RideCardProps = {
  id: string
  destination: string
  date: string
  driver: string
  seats_left: number
  notes?: string
  category?: string
  verified?: boolean
}

export default function RideCard({
  id,
  destination,
  date,
  driver,
  seats_left,
  notes,
  category,
  verified,
}: RideCardProps) {
  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'Airport':
        return '✈️'
      case 'Outdoor Activity':
        return '🏔️'
      case 'Event':
        return '🎵'
      case 'Other':
      default:
        return '🚗'
    }
  }

  return (
    <a href={`/ride/${id}`} className="block p-4 border rounded shadow hover:bg-gray-50">
      <h3 className="text-xl font-semibold">{destination}</h3>
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm">📅 {date}</p>
        {category && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
            {getCategoryIcon(category)} {category}
            {verified && (
              <span title="Verified Student" className="text-green-600">✔️</span>
            )}
          </span>
        )}
      </div>
      <p className="text-sm">👤 Driver: {driver}</p>
      <p className="text-sm">🚗 {seats_left} seat(s) left</p>
      {notes && <p className="text-sm italic mt-1">{notes}</p>}
    </a>
  )
}
