'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FileText, Download, CheckCircle, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { getSessionsAction } from '@/app/actions/sessions'
import { getSessionAttendanceAction } from '@/app/actions/attendance'
import { createClient } from '@/lib/supabase/client'

export default function LecturerReportsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('none')
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchSessions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await getSessionsAction(1, 100, '', 'all', user.id)
      setSessions(res.data || [])
    } catch (err: any) {
      toast.error('Failed to load sessions')
    }
  }, [supabase.auth])

  const fetchAttendance = useCallback(async () => {
    if (selectedSessionId === 'none') {
        setAttendanceRecords([])
        return
    }
    setLoading(true)
    try {
      const res = await getSessionAttendanceAction(selectedSessionId)
      setAttendanceRecords(res.data || [])
    } catch (err: any) {
      toast.error('Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [selectedSessionId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const handleExportCSV = () => {
      if (attendanceRecords.length === 0) return
      
      const session = sessions.find(s => s.id === selectedSessionId)
      const sessionName = session ? session.name : 'Session'
      
      const headers = ['SNK ID', 'Name', 'Mobile', 'Status', 'Date', 'Check-In', 'Check-Out']
      const rows = attendanceRecords.map(r => [
          r.volunteer?.snk_id || 'Pending',
          r.volunteer?.full_name || 'N/A',
          r.volunteer?.mobile_number || 'N/A',
          r.attendance_status || 'N/A',
          r.attendance_date || 'N/A',
          r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : 'N/A',
          r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : 'N/A'
      ])

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join("\n")

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `${sessionName.replace(/\s+/g, '_')}_Attendance.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Attendance Reports</h1>
            <p className="text-teal-100 mt-2 text-sm max-w-xl">
              View and export attendance records for your assigned sessions.
            </p>
          </div>
          <Button 
            onClick={handleExportCSV} 
            disabled={attendanceRecords.length === 0}
            variant="secondary" 
            className="w-full md:w-auto bg-white/20 hover:bg-white/30 text-white border-0 shadow-sm backdrop-blur-md font-bold"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-primary/10 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <Label className="font-bold whitespace-nowrap">Select Session:</Label>
        <Select value={selectedSessionId} onValueChange={(val: any) => setSelectedSessionId(val)}>
          <SelectTrigger className="w-full sm:w-[400px]">
            <SelectValue placeholder="Choose a session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Select a Session --</SelectItem>
            {sessions.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({s.date})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSessionId !== 'none' && (
          <Card className="shadow-lg border-primary/10 overflow-hidden backdrop-blur-md bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                  <div>
                      <CardTitle className="text-lg">Attendance Log</CardTitle>
                      <CardDescription>Records for selected session.</CardDescription>
                  </div>
                  <FileText className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0">
                  {loading ? (
                    <div className="p-4 space-y-4">
                      <div className="rounded-md border">
                        <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                  <Table>
                      <TableHeader className="bg-muted/40">
                          <TableRow>
                              <TableHead>SNK ID</TableHead>
                              <TableHead>Volunteer Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Check-In</TableHead>
                              <TableHead>Check-Out</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {attendanceRecords.map(rec => (
                              <TableRow key={rec.id}>
                                  <TableCell className="font-medium text-xs">{rec.volunteer?.snk_id || 'Pending'}</TableCell>
                                  <TableCell className="font-semibold">{rec.volunteer?.full_name}</TableCell>
                                  <TableCell>
                                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold w-fit ${
                                          rec.attendance_status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                          rec.attendance_status === 'Late' ? 'bg-amber-100 text-amber-700' :
                                          'bg-rose-100 text-rose-700'
                                      }`}>
                                          {rec.attendance_status === 'Present' && <CheckCircle className="w-3.5 h-3.5" />}
                                          {rec.attendance_status === 'Late' && <Clock className="w-3.5 h-3.5" />}
                                          {rec.attendance_status === 'Absent' && <XCircle className="w-3.5 h-3.5" />}
                                          {rec.attendance_status}
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-sm">{rec.attendance_date}</TableCell>
                                  <TableCell className="text-sm">
                                      {rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                      {rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                  </TableCell>
                              </TableRow>
                          ))}
                          {!loading && attendanceRecords.length === 0 && (
                              <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No attendance records found.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
                  )}
              </CardContent>
          </Card>
      )}
    </div>
  )
}
