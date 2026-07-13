'use client'

import { useEffect, useState } from 'react'
import { Calendar, Activity } from 'lucide-react'
import { getLecturerStatsAction } from '@/server/actions/attendance'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

export default function LecturerDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAssigned: 0,
    todaySessions: 0
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getLecturerStatsAction()
        setStats(data)
      } catch (err: any) {
        toast.error('Failed to load dashboard stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  const statItems = [
    { title: 'Total Scheduled Sessions', value: stats.totalAssigned, iconSrc: '/images/icons/icon_database.png', tileClass: 'icon-tile-peach' },
    { title: "Today's Sessions", value: stats.todaySessions, iconSrc: '/images/icons/icon_clock.png', tileClass: 'icon-tile-pink' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Banner */}
      <div className="rounded-[24px] bg-gradient-to-r from-[#fcfaff] to-[#f6f4ff] p-8 md:p-12 border border-[#f0ebff] shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ecfdf3] text-[#027a48] text-xs font-semibold tracking-wide uppercase">
            <Activity className="w-4 h-4 mr-2" /> Security Mode
          </div>
          <div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-slate-900">
            Security <span className="text-white" style={{ textShadow: '2px 2px 0 #111111' }}>Dashboard</span>
          </h1>
            <div className="w-12 h-1 bg-[#8C6DFD] rounded-full mt-4 opacity-80"></div>
          </div>
          <p className="font-sans text-slate-500 text-lg max-w-xl leading-relaxed">
            Welcome back! Here is an overview of all scheduled sessions and today's schedule.
          </p>
        </div>

        <div className="hidden md:block relative z-10 w-full max-w-[280px] aspect-square transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
          <Image 
            src="/images/lecturer_dashboard_illustration.png" 
            alt="Lecturer Dashboard" 
            fill
            className="object-contain drop-shadow-[8px_8px_0_rgba(17,17,17,1)]"
            sizes="(max-width: 768px) 100vw, 280px"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat) => (
          <div
            key={stat.title}
            className="bento-white flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-150 shadow-hard-sm !p-5 !rounded-2xl"
          >
            <div className={`icon-tile ${stat.tileClass} w-14 h-14 shadow-hard-xs transform -rotate-2 overflow-hidden bg-white`}>
              <Image src={stat.iconSrc} alt={stat.title} width={56} height={56} className="object-cover" />
            </div>
            <div className="mt-2">
              <div className="font-display font-bold text-3xl text-ink leading-none">{stat.value}</div>
              <div className="font-display text-xs font-bold uppercase tracking-wider text-ink/60 mt-1.5">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
