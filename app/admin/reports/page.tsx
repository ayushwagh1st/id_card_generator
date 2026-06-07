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
      themeColor: [219, 39, 119] // Pink theme for Admin
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">System Reports & Logs</h1>
            <p className="text-pink-100 mt-2 text-sm max-w-xl">
              Audit logs and comprehensive reporting across the entire platform.
            </p>
          </div>
          <div className="flex gap-2">
             <Button onClick={handleExportCSV} variant="secondary" className="bg-white/20 hover:bg-white/30 border-0 shadow-sm backdrop-blur-md">
               <FileText className="w-4 h-4 mr-2" />
               Export CSV
             </Button>
             <Button onClick={handleExportPDF} variant="secondary" className="bg-white/20 hover:bg-white/30 border-0 shadow-sm backdrop-blur-md">
               <Download className="w-4 h-4 mr-2" />
               Export PDF
             </Button>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-primary/10 overflow-hidden">
        <CardHeader className="border-b border-primary/5 bg-muted/30">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-pink-500" />
            Global Activity Feed
          </CardTitle>
          <CardDescription>
            The last 100 actions performed across the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-pink-500 opacity-80" />
              </div>
              <h3 className="text-lg font-bold mb-1">No Activities Yet</h3>
              <p className="text-muted-foreground text-sm">Action logs will appear here once users interact with the system.</p>
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
                {activities.map((act, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(act.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{act.user_name || 'System'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full bg-muted text-xs font-semibold">
                        {act.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-pink-600 dark:text-pink-400">
                        {act.action_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {act.target}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
