'use client'

import { useEffect, useState, useRef } from 'react'
import { User, Menu, LogOut, Sun, Moon, Sparkles } from 'lucide-react'
import { getCurrentUserAction, logoutAction } from '@/server/actions/auth'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'

interface HeaderProps {
  userName?: string
  roleName?: string
  onToggleSidebar?: () => void
}

export function Header({ userName = 'User', roleName = 'Role', onToggleSidebar }: HeaderProps) {
  const [fetchedName, setFetchedName] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
            setFetchedName(user.email.split('@')[0])
          }
          return
        }

        const sessionUserStr = document.cookie
          .split('; ')
          .find((row) => row.startsWith('mock-user='))
          ?.split('=')[1]

        if (sessionUserStr) {
          try {
            const sessionUser = JSON.parse(decodeURIComponent(sessionUserStr))
            if (sessionUser.full_name) setFetchedName(sessionUser.full_name)
            else if (sessionUser.name) setFetchedName(sessionUser.name)
            else if (sessionUser.email) setFetchedName(sessionUser.email.split('@')[0])
          } catch (e) {}
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
    roleName === 'SUPER_ADMIN'
      ? 'Super Admin'
      : roleName === 'MODEL_HEAD'
      ? 'Model Head'
      : roleName === 'SECURITY'
      ? 'Security'
      : 'Lecturer'

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all duration-300">
      {/* Floating Header Glass Container */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 py-2.5 rounded-2xl glass-panel glass-edge-light">
        {/* Left Side: Mobile Menu Button & Title */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 md:hidden transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white leading-snug tracking-tight">
                {roleName === 'SUPER_ADMIN' ? 'Admin Portal' : displayName}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                Bal Pradarshani Samagam
              </span>
            </div>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <CommandPalette />

        {/* Right Side: Theme Switcher & User Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300/40 dark:border-slate-700/40 transition-colors relative overflow-hidden flex items-center justify-center w-8 h-8"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme === 'dark' ? 'dark' : 'light'}
                  initial={{ y: -20, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 20, opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                  className="absolute"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                </motion.div>
              </AnimatePresence>
            </button>
          )}

          {/* User Info Label */}
          <div className="text-right hidden sm:block">
            <div className="font-medium text-xs text-slate-900 dark:text-slate-100 leading-tight">
              {displayName}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-mono">
              {roleLabel}
            </div>
          </div>

          {/* User Avatar Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20 border border-white/20 cursor-pointer transition-transform hover:scale-105"
              aria-label="Toggle user menu"
            >
              <User className="h-4 h-4" />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl glass-panel border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-1.5 z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-slate-200/40 dark:border-slate-800/60 mb-1">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {roleLabel}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
