'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sparkles, Users, Database, FileText, BarChart, LogOut, Printer, Shield, X, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/server/actions/auth'

interface SidebarProps {
  userRole: 'SUPER_ADMIN' | 'MODEL_HEAD' | 'LECTURER'
  closeMobileMenu?: () => void
}

const adminLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart },
  { name: 'Models', href: '/admin/models', icon: Database },
  { name: 'Model Heads', href: '/admin/heads', icon: Shield },
  { name: 'Security', href: '/admin/lecturers', icon: Users },
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
  { name: 'Reports', href: '/head/reports', icon: FileText },
]

const lecturerLinks = [
  { name: 'Dashboard', href: '/lecturer/dashboard', icon: BarChart },
  { name: 'All Sessions', href: '/lecturer/sessions', icon: Database },
  { name: 'QR Scanner', href: '/lecturer/scanner', icon: Shield },
  { name: 'Reports', href: '/lecturer/reports', icon: FileText },
]

export function Sidebar({ userRole, closeMobileMenu }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const links = userRole === 'SUPER_ADMIN' ? adminLinks : userRole === 'MODEL_HEAD' ? headLinks : lecturerLinks

  const handleLogout = async () => {
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')

    if (isMockMode) {
      document.cookie = 'mock-user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      router.refresh()
    } else {
      await logoutAction()
    }
    router.push('/')
  }

  return (
    <div className="flex h-screen w-full flex-col bg-card" style={{ borderRight: '3px solid #111111' }}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-5" style={{ borderBottom: '3px solid #111111' }}>
        <div className="flex items-center gap-3">
          <div className="icon-tile icon-tile-lavender w-9 h-9">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">Bal Pradarshani</span>
        </div>
        {closeMobileMenu && (
          <button
            type="button"
            onClick={closeMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto py-5">
        <nav className="space-y-1 px-3">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMobileMenu}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 font-display font-semibold text-sm transition-all duration-150',
                  isActive
                    ? 'bg-[var(--color-yellow)] text-ink border-2 border-ink shadow-hard-xs transform -translate-y-0.5'
                    : 'text-foreground/70 hover:bg-muted hover:text-ink hover:border-2 border-transparent hover:border-ink/20'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-ink' : 'text-foreground/50')} />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-3" style={{ borderTop: '3px solid #111111' }}>
        <button
          type="button"
          onClick={() => {
            handleLogout()
            if (closeMobileMenu) closeMobileMenu()
          }}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 font-display font-semibold text-sm text-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
