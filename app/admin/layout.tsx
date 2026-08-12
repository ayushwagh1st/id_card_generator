'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { GlobalNotificationProvider } from '@/components/GlobalNotificationProvider'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#05070e] text-slate-900 dark:text-slate-100 flex overflow-hidden selection:bg-indigo-500/20 selection:text-indigo-400">
      <GlobalNotificationProvider />

      {/* Layer 1: Ambient Slow Moving Background Aurora Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] left-[15%] w-[650px] h-[650px] rounded-full bg-blue-500/10 dark:bg-indigo-600/20 blur-[140px] animate-aurora-1" />
        <div className="absolute top-[35%] -right-[10%] w-[750px] h-[750px] rounded-full bg-purple-500/10 dark:bg-purple-600/18 blur-[150px] animate-aurora-2" />
        <div className="absolute -bottom-[20%] left-[25%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-cyan-500/15 blur-[130px] animate-aurora-1" />
      </div>

      {/* Layer 2: Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <Sidebar userRole="SUPER_ADMIN" />
      </div>

      {/* Mobile Backdrop & Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-md md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:hidden flex"
            >
              <Sidebar
                userRole="SUPER_ADMIN"
                closeMobileMenu={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Layer 3: Main Workspace Content */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 overflow-hidden relative z-10">
        <Header
          roleName="SUPER_ADMIN"
          userName="Admin User"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
