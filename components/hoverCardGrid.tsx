import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

type RideCardItem = {
  destination: string
  date: string
  driver: string
  seats_left: number 
  link: string
}

type DashboardCardItem = {
  title: string
  description: string
  link: string
}

// Union type for max flexibility:
type HoverCardItem = RideCardItem | DashboardCardItem

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
         "flex flex-col items-center space-y-8 p-6 max-w-2xl mx-auto", // ✅ centered & padded
        className
      )}
    >
      {items.map((item, idx) => (
        <a
          href={item.link}
          key={item.link}
          className="relative group block p-2 h-full w-full"
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
          <Card>
          <CardTitle>{'title' in item ? item.title : item.destination}</CardTitle>
          <CardDescription>
            {'description' in item ? item.description : (
              <>
                  <div>Date: {new Date(item.date).toLocaleString()}</div>
                  <div>Driver: {item.driver}</div>
                  <div>Seats Left: {item.seats_left}</div>
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
}: {
  className?: string
  children: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "rounded-xl w-full h-[400px] p-6 bg-[#1e1e1e] text-white border border-gray-700 shadow-md transition-all duration-200",
        className
      )}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
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
  <h4 className={cn("text-xl font-bold text-white mb-2", className)}>
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
      "text-base text-gray-300 leading-relaxed space-y-1",
      className
    )}
  >
    {children}
  </p>
)
