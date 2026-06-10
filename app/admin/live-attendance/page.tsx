'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity, Clock, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function LiveAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [liveFeed, setLiveFeed] = useState<any[]>([])
  const [stats, setStats] = useState({ todayCheckins: 0, todayLates: 0 })
  const supabase = createClient()

  const fetchRecentFeed = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          attendance_status,
          check_in_time,
          check_out_time,
          volunteer:volunteer_id ( full_name, snk_id ),
          session:session_id ( name )
        `)
        .eq('attendance_date', todayStr)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setLiveFeed(data || [])
      
      const checkins = data?.filter(d => d.attendance_status === 'Present').length || 0
      const lates = data?.filter(d => d.attendance_status === 'Late').length || 0
      
      setStats({ todayCheckins: checkins, todayLates: lates })
    } catch (err: any) {
        console.error(err)
        toast.error('Failed to load live feed')
    } finally {
        setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRecentFeed()

    const channel = supabase.channel('live-attendance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
           console.log('Realtime Update:', payload)
           // Soft refresh the feed to get joined data (names, sessions)
           fetchRecentFeed()
           toast('New Attendance Scan Detected', {
               icon: <Activity className="w-4 h-4 text-blue-500" />
           })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchRecentFeed])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-[32px] bg-[var(--color-purple)] p-6 md:p-10 text-white border-ink shadow-hard pattern-dots relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between w-full md:items-end gap-4">
          <div className="space-y-3">
            <div className="inline-flex badge-flat bg-white text-ink border-ink transform -rotate-2">
              <Activity className="w-4 h-4 mr-2 text-blue-500" /> Live
            </div>
            <h1 className="flex items-center gap-3 text-4xl md:text-5xl font-display font-bold leading-tight">
              <span className="relative flex h-5 w-5 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
              </span>
              Live Attendance
            </h1>
            <p className="font-sans font-medium text-white/80 text-lg max-w-xl">
              Watch volunteer check-ins as they happen in real-time across all sessions.
            </p>
          </div>
          <div className="flex gap-4">
              <div className="bento-white px-5 py-3 !rounded-2xl text-center text-ink shadow-hard-xs transform rotate-2">
                  <div className="font-display text-3xl font-black leading-none">{stats.todayCheckins}</div>
                  <div className="text-xs uppercase font-bold tracking-wider opacity-60 mt-1">Present</div>
              </div>
              <div className="bento-white px-5 py-3 !rounded-2xl text-center text-ink shadow-hard-xs transform -rotate-2">
                  <div className="font-display text-3xl font-black leading-none">{stats.todayLates}</div>
                  <div className="text-xs uppercase font-bold tracking-wider opacity-60 mt-1">Late</div>
              </div>
          </div>
        </div>
      </div>

      <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard !p-0">
          <CardHeader className="bg-muted/20 border-b border-ink/10">
              <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Recent Scans
              </CardTitle>
              <CardDescription>Live feed of the last 50 scans for today.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
              {liveFeed.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground font-semibold">
                      No attendance scans recorded today yet.
                  </div>
              ) : (
                  <div className="divide-y divide-ink/10">
                      {liveFeed.map(feed => (
                          <div key={feed.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-muted/30 transition-colors animate-in slide-in-from-top-2">
                              <div className="flex items-start gap-4">
                                  <div className={`mt-1 p-2 border-2 border-ink shadow-hard-xs rounded-xl ${
                                      feed.attendance_status === 'Present' ? 'bg-emerald-100 text-emerald-600' :
                                      feed.attendance_status === 'Late' ? 'bg-amber-100 text-amber-600' :
                                      'bg-gray-100 text-gray-600'
                                  }`}>
                                      {feed.attendance_status === 'Present' && <CheckCircle className="w-5 h-5" />}
                                      {feed.attendance_status === 'Late' && <Clock className="w-5 h-5" />}
                                      {feed.attendance_status === 'Absent' && <XCircle className="w-5 h-5" />}
                                  </div>
                                  <div>
                                      <p className="font-bold text-base text-ink">{feed.volunteer?.full_name} <span className="text-muted-foreground text-xs font-normal ml-2">({feed.volunteer?.snk_id || 'Pending'})</span></p>
                                      <p className="text-sm text-ink/70 font-medium mt-0.5">{feed.session?.name || 'Unknown Session'}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                      {feed.check_out_time ? 'Checked Out' : 'Checked In'}
                                  </div>
                                  <div className="text-sm font-semibold mt-0.5 text-ink">
                                      {feed.check_out_time 
                                          ? new Date(feed.check_out_time).toLocaleTimeString() 
                                          : feed.check_in_time 
                                            ? new Date(feed.check_in_time).toLocaleTimeString() 
                                            : '-'}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </CardContent>
      </div>
    </div>
  )
}
