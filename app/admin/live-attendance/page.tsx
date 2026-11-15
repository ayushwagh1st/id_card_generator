'use client'

import { useCallback, useEffect, useState } from 'react'
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Activity, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getLiveAttendanceFeedAction } from '@/server/actions/attendance'
import { GlassCard } from '@/components/ui/GlassCard'
import { LoadError } from '@/components/ui/load-error'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

export default function LiveAttendancePage() {
  const [liveFeed, setLiveFeed] = useState<any[]>([])
  const [stats, setStats] = useState({ todayCheckins: 0, todayLates: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshFeed = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getLiveAttendanceFeedAction()
      if (response.error) throw new Error(response.error)
      const data = response.data || []
      setLiveFeed(data)
      setStats({ todayCheckins: data.filter((item: any) => item.attendance_status === 'Present').length, todayLates: data.filter((item: any) => item.attendance_status === 'Late').length })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshFeed()

    if (typeof window !== 'undefined' && !navigator.onLine) return

    const supabase = createClient()
    const channel = supabase
      .channel('realtime_attendance')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance' },
        async () => {
          await refreshFeed()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshFeed])

  return (
    <div className="space-y-6">
      <PageHeader title="Live attendance" description="Volunteer check-ins and late arrivals recorded today." actions={<Button variant="outline" onClick={() => void refreshFeed()} disabled={loading}><RefreshCw size={16} aria-hidden="true" />Refresh feed</Button>} />
      {!error && !loading && <dl className="overview-context"><div><dt>Present</dt><dd>{stats.todayCheckins}</dd></div><div><dt>Late arrivals</dt><dd>{stats.todayLates}</dd></div></dl>}

      <GlassCard className="p-0 overflow-hidden" glowColor="purple">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Recent Scans Feed</h3>
            <p className="text-xs text-slate-400">Live feed of the latest 50 scans recorded today</p>
          </div>
          <Activity className="w-5 h-5 text-blue-500" />
        </div>

        <div className="p-0">
          {loading && liveFeed.length === 0 ? <p className="task-empty" role="status">Loading attendance records…</p> : error ? <LoadError message={error} onRetry={() => void refreshFeed()} retrying={loading} /> : liveFeed.length === 0 ? (
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
