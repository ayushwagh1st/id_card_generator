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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
              Live Attendance
            </h1>
            <p className="text-cyan-100 mt-2 text-sm max-w-xl">
              Watch volunteer check-ins as they happen in real-time across all sessions.
            </p>
          </div>
          <div className="flex gap-4">
              <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md text-center">
                  <div className="text-2xl font-black">{stats.todayCheckins}</div>
                  <div className="text-xs uppercase font-bold tracking-wider opacity-80">Present</div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md text-center">
                  <div className="text-2xl font-black">{stats.todayLates}</div>
                  <div className="text-xs uppercase font-bold tracking-wider opacity-80">Late</div>
              </div>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-primary/10 overflow-hidden backdrop-blur-md bg-card">
          <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Recent Scans
              </CardTitle>
              <CardDescription>Live feed of the last 50 scans for today.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
              {liveFeed.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                      No attendance scans recorded today yet.
                  </div>
              ) : (
                  <div className="divide-y divide-primary/5">
                      {liveFeed.map(feed => (
                          <div key={feed.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors animate-in slide-in-from-top-2">
                              <div className="flex items-start gap-4">
                                  <div className={`mt-1 p-2 rounded-full ${
                                      feed.attendance_status === 'Present' ? 'bg-emerald-100 text-emerald-600' :
                                      feed.attendance_status === 'Late' ? 'bg-amber-100 text-amber-600' :
                                      'bg-gray-100 text-gray-600'
                                  }`}>
                                      {feed.attendance_status === 'Present' && <CheckCircle className="w-5 h-5" />}
                                      {feed.attendance_status === 'Late' && <Clock className="w-5 h-5" />}
                                      {feed.attendance_status === 'Absent' && <XCircle className="w-5 h-5" />}
                                  </div>
                                  <div>
                                      <p className="font-bold text-base">{feed.volunteer?.full_name} <span className="text-muted-foreground text-xs font-normal ml-2">({feed.volunteer?.snk_id || 'Pending'})</span></p>
                                      <p className="text-sm text-muted-foreground font-medium mt-0.5">{feed.session?.name || 'Unknown Session'}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                      {feed.check_out_time ? 'Checked Out' : 'Checked In'}
                                  </div>
                                  <div className="text-sm font-semibold mt-0.5">
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
      </Card>
    </div>
  )
}
