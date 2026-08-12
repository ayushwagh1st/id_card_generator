'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  LayoutDashboard,
  Users,
  Printer,
  UserCheck,
  Calendar,
  FileSpreadsheet,
  Headphones,
  Sparkles,
  Command,
  X,
  ArrowRight,
} from 'lucide-react'

interface CommandItem {
  id: string
  title: string
  subtitle: string
  category: 'Navigation' | 'Actions' | 'Tools'
  icon: React.ElementType
  href?: string
  action?: () => void
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      subtitle: 'View analytics, stats, and real-time activity',
      category: 'Navigation',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
    },
    {
      id: 'directory',
      title: 'Volunteer Directory',
      subtitle: 'Browse, search, and manage registered volunteers',
      category: 'Navigation',
      icon: Users,
      href: '/admin/directory',
    },
    {
      id: 'print',
      title: 'ID Card Printer Studio',
      subtitle: 'Generate and print official badges with live preview',
      category: 'Tools',
      icon: Printer,
      href: '/admin/print',
    },
    {
      id: 'spot-reg',
      title: 'Spot Registration Form',
      subtitle: 'Register new volunteers on-site instantly',
      category: 'Actions',
      icon: UserCheck,
      href: '/admin/spot-registration',
    },
    {
      id: 'bulk-qr',
      title: 'Bulk QR Generator',
      subtitle: 'Export and download QR codes in batch',
      category: 'Tools',
      icon: FileSpreadsheet,
      href: '/admin/bulk-qr',
    },
    {
      id: 'live-attendance',
      title: 'Live Attendance Scanner',
      subtitle: 'Scan QR codes for real-time check-ins',
      category: 'Tools',
      icon: Sparkles,
      href: '/admin/live-attendance',
    },
    {
      id: 'sessions',
      title: 'Session Management',
      subtitle: 'Configure event slots and enrollments',
      category: 'Navigation',
      icon: Calendar,
      href: '/admin/sessions',
    },
    {
      id: 'support',
      title: 'Help & Support Portal',
      subtitle: 'Access system documentation and assistance',
      category: 'Navigation',
      icon: Headphones,
      href: '/support',
    },
  ]

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false)
    setQuery('')
    if (item.href) {
      router.push(item.href)
    } else if (item.action) {
      item.action()
    }
  }

  const handleArrowNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredCommands[selectedIndex])
    }
  }

  return (
    <>
      {/* Trigger Pill in Navbar */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/40 dark:border-slate-700/40 backdrop-blur-md text-xs text-muted-foreground hover:text-foreground hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200"
      >
        <Search className="w-3.5 h-3.5 text-blue-500" />
        <span>Search or jump to...</span>
        <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-900/70 border border-slate-300/60 dark:border-slate-700/60 font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <Command className="w-2.5 h-2.5" /> K
        </kbd>
      </button>

      {/* Raycast / Linear Glass Command Overlay */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 sm:px-6">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xl"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-2xl rounded-3xl bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 shadow-2xl overflow-hidden z-10"
              onKeyDown={handleArrowNav}
            >
              {/* Search Bar Input */}
              <div className="flex items-center px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/80">
                <Search className="w-5 h-5 text-blue-500 shrink-0 mr-3.5" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type a command, page, or search term..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-foreground text-base placeholder-slate-400 focus:outline-none"
                />
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-full text-slate-400 hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <kbd className="px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50 text-xs font-mono text-slate-500">
                    ESC
                  </kbd>
                )}
              </div>

              {/* Commands List */}
              <div className="max-h-[380px] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    No matching commands found.
                  </div>
                ) : (
                  filteredCommands.map((item, idx) => {
                    const Icon = item.icon
                    const isSelected = idx === selectedIndex
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`p-2.5 rounded-xl ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                : 'bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm leading-snug">
                              {item.title}
                            </div>
                            <div className="text-xs opacity-75 leading-snug">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 text-slate-500">
                            {item.category}
                          </span>
                          <ArrowRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected ? 'translate-x-1 opacity-100' : 'opacity-0'
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-slate-100/40 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>Navigation: <kbd className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800">↓</kbd></span>
                  <span>Select: <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800">↵</kbd></span>
                </div>
                <span>Linear & Raycast Inspired</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  )
}
