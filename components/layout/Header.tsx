'use client'

import { useEffect, useState, useRef } from 'react'
import { User, Menu, LogOut } from 'lucide-react'
import { getCurrentUserAction, logoutAction } from '@/server/actions/auth'

interface HeaderProps {
  userName?: string
  roleName?: string
  onToggleSidebar?: () => void
}

export function Header({ userName = 'User', roleName = 'Role', onToggleSidebar }: HeaderProps) {
  const [fetchedName, setFetchedName] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const displayName = fetchedName || userName

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    async function getUserName() {
      try {
        const user = await getCurrentUserAction()
        if (user) {
          if (user.user_metadata?.full_name) {
            setFetchedName(user.user_metadata.full_name)
          } else if (user.user_metadata?.name) {
            setFetchedName(user.user_metadata.name)
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
            else if (sessionUser.name) setFetchedName(sessionUser.name)
            else if (sessionUser.email) setFetchedName(sessionUser.email.split('@')[0])
          } catch (e) { }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
      }
    }

    getUserName()
  }, [userName])

  const handleLogout = async () => {
    await logoutAction()
    window.location.href = '/login'
  }

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
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl icon-tile-pink shrink-0 cursor-pointer transition-transform hover:scale-105"
            style={{ border: '3px solid #111111', boxShadow: '4px 4px 0 #111111' }}
            aria-label="Toggle user menu"
          >
            <User className="h-5 w-5" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border-2 border-ink rounded-xl shadow-hard z-50 overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-muted transition-colors flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
