'use client'

import { useEffect, useReducer } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, Database, CheckCircle, Clock, BarChart2, Activity, TrendingUp, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { getDashboardStatsAction } from '@/server/actions/dashboard'
import { QRScannerDialog } from '@/components/QRScannerDialog'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

const VolunteersChart = dynamic(() => import('@/components/dashboard/VolunteersChart'), { ssr: false })

export default function AdminDashboard() {
  const [state, dispatch] = useReducer(
    (state: any, action: any) => {
      switch (action.type) {
        case 'SET_DATA':
          return {
            ...state,
            stats: action.payload.stats,
            chartData: action.payload.chartData,
            activities: action.payload.activities,
            loading: false
          }
        case 'SET_SCANNER_OPEN':
          return { ...state, scannerOpen: action.payload }
        case 'SET_LOADING':
          return { ...state, loading: action.payload }
        default:
          return state
      }
    },
    {
      loading: true,
      stats: {
        totalVolunteers: 0,
        totalModels: 0,
        approvedCount: 0,
        pendingCount: 0,
        totalSessions: 0,
        totalLecturers: 0,
        todaySessions: 0,
        attendancePercentage: 0
      },
      chartData: [],
      activities: [],
      scannerOpen: false
    }
  )

  const fetchDashboardData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const data = await getDashboardStatsAction()
      dispatch({ type: 'SET_DATA', payload: data })
    } catch (err: any) {
      toast.error(err.message || 'Error compiling dashboard data')
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const statItems = [
    { title: 'Total Volunteers', value: state.stats.totalVolunteers.toLocaleString(), iconSrc: '/images/icons/icon_users.png', tileClass: 'icon-tile-lime' },
    { title: 'Exhibition Models', value: state.stats.totalModels.toString(), iconSrc: '/images/icons/icon_database.png', tileClass: 'icon-tile-lavender' },
    { title: 'Total Sessions', value: state.stats.totalSessions.toString(), iconSrc: '/images/icons/icon_check.png', tileClass: 'icon-tile-ink' },
    { title: "Today's Sessions", value: state.stats.todaySessions.toString(), iconSrc: '/images/icons/icon_clock.png', tileClass: 'icon-tile-lime' },
    { title: 'Total Security Personnel', value: state.stats.totalLecturers.toLocaleString(), iconSrc: '/images/icons/icon_users.png', tileClass: 'icon-tile-lavender' },
    { title: 'Attendance %', value: `${state.stats.attendancePercentage}%`, iconSrc: '/images/icons/icon_chart.png', tileClass: 'icon-tile-ink' },
  ]

  if (state.loading) {
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
      <div className="rounded-[24px] bg-gradient-to-r from-[#fcfaff] to-[#f6f4ff] p-8 md:p-12 border border-[#f0ebff] shadow-sm relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="relative z-10 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ecfdf3] text-[#027a48] text-xs font-semibold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-[#12b76a]"></span> System Online
          </div>
          
          <div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-slate-900">
              Super Admin <span className="text-[#8C6DFD]">Hub</span>
            </h1>
            <div className="w-12 h-1 bg-[#8C6DFD] rounded-full mt-4 opacity-80"></div>
          </div>
          
          <p className="font-sans text-slate-500 text-lg max-w-md leading-relaxed">
            Live overview of volunteer networks, approval statistics, and division allocations.
          </p>
          
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_SCANNER_OPEN', payload: true })}
            className="inline-flex items-center justify-center gap-2 bg-[#8C6DFD] hover:bg-[#795de6] text-white px-6 py-3 rounded-xl font-medium transition-colors w-full sm:w-auto shadow-sm"
          >
            <ScanLine className="w-5 h-5" />
            Quick Scan ID
          </button>
        </div>

        <div className="hidden md:block relative z-10 w-full max-w-[350px] aspect-square transition-transform duration-500 group-hover:scale-105">
          <Image 
            src="/images/admin_dashboard_illustration.png" 
            alt="Control Center" 
            fill
            priority
            className="object-contain drop-shadow-xl"
            sizes="(max-width: 768px) 100vw, 350px"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statItems.map((item) => (
          <div
            key={item.title}
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
              <VolunteersChart data={state.chartData} />
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
              {state.activities.length === 0 ? (
                <div className="text-center text-sm py-12 text-foreground/40 font-display">
                  No recent activities logged.
                </div>
              ) : (
                state.activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3">
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

      <QRScannerDialog open={state.scannerOpen} onOpenChange={(val) => dispatch({ type: 'SET_SCANNER_OPEN', payload: val })} />
    </div>
  )
}
