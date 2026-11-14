'use client'

import { useEffect, useState, useCallback } from 'react'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FileText, Download, Activity, CheckCircle, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'
import { getSessionAttendanceAction } from '@/server/actions/attendance'
import { getSessionsAction } from '@/server/actions/sessions'
import { GlassCard } from '@/components/ui/GlassCard'

export default function LecturerReportsPage() {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('none')
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])

  useEffect(() => {
    async function loadSessions() {
      try {
        const result = await getSessionsAction()
        const sessionList = Array.isArray(result) ? result : (result?.data || [])
        setSessions(sessionList)
        if (sessionList.length > 0) {
          setSelectedSessionId(sessionList[0].id)
        }
      } catch (err: any) {
        toast.error('Failed to load sessions list')
      }
    }
    loadSessions()
  }, [])

  const fetchAttendance = useCallback(async (sessionId: string) => {
      if (sessionId === 'none') {
          setAttendanceRecords([])
          return
      }
      setLoading(true)
      try {
          const res = await getSessionAttendanceAction(sessionId)
          setAttendanceRecords(res.data || [])
      } catch (err: any) {
          toast.error('Failed to load attendance logs')
      } finally {
          setLoading(false)
      }
  }, [])

  useEffect(() => {
      if (selectedSessionId !== 'none') {
          fetchAttendance(selectedSessionId)
      }
  }, [selectedSessionId, fetchAttendance])

  const formatSessionLabel = (s: any) => {
    if (!s) return ''
    const parts = [s.title || s.name]
    if (s.date) parts.push(s.date)
    if (s.models?.name) parts.push(`(${s.models.name})`)
    return parts.join(' - ')
  }

  const handleExportCSV = () => {
    if (attendanceRecords.length === 0) return
    
    const session = sessions.find(s => s.id === selectedSessionId)
    const sessionName = session ? (session.title || session.name) : 'Session'

    const headers = ['SNK ID', 'Volunteer Name', 'Check In Time', 'Status']
    const rows = attendanceRecords.map(r => [
        r.volunteer?.snk_id || '',
        r.volunteer?.full_name || '',
        r.created_at ? new Date(r.created_at).toLocaleString() : '',
        r.status || 'Present'
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join("\n")

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
    const sessionName = session ? (session.title || session.name) : 'Session'

    const headers = ['SNK ID', 'Volunteer Name', 'Check In Time', 'Status']
    const rows = attendanceRecords.map(r => [
        r.volunteer?.snk_id || '',
        r.volunteer?.full_name || '',
        r.created_at ? new Date(r.created_at).toLocaleString() : '',
        r.status || 'Present'
    ])

    exportToPDF({
        title: `Attendance: ${sessionName}`,
        subtitle: `Official attendance records logged for ${session?.date || 'Session'}`,
        filename: `${sessionName.replace(/\s+/g, '_')}_Attendance.pdf`,
        headers,
        data: rows,
        themeColor: [59, 130, 246]
      })
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-8 sm:p-10" glowColor="blue">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500">
              <FileText className="w-4 h-4" />
              <span>Attendance Reports</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Security Attendance Logs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              View and export attendance logs for your assigned venue security shifts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button 
              onClick={handleExportCSV} 
              disabled={attendanceRecords.length === 0}
              variant="outline"
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Export CSV
            </Button>
            <Button 
              onClick={handleExportPDF} 
              disabled={attendanceRecords.length === 0}
              className="gap-2 shadow-lg shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6" glowColor="cyan">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Label htmlFor="attendance-report-session" className="font-semibold text-xs uppercase tracking-wider text-slate-400 shrink-0">Select Active Session:</Label>
          <Select value={selectedSessionId} onValueChange={(val: any) => setSelectedSessionId(val)}>
            <SelectTrigger id="attendance-report-session" className="w-full sm:w-[400px]">
              <span data-slot="select-value" className="flex flex-1 text-left truncate">
                {selectedSessionId !== 'none' && sessions.length > 0
                  ? formatSessionLabel(sessions.find(s => s.id === selectedSessionId))
                  : "-- Select a Session --"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Select a Session --</SelectItem>
              {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id}>{formatSessionLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {selectedSessionId !== 'none' && (
        <GlassCard className="p-0 overflow-hidden" glowColor="purple">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Attendance Check-in Log</h3>
              <p className="text-xs text-slate-400">Scanned attendee check-ins</p>
            </div>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-2xl" />
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Check-in Scans Logged</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">No volunteers have checked in for this session yet.</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SNK ID</TableHead>
                      <TableHead>Volunteer Name</TableHead>
                      <TableHead>Check In Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs font-semibold text-blue-500">
                          {record.volunteer?.snk_id || 'Pending'}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 dark:text-white">{record.volunteer?.full_name}</TableCell>
                        <TableCell className="text-slate-400 text-xs font-mono">
                          {record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            {record.status || 'Present'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
