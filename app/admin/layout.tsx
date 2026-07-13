'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <Sidebar userRole="SUPER_ADMIN" />
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/30 md:hidden animate-in fade-in duration-200 w-full cursor-default"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              setSidebarOpen(false)
            }
          }}
          aria-label="Close sidebar"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-card transition-transform duration-300 md:hidden flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{ borderRight: '3px solid #111111' }}
      >
        <Sidebar userRole="SUPER_ADMIN" closeMobileMenu={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col md:pl-64 overflow-hidden">
        <Header
          roleName="SUPER_ADMIN"
          userName="Admin User"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
