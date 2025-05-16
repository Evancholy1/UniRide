type RideCardProps = {
  id: string
  starting_location: string
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
  starting_location,
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
    <a
    href={`/ride/${id}`}
    className="w-[331px] h-[250px] bg-[#1e1e1e] text-white rounded-xl p-4 border border-gray-700 shadow-md transition-all duration-200 hover:shadow-xl hover:border-green-500 block"
  >
    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
      {destination}
      {verified && (
        <span
          title="Verified Student"
          className="text-green-500 text-base"
        >
          VERIFIED
        </span>
      )}
    </h3>
    

    <p className="text-sm">📍 From: {starting_location}</p>

    <div className="flex justify-between items-center mb-2">
      <p className="text-sm">📅 {date}</p>
      {category && (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
          {getCategoryIcon(category)} {category}
        </span>
      )}
    </div>
  
    <p className="text-sm">👤 Driver: {driver}</p>
    <p className="text-sm">🚗 {seats_left} seat(s) left</p>
    {notes && <p className="text-sm italic mt-2">{notes}</p>}
  </a>
  


  )
}
