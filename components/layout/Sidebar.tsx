'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Users,
  Database,
  FileText,
  BarChart3,
  LogOut,
  Printer,
  Shield,
  X,
  Activity,
  UserCheck,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface SidebarProps {
  userRole: 'SUPER_ADMIN' | 'MODEL_HEAD' | 'LECTURER'
  closeMobileMenu?: () => void
}

const adminLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
  { name: 'Models', href: '/admin/models', icon: Database },
  { name: 'Model Heads', href: '/admin/heads', icon: Shield },
  { name: 'Security', href: '/admin/lecturers', icon: Users },
  { name: 'Sessions', href: '/admin/sessions', icon: Calendar },
  { name: 'Enrollment', href: '/admin/session-enrollment', icon: UserCheck },
  { name: 'Live Tracking', href: '/admin/live-attendance', icon: Activity },
  { name: 'Volunteers', href: '/admin/volunteers', icon: Users },
  { name: 'Print Studio', href: '/admin/print', icon: Printer },
  { name: 'Bulk QR', href: '/admin/bulk-qr', icon: FileSpreadsheet },
  { name: 'Spot Reg', href: '/admin/spot-registration', icon: Shield },
  { name: 'Directory', href: '/admin/directory', icon: Users },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
]

const headLinks = [
  { name: 'Dashboard', href: '/head/dashboard', icon: BarChart3 },
  { name: 'My Volunteers', href: '/head/volunteers', icon: Users },
  { name: 'Reports', href: '/head/reports', icon: FileText },
]

const lecturerLinks = [
  { name: 'Dashboard', href: '/lecturer/dashboard', icon: BarChart3 },
  { name: 'All Sessions', href: '/lecturer/sessions', icon: Calendar },
  { name: 'QR Scanner', href: '/lecturer/scanner', icon: Shield },
  { name: 'Directory', href: '/lecturer/directory', icon: Users },
  { name: 'Reports', href: '/lecturer/reports', icon: FileText },
]

export function Sidebar({ userRole, closeMobileMenu }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const links =
    userRole === 'SUPER_ADMIN'
      ? adminLinks
      : userRole === 'MODEL_HEAD'
      ? headLinks
      : lecturerLinks

  const handleLogout = async () => {
    const { logoutUser } = await import('@/lib/supabase/client')
    await logoutUser()
    router.refresh()
    router.push('/')
  }

  return (
    <aside className="flex h-full w-full flex-col p-3.5">
      {/* Apple-style Translucent Material Sidebar */}
      <div className="flex flex-col h-full w-full rounded-[32px] bg-white/60 dark:bg-[#0c101d]/75 backdrop-blur-[40px] saturate-[1.8] border border-white/50 dark:border-white/[0.09] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Brand Logo & Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200/40 dark:border-white/[0.08] shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[15px] text-slate-900 dark:text-white block leading-tight tracking-[-0.02em]">
                Bal Pradarshani
              </span>
              <span className="text-[11px] font-semibold text-indigo-600/90 dark:text-indigo-400 uppercase tracking-[0.05em] block mt-0.5">
                Spatial Portal
              </span>
            </div>
          </Link>
          {closeMobileMenu && (
            <button
              type="button"
              onClick={closeMobileMenu}
              className="md:hidden p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMobileMenu}
                  prefetch={true}
                  className={cn(
                    'relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] tracking-[-0.01em] transition-all duration-300 ease-out group active:scale-[0.97] active:transition-none',
                    isActive
                      ? 'text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-2xl bg-white/90 dark:bg-indigo-500/15 shadow-sm border border-slate-200/50 dark:border-indigo-500/30"
                      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 relative z-10 transition-colors duration-300',
                      isActive
                        ? 'text-blue-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    )}
                  />
                  <span className="relative z-10">{link.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sign Out Action */}
        <div className="p-2.5 border-t border-slate-200/40 dark:border-slate-700/40 shrink-0">
          <button
            type="button"
            onClick={() => {
              handleLogout()
              if (closeMobileMenu) closeMobileMenu()
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 active:scale-[0.97] active:transition-none"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
