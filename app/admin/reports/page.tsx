'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, Activity, Users, Database, Shield, LayoutGrid, Loader2 } from 'lucide-react'
import { getActivitiesAction } from '@/server/actions/activity'
import { getVolunteerReportData, getSessionReportData, getModelReportData, getSecurityReportData } from '@/server/actions/reports'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { exportToPDF, PDFSummaryStat } from '@/lib/pdf'
import Image from 'next/image'

const reports = [
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

  const handleGenerateReport = async (type: string) => {
    setGenerating(type)
    try {
      if (type === 'volunteers') {
        const res = await getVolunteerReportData()
        if (res.error) throw new Error(res.error)
        
        const headers = ['SNK ID', 'Name', 'Mobile', 'Age', 'Gender', 'Department', 'Assigned Model']
        const rows = res.data!.map(v => [
          v.snk_id || 'N/A',
          v.full_name,
          v.mobile_number,
          v.age || 'N/A',
          v.gender || 'N/A',
          (v as any).department || 'N/A',
          (Array.isArray(v.models) ? v.models[0]?.name : (v.models as any)?.name) || 'Unassigned'
        ])

        exportToPDF({
          title: 'Volunteer Analytics & Directory',
          subtitle: 'Comprehensive list of all registered volunteers',
          filename: 'Volunteer_Analytics_Report.pdf',
          headers,
          data: rows,
          themeColor: [244, 63, 94], // Rose/Pink
          summaryStats: res.stats as PDFSummaryStat[]
        })
        toast.success('Volunteer Report generated!')
      }

      else if (type === 'sessions') {
        const res = await getSessionReportData()
        if (res.error) throw new Error(res.error)
        
        const headers = ['Session Name', 'Category', 'Date', 'Time', 'Venue', 'Lecturer', 'Status', 'Enrollments']
        const rows = res.data!.map(s => {
          const countArr = s.volunteer_sessions as any;
          const enrolls = Array.isArray(countArr) ? countArr[0]?.count || countArr.length : 0;
          return [
            s.name,
            s.category || 'N/A',
            s.date,
            `${s.start_time} - ${s.end_time}`,
            s.venue || 'N/A',
            s.lecturer_name || 'Unassigned',
            s.status,
            `${enrolls} / ${s.capacity || '∞'}`
          ]
        })

        exportToPDF({
          title: 'Session & Attendance Analytics',
          subtitle: 'Overview of all scheduled training sessions and enrollments',
          filename: 'Session_Analytics_Report.pdf',
          headers,
          data: rows,
          themeColor: [16, 185, 129], // Emerald
          summaryStats: res.stats as PDFSummaryStat[]
        })
        toast.success('Session Report generated!')
      }

      else if (type === 'models') {
        const res = await getModelReportData()
        if (res.error) throw new Error(res.error)
        
        const headers = ['Model Name', 'Head Name', 'Status', 'Assigned Vols']
        const rows = res.data!.map(m => {
          const countArr = m.volunteers as any;
          const assigned = Array.isArray(countArr) ? countArr[0]?.count || countArr.length : 0;
          return [
            m.name,
            (Array.isArray(m.profiles) ? m.profiles[0]?.full_name : (m.profiles as any)?.full_name) || 'N/A',
            m.status,
            assigned
          ]
        })

        exportToPDF({
          title: 'Exhibition Models Allocation',
          subtitle: 'Directory of exhibition models and volunteer distribution',
          filename: 'Models_Allocation_Report.pdf',
          headers,
          data: rows,
          themeColor: [59, 130, 246], // Blue
          summaryStats: res.stats as PDFSummaryStat[]
        })
        toast.success('Models Report generated!')
      }

      else if (type === 'security') {
        const res = await getSecurityReportData()
        if (res.error) throw new Error(res.error)
        
        const headers = ['Name', 'Email / Login', 'Mobile', 'Status']
        const rows = res.data!.map(s => [
          s.name,
          s.email,
          s.mobile || 'N/A',
          s.status
        ])

        exportToPDF({
          title: 'Security Personnel Roster',
          subtitle: 'Active and inactive security staff',
          filename: 'Security_Roster_Report.pdf',
          headers,
          data: rows,
          themeColor: [139, 92, 246], // Violet
          summaryStats: res.stats as PDFSummaryStat[]
        })
        toast.success('Security Report generated!')
      }

      else if (type === 'activity') {
        if (activities.length === 0) return toast.info('No activities to export.')
        const headers = ['Date', 'User', 'Role', 'Action', 'Target']
        const rows = activities.map(a => [
            new Date(a.created_at).toLocaleString(),
            a.user_name || 'System',
            a.role,
            a.action_type,
            a.target || ''
        ])

        exportToPDF({
          title: 'System Activity Audit Log',
          subtitle: 'Latest 100 system actions',
          filename: 'System_Activity_Audit.pdf',
          headers,
          data: rows,
          themeColor: [249, 115, 22] // Orange
        })
        toast.success('Activity Log generated!')
      }

    } catch (err: any) {
      toast.error(err.message || 'Error generating report')
    } finally {
      setGenerating(null)
    }
  }



  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-[24px] bg-gradient-to-r from-[#fcfaff] to-[#f6f4ff] p-8 md:p-12 border border-[#f0ebff] shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ecfdf3] text-[#027a48] text-xs font-semibold tracking-wide uppercase">
            <FileText className="w-4 h-4 mr-2" /> Hub
          </div>
          <div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-slate-900">Report Hub</h1>
            <div className="w-12 h-1 bg-[#8C6DFD] rounded-full mt-4 opacity-80"></div>
          </div>
          <p className="font-sans text-slate-500 text-lg max-w-xl leading-relaxed">
            Generate beautiful PDF analytics and comprehensive data exports across all system modules.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map(report => {
          const Icon = report.icon
          const isGenerating = generating === report.id
          
          return (
            <div key={report.id} className="bento-white flex flex-col justify-between gap-4 shadow-hard-sm !p-6 !rounded-[24px]">
              <div className="space-y-3">
                <div className={`icon-tile icon-tile-${report.color} w-12 h-12 shadow-hard-xs transform -rotate-2 overflow-hidden bg-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-ink">{report.title}</h3>
                  <p className="font-sans text-sm text-muted-foreground mt-1">{report.description}</p>
                </div>
              </div>
              <Button 
                onClick={() => handleGenerateReport(report.id)} 
                disabled={isGenerating}
                className={`w-full font-bold shadow-hard-xs hover:translate-y-[1px] hover:shadow-none transition-all ${
                  isGenerating ? 'opacity-70' : ''
                }`}
                variant="outline"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Generate PDF</>
                )}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard !p-0 mt-8">
        <CardHeader className="bg-muted/20 border-b border-ink/10">
          <CardTitle className="text-lg flex items-center gap-2 font-bold text-ink">
            <Activity className="w-5 h-5 text-blue-500" />
            Global Activity Feed
          </CardTitle>
          <CardDescription>
            The last 100 actions performed across the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-primary opacity-80" />
              </div>
              <h3 className="text-lg font-bold mb-1">No Activities Yet</h3>
              <p className="text-muted-foreground text-sm font-medium">Action logs will appear here once users interact with the system.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
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
                    <TableCell className="font-medium whitespace-nowrap text-xs">
                      {new Date(act.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-bold">{act.user_name || 'System'}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-full bg-ink/5 border border-ink/10 text-xs font-bold uppercase tracking-wider text-ink">
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
      </div>
    </div>
  )
}
