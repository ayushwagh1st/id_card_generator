'use client'

import { useEffect, useState } from 'react'
import { User, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  userName?: string
  roleName?: string
  onToggleSidebar?: () => void
}

export function Header({ userName = 'User', roleName = 'Role', onToggleSidebar }: HeaderProps) {
  const [displayName, setDisplayName] = useState(userName)
  const supabase = createClient()

  useEffect(() => {
    async function getUserName() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          if (user.user_metadata?.full_name) {
            setDisplayName(user.user_metadata.full_name)
            return
          }
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()
          if (profile?.full_name) {
            setDisplayName(profile.full_name)
            return
          }
        }

        const sessionUserStr = document.cookie
          .split('; ')
          .find(row => row.startsWith('mock-user='))
          ?.split('=')[1]

        if (sessionUserStr) {
          const sessionUser = JSON.parse(decodeURIComponent(sessionUserStr))
          if (sessionUser.email) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('email', sessionUser.email)
              .single()
            if (profile?.full_name) {
              setDisplayName(profile.full_name)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        const sessionUserStr = document.cookie
          .split('; ')
          .find(row => row.startsWith('mock-user='))
          ?.split('=')[1]
        if (sessionUserStr) {
          try {
            const sessionUser = JSON.parse(decodeURIComponent(sessionUserStr))
            if (sessionUser.full_name) setDisplayName(sessionUser.full_name)
          } catch(e) {}
        }
      }
    }

    getUserName()
  }, [userName, supabase])

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
