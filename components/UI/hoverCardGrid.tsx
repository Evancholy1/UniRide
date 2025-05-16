import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

type RideCardItem = {
  starting_location: string
  destination: string
  date: string
  driver: string
  seats_left: number 
  link: string
  category?: string
  notes?: string
  verified?: boolean
}

type DashboardCardItem = {
  title: string
  description: string
  link: string
}

// Union type for max flexibility:
type HoverCardItem = RideCardItem | DashboardCardItem

// Type guard functions
function isRideCardItem(item: HoverCardItem): item is RideCardItem {
  return 'destination' in item && 'date' in item && 'driver' in item && 'seats_left' in item;
}

function isDashboardCardItem(item: HoverCardItem): item is DashboardCardItem {
  return 'title' in item && 'description' in item;
}

// Helper function to get category icon
const getCategoryIcon = (cat?: string) => {
  switch(cat) {
    case 'Airport': return '✈️';
    case 'Outdoor Activity': return '🏔️';
    case 'Event': return '🎵';
    case 'Other':
    default: return '🚗';
  }
};

export const HoverEffect = ({
  items,
  className,
}: {
  items: HoverCardItem[]
  className?: string
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="max-w-[1400px] mx-auto px-4">
      <div className={cn("grid-autofit", className)}>
        {items.map((item, idx) => (
          <a
            href={item.link}
            key={item.link}
            className="relative group block p-2 w-full"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className="absolute inset-0 h-full w-full bg-gray/18 dark:bg-gray/5 block rounded-3xl"
                  layoutId="hoverBackground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
                />
              )}
            </AnimatePresence>

            <Card hasNotes={isRideCardItem(item) && Boolean(item.notes)}>
              {isRideCardItem(item) && (
                <div className="flex justify-end gap-2 mb-2">
                  {item.category && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                      {getCategoryIcon(item.category)} {item.category}
                    </span>
                  )}
                  {item.verified && (
                    <span
                      title="Verified Student"
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold whitespace-nowrap"
                    >
                      ✔️ Student
                    </span>
                  )}
                </div>
              )}

              <div className="mb-3 text-center">
                <CardTitle>
                  {isDashboardCardItem(item) ? item.title : item.destination}
                </CardTitle>
              </div>

              <CardDescription>
                {isDashboardCardItem(item) ? item.description : (
                  <>
                    <div className="text-center">📍 From: {item.starting_location}</div>
                    <div className="text-center">
                      📅 {new Date(item.date).toLocaleString()}
                    </div>
                    <div className="text-center">👤 Driver: {item.driver}</div>
                    <div className="text-center">🚗 {item.seats_left} seat(s) left</div>
                    {item.notes && (
                      <div className="text-center mt-4 italic text-sm border-t border-gray-700 pt-3">
                        "{item.notes}"
                      </div>
                    )}
                  </>
                )}
              </CardDescription>
            </Card>


          </a>
        ))}
      </div>
    </div>
  )
}


export const Card = ({
  className,
  children,
  hasNotes = false,
}: {
  className?: string
  children: React.ReactNode
  hasNotes?: boolean
}) => {
  return (
    <div
    className={cn(
      "w-[331px] bg-[#1e1e1e] text-white rounded-xl p-4 border border-gray-700 shadow-md transition-all duration-200 hover:shadow-xl hover:border-green-500",
      className
      )}
    >
      <div className="relative z-50">
        <div className="p-2">{children}</div>
      </div>
    </div>
  )
}

export const CardTitle = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => (
  <h4 className={cn("text-xl font-bold text-white truncate", className)}>
    {children}
  </h4>
)

export const CardDescription = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => (
  <p
    className={cn(
      "text-base text-gray-300 leading-relaxed space-y-3",
      className
    )}
  >
    {children}
  </p>
)
