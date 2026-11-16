'use client'

import { useEffect, useState, useMemo } from 'react'
import { CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Activity,
  Users,
  Database,
  Shield,
  LayoutGrid,
  FileText,
  Search,
  Loader2
} from 'lucide-react'
import { getActivitiesAction } from '@/server/actions/activity'
import {
  getVolunteerReportData,
  getSessionReportData,
  getModelReportData,
  getSecurityReportData,
  getRegisteredChildrenReportData
} from '@/server/actions/reports'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { exportToPDF, BRAND_COLORS } from '@/lib/pdf'
import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ExportMenu } from '@/components/ui/export-menu'

interface ReportDefinition {
  id: string
  title: string
  description: string
  category: string
  icon: any
  tag: string
  badgeColor: string
}

const reports: ReportDefinition[] = [
  {
    id: 'children',
    title: 'Registered Children Directory',
    description: 'Attendance records, check-in and check-out timestamps, serial numbers, and linked sessions.',
    category: 'Field Operations',
    icon: Users,
    tag: 'Attendance & QR',
    badgeColor: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
  },
  {
    id: 'volunteers',
    title: 'Volunteer Workforce & Deployment',
    description: 'Roster of active volunteers, designations, duty branches, assigned models, and accommodations.',
    category: 'Workforce',
    icon: Users,
    tag: 'Workforce & Roles',
    badgeColor: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
  },
  {
    id: 'sessions',
    title: 'Session Operations & Capacity',
    description: 'Scheduled training workshops, room venues, lead lecturers, and capacity utilization rates.',
    category: 'Schedules',
    icon: LayoutGrid,
    tag: 'Capacity & Leads',
    badgeColor: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
  },
  {
    id: 'models',
    title: 'Exhibition Models & Staffing',
    description: 'Exhibition showcase zones, supervising model heads, volunteer quotas, and coverage gaps.',
    category: 'Exhibition',
    icon: Database,
    tag: 'Model Allocation',
    badgeColor: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10'
  },
  {
    id: 'security',
    title: 'Security Personnel & Roster',
    description: 'List of authorized security personnel, system accounts, active statuses, and contact lines.',
    category: 'Security',
    icon: Shield,
    tag: 'Security & Access',
    badgeColor: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
  },
  {
    id: 'activity',
    title: 'System Activity Audit Log',
    description: 'Comprehensive audit trail of recent administrative actions, modifications, and system events.',
    category: 'Compliance',
    icon: Activity,
    tag: 'Compliance & Audit',
    badgeColor: 'border-slate-500/30 text-slate-600 dark:text-slate-400 bg-slate-500/10'
  }
]

export default function AdminReportsPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [reportFilter, setReportFilter] = useState('')
  const [auditSearch, setAuditSearch] = useState('')

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await getActivitiesAction(100)
      if (res.error) {
        toast.error('Failed to load activity logs')
      } else {
        setActivities(res.data || [])
      }
    } catch {
      toast.error('Error fetching activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const filteredReports = useMemo(() => {
    if (!reportFilter.trim()) return reports
    const q = reportFilter.toLowerCase()
    return reports.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tag.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    )
  }, [reportFilter])

  const filteredActivities = useMemo(() => {
    if (!auditSearch.trim()) return activities
    const q = auditSearch.toLowerCase()
    return activities.filter(a =>
      (a.user_name || '').toLowerCase().includes(q) ||
      (a.action_type || '').toLowerCase().includes(q) ||
      (a.target || '').toLowerCase().includes(q) ||
      (a.role || '').toLowerCase().includes(q)
    )
  }, [activities, auditSearch])

  const handleGenerateReport = async (type: string, format: 'pdf' | 'csv' = 'pdf') => {
    setGenerating(type)
    try {
      let headers: string[] = []
      let rows: any[][] = []
      let title = ''
      let subtitle = ''
      let filename = ''
      let stats: any = []

      if (type === 'children') {
        const res = await getRegisteredChildrenReportData()
        if (res.error) throw new Error(res.error)
        headers = ['Serial No', 'Name', 'Contact', 'Session', 'Status', 'Check-In', 'Check-Out', 'Registered At']
        rows = (res.data || []).map(c => [
          c.serial_number || 'N/A',
          c.name,
          c.contact_number || 'N/A',
          c.session_name || 'N/A',
          c.status || 'Registered',
          c.checked_in_at ? new Date(c.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          c.checked_out_at ? new Date(c.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          new Date(c.created_at).toLocaleString()
        ])
        title = 'Registered Children Directory & Attendance'
        subtitle = 'Official log of registered children, badge serial numbers, and attendance timestamps'
        filename = 'Registered_Children_Attendance_Report'
        stats = res.stats
      } else if (type === 'volunteers') {
        const res = await getVolunteerReportData()
        if (res.error) throw new Error(res.error)
        headers = ['SNK ID', 'Full Name', 'Mobile', 'Designation / Role', 'Branch', 'Assigned Model', 'Accomm.', 'Status']
        rows = (res.data || []).map(v => [
          v.snk_id || 'N/A',
          v.full_name,
          v.mobile_number || 'N/A',
          v.designation || 'Volunteer',
          v.branch || 'General',
          (Array.isArray(v.models) ? v.models[0]?.name : (v.models as any)?.name) || 'Unassigned',
          v.accommodation === true || String(v.accommodation).toLowerCase() === 'yes' ? 'Yes' : 'No',
          v.status || 'Pending'
        ])
        title = 'Volunteer Workforce & Deployment Roster'
        subtitle = 'Official roster of registered volunteers, duties, model assignments, and status'
        filename = 'Volunteer_Workforce_Report'
        stats = res.stats
      } else if (type === 'sessions') {
        const res = await getSessionReportData()
        if (res.error) throw new Error(res.error)
        headers = ['Session Name', 'Category', 'Date', 'Time Window', 'Venue', 'Lecturer / Lead', 'Enrollments', 'Status']
        rows = (res.data || []).map(s => {
          const countArr = s.volunteer_sessions as any
          const enrolls = Array.isArray(countArr) ? countArr[0]?.count || countArr.length : (countArr?.count || 0)
          const capDisplay = s.capacity ? `${enrolls} / ${s.capacity}` : `${enrolls}`
          return [
            s.name,
            s.category || 'General',
            s.date,
            `${s.start_time || ''} - ${s.end_time || ''}`,
            s.venue || 'Main Hall',
            s.lecturer_name || 'Unassigned',
            capDisplay,
            s.status || 'Scheduled'
          ]
        })
        title = 'Session Operations & Attendance Analytics'
        subtitle = 'Scheduled session capacities, venue distribution, and volunteer enrollment rates'
        filename = 'Session_Operations_Report'
        stats = res.stats
      } else if (type === 'models') {
        const res = await getModelReportData()
        if (res.error) throw new Error(res.error)
        headers = ['Exhibition Model', 'Supervisor / Model Head', 'Status', 'Staffing Level', 'Assigned Volunteers']
        rows = (res.data || []).map(m => {
          const countArr = m.volunteers as any
          const assigned = Array.isArray(countArr) ? countArr[0]?.count || countArr.length : 0
          return [
            m.name,
            (Array.isArray(m.profiles) ? m.profiles[0]?.full_name : (m.profiles as any)?.full_name) || 'Unassigned',
            m.status || 'Active',
            m.staffing_status || (assigned >= 4 ? 'Fully Staffed' : assigned > 0 ? 'Understaffed' : 'Unstaffed'),
            assigned
          ]
        })
        title = 'Exhibition Models & Staffing Distribution'
        subtitle = 'Workforce allocation, supervisor assignments, and coverage levels across exhibition models'
        filename = 'Exhibition_Models_Staffing_Report'
        stats = res.stats
      } else if (type === 'security') {
        const res = await getSecurityReportData()
        if (res.error) throw new Error(res.error)
        headers = ['Personnel Name', 'Email / System Login', 'Mobile Number', 'Status']
        rows = (res.data || []).map(s => [s.name, s.email, s.mobile || 'N/A', s.status || 'Active'])
        title = 'Security Personnel & Venue Roster'
        subtitle = 'Official roster of authorized security officers and field personnel'
        filename = 'Security_Personnel_Roster'
        stats = res.stats
      } else if (type === 'activity') {
        if (activities.length === 0) return toast.info('No activity records available to export.')
        headers = ['Timestamp', 'Operator', 'Role', 'Action Type', 'Target Entity']
        rows = activities.map(a => [
          new Date(a.created_at).toLocaleString(),
          a.user_name || 'System',
          a.role || 'System',
          a.action_type,
          a.target || '—'
        ])
        title = 'System Activity Audit & Compliance Log'
        subtitle = 'Chronological record of administrative operations, security events, and audit transactions'
        filename = 'System_Audit_Log'

        const adminCount = activities.filter(a => a.role === 'SUPER_ADMIN' || a.role === 'ADMIN').length
        const userCount = new Set(activities.map(a => a.user_name || 'System')).size
        const secCount = activities.filter(a =>
          String(a.action_type).toUpperCase().includes('DELETE') ||
          String(a.action_type).toUpperCase().includes('STATUS') ||
          String(a.action_type).toUpperCase().includes('AUTH')
        ).length

        stats = [
          { label: 'Total Events', value: activities.length },
          { label: 'Admin Actions', value: adminCount },
          { label: 'Security & Updates', value: secCount },
          { label: 'Active Operators', value: userCount }
        ]
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
        toast.success('CSV Export Complete', { description: `${title} exported successfully.` })
      } else {
        await exportToPDF({
          title,
          subtitle,
          filename: `${filename}.pdf`,
          headers,
          data: rows,
          themeColor: BRAND_COLORS.copper,
          summaryStats: stats
        })
        toast.success('Executive PDF Export Complete', { description: `${title} generated with executive theme.` })
      }
    } catch (err: any) {
      toast.error(err.message || 'Error generating report')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Reports"
        description="Choose a report and export registration or attendance records as PDF or CSV."
      />

      {/* Search / Filter Toolbar (Mobile Optimized) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={reportFilter}
            onChange={(e) => setReportFilter(e.target.value)}
            placeholder="Search reports by keyword, category, or tag..."
            className="pl-9 h-10 text-sm bg-white dark:bg-slate-900/60 w-full"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium shrink-0 self-end sm:self-center">
          Showing {filteredReports.length} of {reports.length} reports
        </div>
      </div>

      {/* Semantic Reports List matching workspace.css & mobile breakpoints */}
      <ul className="report-list">
        {filteredReports.map(report => {
          const Icon = report.icon
          const isGenerating = generating === report.id

          return (
            <li className="report-option" key={report.id}>
              <Icon size={21} aria-hidden="true" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2>{report.title}</h2>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${report.badgeColor}`}>
                    {report.tag}
                  </span>
                </div>
                <p>{report.description}</p>
                {isGenerating && (
                  <p role="status" className="flex items-center gap-1.5 text-xs text-terracotta font-medium mt-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Preparing report…
                  </p>
                )}
              </div>
              <ExportMenu
                label={`Export ${report.title}`}
                disabled={isGenerating}
                onCSV={() => handleGenerateReport(report.id, 'csv')}
                onPDF={() => handleGenerateReport(report.id, 'pdf')}
              />
            </li>
          )
        })}
      </ul>

      {/* Global Activity Audit Card (Mobile-friendly layout & horizontal swipe) */}
      <GlassCard className="p-0 overflow-hidden mt-6 sm:mt-8" glowColor="purple">
        <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-terracotta" />
              Global Activity Audit Feed
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">The last 100 system audit actions</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filter audit feed..."
                className="pl-8 h-9 text-xs w-full bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={activities.length === 0 || generating === 'activity'}
              onClick={() => handleGenerateReport('activity', 'pdf')}
              className="gap-1.5 text-xs h-9 shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              Export PDF
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {auditSearch ? 'No Matching Activity Records' : 'No System Activities Yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {auditSearch ? 'Try adjusting your search keywords.' : 'Audit logs will appear here once administrative actions occur.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[460px] overflow-x-auto overflow-y-auto">
              <Table className="min-w-[560px]">
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
                  {filteredActivities.map((act) => (
                    <TableRow key={act.id}>
                      <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                        {new Date(act.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {act.user_name || 'System'}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-medium uppercase tracking-wider whitespace-nowrap">
                          {act.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                          {act.action_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-medium max-w-xs truncate">
                        {act.target || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  )
}
