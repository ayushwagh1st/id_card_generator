'use client'

import { useEffect, useReducer } from 'react'
import dynamic from 'next/dynamic'
import {
  Users,
  Database,
  CheckCircle2,
  Clock,
  BarChart2,
  Activity,
  TrendingUp,
  ScanLine,
  Sparkles,
  ShieldCheck,
  Printer,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { getDashboardStatsAction } from '@/server/actions/dashboard'
import { QRScannerDialog } from '@/components/QRScannerDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassCard } from '@/components/ui/GlassCard'
import { motion } from 'framer-motion'
import Link from 'next/link'

const VolunteersChart = dynamic(() => import('@/components/dashboard/VolunteersChart'), {
  ssr: false,
})

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
            loading: false,
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
        attendancePercentage: 0,
        totalChildren: 0,
        checkedInChildren: 0,
      },
      chartData: [],
      activities: [],
      scannerOpen: false,
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
    {
      title: 'Registered Children',
      value: state.stats.totalChildren.toLocaleString(),
      icon: Users,
      glow: 'blue' as const,
      badge: '+12% this week',
    },
    {
      title: 'Children Checked In',
      value: state.stats.checkedInChildren.toLocaleString(),
      icon: CheckCircle2,
      glow: 'purple' as const,
      badge: 'Live Status',
    },
    {
      title: 'Active Volunteers',
      value: state.stats.totalVolunteers.toLocaleString(),
      icon: ShieldCheck,
      glow: 'cyan' as const,
      badge: 'Verified',
    },
    {
      title: 'Exhibition Models',
      value: state.stats.totalModels.toString(),
      icon: Database,
      glow: 'indigo' as const,
      badge: 'Active Slots',
    },
    {
      title: 'Total Sessions',
      value: state.stats.totalSessions.toString(),
      icon: Calendar,
      glow: 'blue' as const,
      badge: 'Scheduled',
    },
    {
      title: 'Attendance Rate',
      value: `${state.stats.attendancePercentage}%`,
      icon: TrendingUp,
      glow: 'purple' as const,
      badge: 'Optimal',
    },
  ]

  if (state.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[380px] rounded-3xl" />
          <Skeleton className="col-span-3 h-[380px] rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Keynote Hero Banner */}
      <GlassCard className="p-8 md:p-10 relative overflow-hidden" glowColor="blue">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Spatial Mesh Active</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Super Admin <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent">Control Center</span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Unified command portal for volunteer credentials, real-time security tracking, and batch badge operations across all event divisions.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_SCANNER_OPEN', payload: true })}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
              >
                <ScanLine className="w-4 h-4" />
                Quick Scan ID
              </button>

              <Link
                href="/admin/print"
                className="px-5 py-2.5 rounded-2xl glass-pill text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-blue-500" />
                Print Studio
              </Link>
            </div>
          </div>

          {/* Metric Pill Badge */}
          <div className="hidden lg:flex flex-col items-center justify-center p-6 rounded-3xl glass-panel border border-white/40 dark:border-slate-700/50 shadow-xl space-y-2 min-w-[200px]">
            <Sparkles className="w-8 h-8 text-blue-500 animate-bounce" />
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {state.stats.totalVolunteers + state.stats.totalChildren}
            </div>
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest text-center">
              Total Managed Entities
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Grid of Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
            >
              <GlassCard className="p-5" glowColor={item.glow}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    {item.badge}
                  </span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {item.value}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {item.title}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      {/* Chart & Activity Feed Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Volunteers Per Model Chart */}
        <GlassCard className="col-span-4 p-6" glowColor="indigo">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/50 dark:border-slate-800/60">
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                Volunteers Allocation Per Model
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribution of assigned workforce across active models
              </p>
            </div>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="h-[280px] w-full pt-2">
            <VolunteersChart data={state.chartData} />
          </div>
        </GlassCard>

        {/* Live Activity Feed */}
        <GlassCard className="col-span-3 p-6" glowColor="purple">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/50 dark:border-slate-800/60">
            <div>
              <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                Spatial Activity Feed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live audit trail of check-ins and admin updates
              </p>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
            {state.activities.length === 0 ? (
              <div className="text-center text-xs py-12 text-slate-400">
                No recent activity events logged.
              </div>
            ) : (
              state.activities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-snug truncate">
                      {activity.action}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {activity.user}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {activity.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      <QRScannerDialog
        isOpen={state.scannerOpen}
        onClose={() => dispatch({ type: 'SET_SCANNER_OPEN', payload: false })}
        onScanSuccess={(decodedText) => {
          toast.success(`Scanned QR: ${decodedText}`)
          dispatch({ type: 'SET_SCANNER_OPEN', payload: false })
        }}
      />
    </div>
  )
}
