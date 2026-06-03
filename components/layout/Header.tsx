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
      // 1. Try supabase auth user first
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.user_metadata?.full_name) {
          setDisplayName(user.user_metadata.full_name)
          return
        }
        // Fallback to query profiles table
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
      
      // 2. Fallback to mock cookie check
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
    }
    
    getUserName()
  }, [userName, supabase])

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-8 shadow-sm">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden transition-colors duration-150"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="text-xl font-bold tracking-tight text-foreground">
          {roleName === 'SUPER_ADMIN' ? 'Admin Dashboard' : displayName}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-sm">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{displayName}</div>
          <div className="text-muted-foreground text-xs">{roleName === 'SUPER_ADMIN' ? 'Super Admin' : 'Model Head'}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  )
}
