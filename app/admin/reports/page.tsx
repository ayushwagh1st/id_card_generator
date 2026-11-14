'use client'

import { useEffect, useState } from 'react'
import { CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Activity, Users, Database, Shield, LayoutGrid } from 'lucide-react'
import { getActivitiesAction } from '@/server/actions/activity'
import { getVolunteerReportData, getSessionReportData, getModelReportData, getSecurityReportData, getRegisteredChildrenReportData } from '@/server/actions/reports'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { exportToPDF, PDFSummaryStat } from '@/lib/pdf'
import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ExportMenu } from '@/components/ui/export-menu'

const reports = [
  {
    id: 'children',
    title: 'Registered Children',
    description: 'List of all children registered via QR stickers.',
    icon: Users,
    color: 'lavender'
  },
  {
    id: 'volunteers',
    title: 'Volunteer Analytics',
    description: 'Demographics, department breakdowns, and assigned models.',
    icon: Users,
    color: 'pink'
  },
  {
    id: 'sessions',
    title: 'Session Analytics',
    description: 'Attendance rates, session capacities, and checkouts.',
    icon: LayoutGrid,
    color: 'mint'
  },
  {
    id: 'models',
    title: 'Models Overview',
    description: 'Allocation of volunteers across exhibition models.',
    icon: Database,
    color: 'blue'
  },
  {
    id: 'security',
    title: 'Security Roster',
    description: 'List of all active security personnel and staff.',
    icon: Shield,
    color: 'lavender'
  },
  {
    id: 'activity',
    title: 'System Audit Log',
    description: 'Export the recent global activity feed.',
    icon: Activity,
    color: 'orange'
  }
]

export default function AdminReportsPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await getActivitiesAction(100)
      if (res.error) {
        toast.error('Failed to load activity logs')
      } else {
        setActivities(res.data || [])
      }
    } catch (err: any) {
      toast.error('Error fetching activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const handleGenerateReport = async (type: string, format: 'pdf' | 'csv' = 'pdf') => {
    setGenerating(type)
    try {
      let headers: string[] = []
      let rows: any[][] = []
      let title = ''
      let subtitle = ''
      let filename = ''
      let themeColor: [number, number, number] = [0, 0, 0]
      let stats: any = []

      if (type === 'children') {
        const res = await getRegisteredChildrenReportData()
        if (res.error) throw new Error(res.error)
        headers = ['Serial No', 'Name', 'Contact', 'Session', 'Registered At']
        rows = res.data!.map(c => [
          c.serial_number || 'N/A',
          c.name,
          c.contact_number || 'N/A',
          c.session_name || 'N/A',
          new Date(c.created_at).toLocaleString()
        ])
        title = 'Registered Children Directory'
        subtitle = 'List of all children registered via QR stickers'
        filename = 'Registered_Children_Report'
        themeColor = [139, 92, 246] // purple/lavender
        stats = res.stats
      } else if (type === 'volunteers') {
        const res = await getVolunteerReportData()
        if (res.error) throw new Error(res.error)
        headers = ['SNK ID', 'Name', 'Mobile', 'Age', 'Gender', 'Department', 'Assigned Model']
        rows = res.data!.map(v => [
          v.snk_id || 'N/A',
          v.full_name,
          v.mobile_number,
          v.age || 'N/A',
          v.gender || 'N/A',
          (v as any).department || 'N/A',
          (Array.isArray(v.models) ? v.models[0]?.name : (v.models as any)?.name) || 'Unassigned'
        ])
        title = 'Volunteer Analytics & Directory'
        subtitle = 'Comprehensive list of all registered volunteers'
        filename = 'Volunteer_Analytics_Report'
        themeColor = [244, 63, 94]
        stats = res.stats
      } else if (type === 'sessions') {
        const res = await getSessionReportData()
        if (res.error) throw new Error(res.error)
        headers = ['Session Name', 'Category', 'Date', 'Time', 'Venue', 'Lecturer', 'Status', 'Enrollments']
        rows = res.data!.map(s => {
          const countArr = s.volunteer_sessions as any
          const enrolls = Array.isArray(countArr) ? countArr[0]?.count || countArr.length : 0
          return [s.name, s.category || 'N/A', s.date, `${s.start_time} - ${s.end_time}`, s.venue || 'N/A', s.lecturer_name || 'Unassigned', s.status, `${enrolls} / ${s.capacity || '∞'}`]
        })
        title = 'Session & Attendance Analytics'
        subtitle = 'Overview of all scheduled training sessions and enrollments'
        filename = 'Session_Analytics_Report'
        themeColor = [16, 185, 129]
        stats = res.stats
      } else if (type === 'models') {
        const res = await getModelReportData()
        if (res.error) throw new Error(res.error)
        headers = ['Model Name', 'Head Name', 'Status', 'Assigned Vols']
        rows = res.data!.map(m => {
          const countArr = m.volunteers as any
          const assigned = Array.isArray(countArr) ? countArr[0]?.count || countArr.length : 0
          return [m.name, (Array.isArray(m.profiles) ? m.profiles[0]?.full_name : (m.profiles as any)?.full_name) || 'N/A', m.status, assigned]
        })
        title = 'Exhibition Models Allocation'
        subtitle = 'Directory of exhibition models and volunteer distribution'
        filename = 'Models_Allocation_Report'
        themeColor = [59, 130, 246]
        stats = res.stats
      } else if (type === 'security') {
        const res = await getSecurityReportData()
        if (res.error) throw new Error(res.error)
        headers = ['Name', 'Email / Login', 'Mobile', 'Status']
        rows = res.data!.map(s => [s.name, s.email, s.mobile || 'N/A', s.status])
        title = 'Security Personnel Roster'
        subtitle = 'Active and inactive security staff'
        filename = 'Security_Roster_Report'
        themeColor = [139, 92, 246]
        stats = res.stats
      } else if (type === 'activity') {
        if (activities.length === 0) return toast.info('No activities to export.')
        headers = ['Date', 'User', 'Role', 'Action', 'Target']
        rows = activities.map(a => [new Date(a.created_at).toLocaleString(), a.user_name || 'System', a.role, a.action_type, a.target || ''])
        title = 'System Activity Audit Log'
        subtitle = 'Latest 100 system actions'
        filename = 'System_Activity_Audit'
        themeColor = [249, 115, 22]
      }

      if (format === 'csv') {
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`${title} (CSV) generated!`)
      } else {
        exportToPDF({
          title, subtitle, filename: `${filename}.pdf`, headers, data: rows, themeColor, summaryStats: stats
        })
        toast.success(`${title} (PDF) generated!`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error generating report')
    } finally {
      setGenerating(null)
    }
  }



  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Reports" description="Choose a report and export registration or attendance records as PDF or CSV." />

      <ul className="report-list">
        {reports.map(report => {
          const Icon = report.icon
          const isGenerating = generating === report.id
          
          return (
            <li className="report-option" key={report.id}><Icon size={21} aria-hidden="true" /><div><h2>{report.title}</h2><p>{report.description}</p>{isGenerating && <p role="status">Preparing report…</p>}</div><ExportMenu label={`Export ${report.title}`} disabled={isGenerating} onCSV={() => handleGenerateReport(report.id, 'csv')} onPDF={() => handleGenerateReport(report.id, 'pdf')} /></li>
          )
        })}
      </ul>

      <GlassCard className="p-0 overflow-hidden mt-8" glowColor="purple">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Global Activity Audit Feed
            </h3>
            <p className="text-xs text-slate-400">The last 100 system audit actions</p>
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No System Activities Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Audit logs will appear here once administrative actions occur.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell className="font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(act.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-white">{act.user_name || 'System'}</TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-mono font-semibold uppercase tracking-wider">
                        {act.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
                        {act.action_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-medium max-w-xs truncate">
                      {act.target}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </GlassCard>
    </div>
  )
}
