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
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* Desktop Sidebar (Fixed Left) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <Sidebar role="MODEL_HEAD" />
      </div>

      {/* Mobile Drawer Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar Content */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-background transition-transform duration-300 md:hidden flex ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar role="MODEL_HEAD" closeMobileMenu={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col md:pl-64 overflow-hidden">
        <Header 
          roleName="MODEL_HEAD" 
          userName="Model Head" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
