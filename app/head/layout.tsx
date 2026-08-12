'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function HeadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex overflow-hidden">
      {/* Background Aurora Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-aurora-1" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-aurora-2" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 p-3 pr-0 z-30 shrink-0">
        <Sidebar userRole="MODEL_HEAD" />
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-md md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] p-3 transition-transform duration-300 md:hidden flex ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar userRole="MODEL_HEAD" closeMobileMenu={() => setSidebarOpen(false)} />
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 z-10 overflow-hidden">
        <Header
          roleName="MODEL_HEAD"
          userName="Model Head"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
