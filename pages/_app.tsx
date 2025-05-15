import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/UI/sidebar"
import { supabase } from "@/lib/supabaseClient"
import {
  IconHome,
  IconPlus,
  IconCar,
  IconUser,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"

export default function App({ Component, pageProps }: AppProps) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasMounted, setHasMounted] = useState(false)
  const router = useRouter()
  const hideSidebar = ["/login", "/register"].includes(router.pathname)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
    setHasMounted(true)
  }, [])

  if (!hasMounted) return null // or a loading spinner

  const links = [
    {
      label: "Home",
      href: "/",
      icon: <IconHome className="h-5 w-5 text-white" />,
    },
    {
      label: "Create Ride",
      href: "/rideForm",
      icon: <IconPlus className="h-5 w-5 text-white" />,
    },
    {
      label: "My Rides",
      href: "/my_rides",
      icon: <IconCar className="h-5 w-5 text-white" />,
    },
    {
      label: "Profile",
      href: userId ? `/profile/${userId}` : "/profile/me",
      icon: <IconUser className="h-5 w-5 text-white" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5 text-white" />,
    },
  ]

  const LogoutButton = () => {
    const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push("/login")
    }

    return (
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition px-2 py-2 group/sidebar"
      >
        <IconLogout className="h-5 w-5 text-red-400 group-hover/sidebar:text-red-300" />
        <span className="text-sm">Logout</span>
      </button>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-green">
      {!hideSidebar && (
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>

            <div className="absolute bottom-4 right-4">
              <LogoutButton />
            </div>
          </SidebarBody>
        </Sidebar>
      )}

      <main className={`flex-1 p-6 transition-all duration-300 ${!hideSidebar ? (open ? 'md:ml-[300px]' : 'md:ml-[60px]') : ''}`}>
        <div className="max-w-3xl mx-auto">
          <Component {...pageProps} />
        </div>
      </main>
    </div>
  )
}