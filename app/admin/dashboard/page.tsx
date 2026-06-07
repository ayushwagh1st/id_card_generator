'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, Database, CheckCircle, Clock, Loader2, BarChart2, TrendingUp, Activity, ScanLine } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { getDashboardStatsAction } from '@/app/actions/dashboard'
import { QRScannerDialog } from '@/components/QRScannerDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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
    { title: 'Total Volunteers', value: stats.totalVolunteers.toLocaleString(), icon: Users, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { title: 'Exhibition Models', value: stats.totalModels.toString(), icon: Database, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
    { title: 'Total Sessions', value: stats.totalSessions.toString(), icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { title: 'Today\'s Sessions', value: stats.todaySessions.toString(), icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { title: 'Total Lecturers', value: stats.totalLecturers.toLocaleString(), icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { title: 'Attendance %', value: `${stats.attendancePercentage}%`, icon: BarChart2, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Banner Skeleton */}
        <Skeleton className="h-32 w-full rounded-2xl" />
        
        {/* Grid Statistics Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>

        {/* Chart and Activities Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[400px] rounded-xl" />
          <Skeleton className="col-span-3 h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Super Admin Hub</h1>
            <p className="text-indigo-100 mt-2 text-sm max-w-xl">
              Live overview of volunteer networks, approval statistics, and division allocations.
            </p>
          </div>
          <Button 
            onClick={() => setScannerOpen(true)}
            variant="secondary" 
            className="w-full md:w-auto bg-white/20 hover:bg-white/30 text-white border-0 shadow-sm backdrop-blur-md font-bold"
          >
            <ScanLine className="w-4 h-4 mr-2" />
            Scan ID Card
          </Button>
        </div>
      </div>

      {/* Grid Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statItems.map((item, i) => (
          <Card key={i} className="shadow-md hover:shadow-lg transition-all duration-300 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {item.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-black text-foreground tracking-tight">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart and Activities */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recharts chart */}
        <Card className="col-span-4 shadow-lg border-primary/10 bg-card overflow-hidden">
          <CardHeader className="border-b border-primary/5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Volunteers per Model</CardTitle>
                <CardDescription className="text-xs">Live volunteer count per exhibition model</CardDescription>
              </div>
              <BarChart2 className="w-5 h-5 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full mt-2">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No records to display. Allocate volunteers to see statistics.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.56 0.21 260)" stopOpacity={1}/>
                        <stop offset="100%" stopColor="oklch(0.68 0.18 250)" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 240 / 40%)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
                    <Bar dataKey="volunteers" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent activities */}
        <Card className="col-span-3 shadow-lg border-primary/10 bg-card overflow-hidden">
          <CardHeader className="border-b border-primary/5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">System Activity Feed</CardTitle>
                <CardDescription className="text-xs">Latest database actions and scans tracked</CardDescription>
              </div>
              <Activity className="w-5 h-5 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {activities.length === 0 ? (
                <div className="text-center text-sm py-12 text-muted-foreground">
                  No recent activities logged.
                </div>
              ) : (
                activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 mt-0.5">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-bold leading-none text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {activity.user}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <QRScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />
    </div>
  )
}
