'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, Activity, CheckCircle, Clock } from 'lucide-react'
import { getActivitiesAction } from '@/app/actions/activity'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'

export default function AdminReportsPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleExportCSV = () => {
    if (activities.length === 0) return
    
    const headers = ['Date', 'User', 'Role', 'Action', 'Target']
    const rows = activities.map(a => [
        new Date(a.created_at).toLocaleString(),
        a.user_name || 'System',
        a.role,
        a.action_type,
        a.target || ''
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `System_Activity_Report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (activities.length === 0) return

    const headers = ['Date', 'User', 'Role', 'Action', 'Target']
    const rows = activities.map(a => [
        new Date(a.created_at).toLocaleString(),
        a.user_name || 'System',
        a.role,
        a.action_type,
        a.target || ''
    ])

    exportToPDF({
      title: 'System Activity Report',
      subtitle: 'Comprehensive audit log of all system actions',
      filename: 'System_Activity_Report.pdf',
      headers,
      data: rows,
      themeColor: [188, 166, 255] // Lavender theme for Admin
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-[32px] bg-[var(--color-orange)] p-6 md:p-10 text-ink border-ink shadow-hard pattern-dots relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between w-full md:items-end gap-4">
          <div className="space-y-3">
            <div className="inline-flex badge-flat bg-white text-ink border-ink transform rotate-2">
              <Activity className="w-4 h-4 mr-2 text-ink" /> Logs
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight">System Reports & Logs</h1>
            <p className="font-sans font-medium text-ink/80 text-lg max-w-xl">
              Audit logs and comprehensive reporting across the entire platform.
            </p>
          </div>
          <div className="flex gap-2">
             <Button onClick={handleExportCSV} className="bg-white text-ink border-ink shadow-hard-xs hover:bg-muted font-bold h-11 px-5 rounded-xl">
               <FileText className="w-4 h-4 mr-2" />
               Export CSV
             </Button>
             <Button onClick={handleExportPDF} className="bg-white text-ink border-ink shadow-hard-xs hover:bg-muted font-bold h-11 px-5 rounded-xl">
               <Download className="w-4 h-4 mr-2" />
               Export PDF
             </Button>
          </div>
        </div>
      </div>

      <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard !p-0">
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
                {activities.map((act, idx) => (
                  <TableRow key={idx}>
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
