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
import { formatSessionLabel } from '@/lib/formatters'
import { getSessionAttendanceAction } from '@/app/actions/attendance'
import { createClient } from '@/lib/supabase/client'
import { exportToPDF } from '@/lib/pdf'

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
      const role = user.user_metadata?.role
      const lecturerFilter = role === 'LECTURER' ? user.id : 'all'
      const res = await getSessionsAction(1, 100, '', 'all', lecturerFilter)
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

  const handleExportPDF = () => {
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

      exportToPDF({
        title: `${sessionName} Attendance Report`,
        subtitle: 'Official attendance records for this session',
        filename: `${sessionName.replace(/\s+/g, '_')}_Attendance.pdf`,
        headers,
        data: rows,
        themeColor: [13, 148, 136] // Teal theme for Lecturer
      })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-[32px] bg-[var(--color-blue)] p-6 md:p-10 text-white border-ink shadow-hard pattern-grid relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between w-full md:items-end gap-4">
          <div className="space-y-3">
            <div className="inline-flex badge-flat bg-white text-ink border-ink transform -rotate-2">
              <FileText className="w-4 h-4 mr-2 text-ink" /> Reports
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-white">Attendance Reports</h1>
            <p className="font-sans font-medium text-white/80 text-lg max-w-xl">
              View and export attendance records for your assigned sessions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportCSV} 
              disabled={attendanceRecords.length === 0}
              className="bg-white text-ink border-ink shadow-hard-xs hover:bg-muted font-bold h-11 px-5 rounded-xl transform transition-transform hover:-translate-y-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={handleExportPDF} 
              disabled={attendanceRecords.length === 0}
              className="bg-white text-ink border-ink shadow-hard-xs hover:bg-muted font-bold h-11 px-5 rounded-xl transform transition-transform hover:-translate-y-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="bento-white p-4 rounded-[20px] border-ink shadow-hard flex flex-col sm:flex-row gap-4 items-center">
        <Label className="font-bold whitespace-nowrap text-ink">Select Session:</Label>
        <Select value={selectedSessionId} onValueChange={(val: any) => setSelectedSessionId(val)}>
          <SelectTrigger className="w-full sm:w-[400px] border-ink shadow-hard-xs bg-white text-ink font-semibold rounded-xl">
            <span data-slot="select-value" className="flex flex-1 text-left truncate">
              {selectedSessionId !== 'none' && sessions.length > 0
                ? formatSessionLabel(sessions.find(s => s.id === selectedSessionId))
                : "-- Select a Session --"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Select a Session --</SelectItem>
            {sessions.map(s => (
                <SelectItem key={s.id} value={s.id} label={formatSessionLabel(s)}>{formatSessionLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSessionId !== 'none' && (
          <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard !p-0">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-ink/10 bg-muted/20">
                  <div>
                      <CardTitle className="text-lg font-bold text-ink">Attendance Log</CardTitle>
                      <CardDescription>Records for selected session.</CardDescription>
                  </div>
                  <FileText className="w-5 h-5 text-blue-500" />
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
                                  <TableCell className="font-bold text-xs">{rec.volunteer?.snk_id || 'Pending'}</TableCell>
                                  <TableCell className="font-semibold text-ink">{rec.volunteer?.full_name}</TableCell>
                                  <TableCell>
                                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit border ${
                                          rec.attendance_status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          rec.attendance_status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                          'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}>
                                          {rec.attendance_status === 'Present' && <CheckCircle className="w-3.5 h-3.5" />}
                                          {rec.attendance_status === 'Late' && <Clock className="w-3.5 h-3.5" />}
                                          {rec.attendance_status === 'Absent' && <XCircle className="w-3.5 h-3.5" />}
                                          {rec.attendance_status}
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-sm font-medium">{rec.attendance_date}</TableCell>
                                  <TableCell className="text-sm font-medium">
                                      {rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                  </TableCell>
                                  <TableCell className="text-sm font-medium">
                                      {rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                  </TableCell>
                              </TableRow>
                          ))}
                          {!loading && attendanceRecords.length === 0 && (
                              <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-semibold">No attendance records found.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
                  )}
              </CardContent>
          </div>
      )}
    </div>
  )
}
