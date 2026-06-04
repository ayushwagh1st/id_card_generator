'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Activity, Loader2 } from 'lucide-react'
import { getLecturerStatsAction } from '@/app/actions/attendance'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Lecturer Dashboard</h1>
          <p className="text-blue-100 mt-2 text-sm max-w-xl">
            Welcome back! Here is an overview of your assigned sessions and today's schedule.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Total Assigned Sessions
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-black text-foreground">{stats.totalAssigned}</div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Today's Sessions
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-500">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-black text-foreground">{stats.todaySessions}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
