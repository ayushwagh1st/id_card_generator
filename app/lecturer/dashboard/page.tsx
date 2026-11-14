'use client'

import { useEffect, useState } from 'react'
import { Calendar, Activity, ShieldCheck, Database, Clock } from 'lucide-react'
import { getLecturerStatsAction } from '@/server/actions/attendance'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassCard } from '@/components/ui/GlassCard'

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
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const statItems = [
    { title: 'Total Scheduled Sessions', value: stats.totalAssigned, icon: Database, glow: 'blue' as const },
    { title: "Today's Sessions", value: stats.todaySessions, icon: Clock, glow: 'cyan' as const },
  ]

  return (
    <div className="space-y-6">
      {/* Banner */}
      <GlassCard className="p-8 sm:p-10" glowColor="blue">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500">
              <ShieldCheck className="w-4 h-4" />
              <span>Sessions & attendance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ready for the next session.
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Welcome back! Live overview of all scheduled duty shifts and active venue check-in counters.
            </p>
          </div>

        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {statItems.map((stat) => {
          const Icon = stat.icon
          return (
            <GlassCard key={stat.title} className="p-6" glowColor={stat.glow}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">{stat.title}</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.value}</div>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
