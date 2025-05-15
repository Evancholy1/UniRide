import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

type RideCardItem = {
  destination: string
  date: string
  driver: string
  seats_left: number 
  link: string
  category?: string
  notes?: string
}

type DashboardCardItem = {
  title: string
  description: string
  link: string
}

// Union type for max flexibility:
type HoverCardItem = RideCardItem | DashboardCardItem

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
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mx-auto", // Responsive grid layout
        className
      )}
    >
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
                className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
              />
            )}
          </AnimatePresence>
          <Card 
            hasNotes={'notes' in item && item.notes && item.notes.length > 0}
          >
            <div className="flex justify-between items-center mb-3">
              <CardTitle>{'title' in item ? item.title : item.destination}</CardTitle>
              {'category' in item && item.category && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {getCategoryIcon(item.category)} {item.category}
                </span>
              )}
            </div>
            <CardDescription>
              {'description' in item ? item.description : (
                <>
                  <div className="text-center">📅 {new Date(item.date).toLocaleString()}</div>
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
        "rounded-xl w-full p-4 bg-[#1e1e1e] text-white border border-gray-700 shadow-md transition-all duration-200 hover:shadow-lg hover:border-gray-500",
        hasNotes ? "min-h-[250px]" : "min-h-[200px]",
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
