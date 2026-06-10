'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, Database, CheckCircle, Clock, BarChart2, Activity, TrendingUp, ScanLine } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { getDashboardStatsAction } from '@/app/actions/dashboard'
import { QRScannerDialog } from '@/components/QRScannerDialog'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVolunteers: 0,
    totalModels: 0,
    approvedCount: 0,
    pendingCount: 0,
    totalSessions: 0,
    totalLecturers: 0,
    todaySessions: 0,
    attendancePercentage: 0
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [scannerOpen, setScannerOpen] = useState(false)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const data = await getDashboardStatsAction()
      setStats(data.stats)
      setChartData(data.chartData)
      setActivities(data.activities)
    } catch (err: any) {
      toast.error(err.message || 'Error compiling dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const statItems = [
    { title: 'Total Volunteers', value: stats.totalVolunteers.toLocaleString(), iconSrc: '/images/icons/icon_users.png', tileClass: 'icon-tile-lime' },
    { title: 'Exhibition Models', value: stats.totalModels.toString(), iconSrc: '/images/icons/icon_database.png', tileClass: 'icon-tile-lavender' },
    { title: 'Total Sessions', value: stats.totalSessions.toString(), iconSrc: '/images/icons/icon_check.png', tileClass: 'icon-tile-ink' },
    { title: "Today's Sessions", value: stats.todaySessions.toString(), iconSrc: '/images/icons/icon_clock.png', tileClass: 'icon-tile-lime' },
    { title: 'Total Lecturers', value: stats.totalLecturers.toLocaleString(), iconSrc: '/images/icons/icon_users.png', tileClass: 'icon-tile-lavender' },
    { title: 'Attendance %', value: `${stats.attendancePercentage}%`, iconSrc: '/images/icons/icon_chart.png', tileClass: 'icon-tile-ink' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[400px] rounded-xl" />
          <Skeleton className="col-span-3 h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Banner */}
      <div className="rounded-[32px] bg-[var(--color-pink)] p-6 md:p-10 text-ink border-ink shadow-hard pattern-dots relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-flex badge-flat bg-white text-ink border-ink transform -rotate-2">
            <CheckCircle className="w-4 h-4 mr-2" /> System Online
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight">
            Super Admin <span className="text-white" style={{ textShadow: '2px 2px 0 #111111' }}>Hub</span>
          </h1>
          <p className="font-sans font-medium text-ink/80 text-lg">
            Live overview of volunteer networks, approval statistics, and division allocations.
          </p>
          <button
            onClick={() => setScannerOpen(true)}
            className="btn-primary bg-[var(--color-yellow)] text-ink border-ink shadow-hard hover:bg-[var(--color-mint)] mt-4 w-full sm:w-auto"
          >
            <ScanLine className="w-5 h-5" />
            Quick Scan ID
          </button>
        </div>

        <div className="hidden md:block relative z-10 w-full max-w-[300px] aspect-square transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
          <Image 
            src="/images/admin_dashboard_illustration.png" 
            alt="Control Center" 
            fill
            className="object-contain drop-shadow-[8px_8px_0_rgba(17,17,17,1)]"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statItems.map((item, i) => (
          <div
            key={i}
            className="bento-white flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-150 shadow-hard-sm !p-5 !rounded-2xl"
          >
            <div className={`icon-tile ${item.tileClass} w-14 h-14 shadow-hard-xs transform -rotate-2 overflow-hidden bg-white`}>
              <Image src={item.iconSrc} alt={item.title} width={56} height={56} className="object-cover" />
            </div>
            <div className="mt-2">
              <div className="font-display font-bold text-3xl text-ink leading-none">{item.value}</div>
              <div className="font-display text-xs font-bold uppercase tracking-wider text-ink/60 mt-1.5">{item.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Bar Chart */}
        <div
          className="col-span-4 bg-card rounded-2xl overflow-hidden"
          style={{ border: '3px solid #111111', boxShadow: '8px 8px 0 #111111' }}
        >
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '3px solid #111111' }}>
            <div>
              <div className="font-display font-bold text-lg text-foreground">Volunteers per Model</div>
              <div className="font-display text-xs text-foreground/50 mt-0.5">Live volunteer count per exhibition model</div>
            </div>
            <div className="icon-tile icon-tile-lime w-10 h-10">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="p-5">
            <div className="h-[280px] w-full">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-foreground/40 font-display">
                  No records yet. Allocate volunteers to see statistics.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#11111115" />
                    <XAxis dataKey="name" stroke="#111111" fontSize={11} tickLine={false} axisLine={false} fontFamily="Fredoka" />
                    <YAxis stroke="#111111" fontSize={11} tickLine={false} axisLine={false} fontFamily="Fredoka" />
                    <Tooltip
                      cursor={{ fill: 'rgba(188,166,255,0.15)' }}
                      contentStyle={{ border: '2px solid #111111', borderRadius: 10, fontFamily: 'Fredoka' }}
                    />
                    <Bar dataKey="volunteers" fill="#BCA6FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div
          className="col-span-3 bg-card rounded-2xl overflow-hidden"
          style={{ border: '3px solid #111111', boxShadow: '8px 8px 0 #111111' }}
        >
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '3px solid #111111' }}>
            <div>
              <div className="font-display font-bold text-lg text-foreground">Activity Feed</div>
              <div className="font-display text-xs text-foreground/50 mt-0.5">Latest database actions</div>
            </div>
            <div className="icon-tile icon-tile-lavender w-10 h-10">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-5">
              {activities.length === 0 ? (
                <div className="text-center text-sm py-12 text-foreground/40 font-display">
                  No recent activities logged.
                </div>
              ) : (
                activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="icon-tile icon-tile-lime w-9 h-9 shrink-0">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-foreground leading-snug truncate">{activity.action}</p>
                      <p className="font-display text-xs text-foreground/50 mt-0.5">{activity.user}</p>
                    </div>
                    <div className="font-display text-[11px] font-semibold text-foreground/40 whitespace-nowrap shrink-0">
                      {activity.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <QRScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />
    </div>
  )
}
