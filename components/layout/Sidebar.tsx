'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Tent, Users, Database, FileText, BarChart, LogOut, Printer, Shield, X, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  role: 'SUPER_ADMIN' | 'MODEL_HEAD' | 'LECTURER'
  closeMobileMenu?: () => void
}

export function Sidebar({ role, closeMobileMenu }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const adminLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart },
    { name: 'Models', href: '/admin/models', icon: Database },
    { name: 'Model Heads', href: '/admin/heads', icon: Shield },
    { name: 'Lecturers', href: '/admin/lecturers', icon: Users },
    { name: 'Sessions', href: '/admin/sessions', icon: Database },
    { name: 'Enrollment', href: '/admin/session-enrollment', icon: Users },
    { name: 'Live Tracking', href: '/admin/live-attendance', icon: Activity },
    { name: 'Volunteers', href: '/admin/volunteers', icon: Users },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Print Center', href: '/admin/print', icon: Printer },
  ]

  const headLinks = [
    { name: 'Dashboard', href: '/head/dashboard', icon: BarChart },
    { name: 'My Volunteers', href: '/head/volunteers', icon: Users },
  ]

  const lecturerLinks = [
    { name: 'Dashboard', href: '/lecturer/dashboard', icon: BarChart },
    { name: 'My Sessions', href: '/lecturer/sessions', icon: Database },
    { name: 'QR Scanner', href: '/lecturer/scanner', icon: Shield },
    { name: 'Reports', href: '/lecturer/reports', icon: FileText },
  ]

  const links = role === 'SUPER_ADMIN' ? adminLinks : role === 'MODEL_HEAD' ? headLinks : lecturerLinks

  const handleLogout = async () => {
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')

    if (isMockMode) {
      document.cookie = 'mock-user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      router.refresh()
    } else {
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-full flex-col border-r bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2 font-black text-[17px] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
          <div className="bg-gradient-to-tr from-pink-500 to-orange-400 p-1.5 rounded shadow-sm">
            <Tent className="h-4 w-4 text-white" />
          </div>
          <span>Bal Pradarshani</span>
        </div>
        {closeMobileMenu && (
          <button 
            onClick={closeMobileMenu}
            className="md:hidden text-muted-foreground p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1.5 px-4">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.01]",
                  isActive
                    ? "bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-md font-bold"
                    : "text-muted-foreground hover:bg-pink-50 hover:text-pink-600"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <button
          onClick={() => {
            handleLogout()
            if (closeMobileMenu) closeMobileMenu()
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
