'use client'

import { useEffect, useState } from 'react'
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Activity, CheckCircle, Clock, XCircle, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getLiveAttendanceFeedAction } from '@/server/actions/attendance'
import { toast } from 'sonner'
import { GlassCard } from '@/components/ui/GlassCard'

export default function LiveAttendancePage() {
  const [liveFeed, setLiveFeed] = useState<any[]>([])
  const [stats, setStats] = useState({ todayCheckins: 0, todayLates: 0 })

  useEffect(() => {
    async function initFeed() {
      try {
        const res: any = await getLiveAttendanceFeedAction()
        const data = res?.data || []
        setLiveFeed(data)

        const present = data.filter((d: any) => d.attendance_status === 'Present').length
        const late = data.filter((d: any) => d.attendance_status === 'Late').length
        setStats({ todayCheckins: present, todayLates: late })
      } catch (err: any) {
        toast.error('Failed to load initial attendance feed')
      }
    }

    initFeed()

    if (typeof window !== 'undefined' && !navigator.onLine) return

    const supabase = createClient()
    const channel = supabase
      .channel('realtime_attendance')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance' },
        async () => {
          const freshRes: any = await getLiveAttendanceFeedAction()
          const freshData = freshRes?.data || []
          setLiveFeed(freshData)
          
          const present = freshData.filter((d: any) => d.attendance_status === 'Present').length
          const late = freshData.filter((d: any) => d.attendance_status === 'Late').length
          setStats({ todayCheckins: present, todayLates: late })

          toast.info(`New Check-in recorded!`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-6">
      <GlassCard className="p-8 sm:p-10" glowColor="blue">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500">
              <Zap className="w-4 h-4" />
              <span>Real-Time Monitor</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Live Attendance Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Watch volunteer venue check-ins as they happen in real-time across all active exhibition sessions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[90px]">
              <div className="text-2xl font-bold text-emerald-500 tracking-tight">{stats.todayCheckins}</div>
              <div className="text-[10px] font-mono uppercase font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Present</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center min-w-[90px]">
              <div className="text-2xl font-bold text-amber-500 tracking-tight">{stats.todayLates}</div>
              <div className="text-[10px] font-mono uppercase font-semibold text-amber-600 dark:text-amber-400 mt-0.5">Late</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden" glowColor="purple">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Recent Scans Feed</h3>
            <p className="text-xs text-slate-400">Live feed of the latest 50 scans recorded today</p>
          </div>
          <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
        </div>

        <div className="p-0">
          {liveFeed.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Waiting for Check-ins...</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">No attendance scans have been recorded today yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50 dark:divide-slate-800/60">
              {liveFeed.map((feed) => (
                <div key={feed.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/40 dark:hover:bg-slate-900/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      feed.attendance_status === 'Present' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      feed.attendance_status === 'Late' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {feed.attendance_status === 'Present' && <CheckCircle className="w-4 h-4" />}
                      {feed.attendance_status === 'Late' && <Clock className="w-4 h-4" />}
                      {feed.attendance_status === 'Absent' && <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">
                        {feed.volunteer?.full_name} <span className="text-slate-400 text-xs font-mono font-normal ml-1">({feed.volunteer?.snk_id || 'Pending'})</span>
                      </p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{feed.session?.name || 'Unknown Session'}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-400">
                    {feed.created_at ? new Date(feed.created_at).toLocaleTimeString() : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
