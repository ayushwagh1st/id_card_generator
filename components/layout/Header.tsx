'use client'

import { useEffect, useState } from 'react'
import { User, Menu } from 'lucide-react'
import { getCurrentUserAction } from '@/server/actions/auth'

interface HeaderProps {
  userName?: string
  roleName?: string
  onToggleSidebar?: () => void
}

export function Header({ userName = 'User', roleName = 'Role', onToggleSidebar }: HeaderProps) {
  const [fetchedName, setFetchedName] = useState<string | null>(null)
  const displayName = fetchedName || userName

  useEffect(() => {
    async function getUserName() {
      try {
        const user = await getCurrentUserAction()
        if (user) {
          if (user.user_metadata?.full_name) {
            setFetchedName(user.user_metadata.full_name)
          } else if (user.email) {
            // Fallback if no full_name is present in metadata
            setFetchedName(user.email.split('@')[0])
          }
          return
        }

        const sessionUserStr = document.cookie
          .split('; ')
          .find(row => row.startsWith('mock-user='))
          ?.split('=')[1]

        if (sessionUserStr) {
          try {
            const sessionUser = JSON.parse(decodeURIComponent(sessionUserStr))
            if (sessionUser.full_name) setFetchedName(sessionUser.full_name)
            else if (sessionUser.email) setFetchedName(sessionUser.email.split('@')[0])
          } catch(e) {}
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
      }
    }

    getUserName()
  }, [userName])

  const roleLabel =
    roleName === 'SUPER_ADMIN' ? 'Super Admin' :
    roleName === 'MODEL_HEAD' ? 'Model Head' : 
    roleName === 'SECURITY' ? 'Security' : 'Lecturer'

  return (
    <header
      className="flex h-16 items-center justify-between bg-card px-4 sm:px-6 shrink-0"
      style={{ borderBottom: '3px solid #111111' }}
    >
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-[10px] text-foreground/50 hover:bg-muted hover:text-foreground md:hidden transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="font-display font-bold text-lg text-foreground">
          {roleName === 'SUPER_ADMIN' ? 'Admin Dashboard' : displayName}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="font-display font-bold text-sm text-foreground leading-tight">{displayName}</div>
          <div className="font-display text-xs text-foreground/50 leading-tight">{roleLabel}</div>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl icon-tile-pink shrink-0"
          style={{ border: '3px solid #111111', boxShadow: '4px 4px 0 #111111' }}
        >
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  )
}
