import { HoverEffect } from '@/components/UI/hoverCardGrid'

const items = [
  {
    title: "My Rides",
    description: "See all rides you've created or joined.",
    link: "/my-rides"
  },
  {
    title: "Create Ride",
    description: "Post a new ride and invite others.",
    link: "/rideForm"
  },
  {
    title: "Profile",
    description: "Check your ratings and info.",
    link: "/profile"
  }
]

export default function DashboardPage() {
  return (
    <div className="px-4 sm:px-8">
      <HoverEffect items={items} />
    </div>
  )
}
