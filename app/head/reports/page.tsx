'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, Activity, CheckCircle, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'
import { getVolunteersAction } from '@/app/actions/volunteers'
import { createClient } from '@/lib/supabase/client'

export default function HeadReportsPage() {
  const [loading, setLoading] = useState(true)
  const [volunteers, setVolunteers] = useState<any[]>([])

  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      // Get volunteers for this head's models
      const res = await getVolunteersAction(1, 1000, '', 'all', 'all')
      setVolunteers(res.data || [])
    } catch (err: any) {
      toast.error('Error fetching report data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const handleExportCSV = () => {
    if (volunteers.length === 0) return
    
    const headers = ['SNK ID', 'Name', 'Mobile', 'Role', 'Status', 'Model']
    const rows = volunteers.map(v => [
        v.snk_id || '',
        v.full_name || '',
        v.mobile_number || '',
        v.role || '',
        v.status || '',
        v.models?.name || ''
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `My_Models_Report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (volunteers.length === 0) return

    const headers = ['SNK ID', 'Name', 'Mobile', 'Role', 'Status', 'Model']
    const rows = volunteers.map(v => [
        v.snk_id || '',
        v.full_name || '',
        v.mobile_number || '',
        v.role || '',
        v.status || '',
        v.models?.name || ''
    ])

    exportToPDF({
      title: 'Division Volunteers Report',
      subtitle: 'Official list of volunteers assigned to your models',
      filename: 'Division_Report.pdf',
      headers,
      data: rows,
      themeColor: [249, 115, 22] // Orange theme for Head
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Division Reports</h1>
            <p className="text-orange-100 mt-2 text-sm max-w-xl">
              Generate PDF and CSV reports for volunteers assigned to your exhibition models.
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
            <Activity className="w-5 h-5 text-orange-500" />
            Report Preview
          </CardTitle>
          <CardDescription>
            Preview of the data that will be exported.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : volunteers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-orange-500 opacity-80" />
              </div>
              <h3 className="text-lg font-bold mb-1">No Data Available</h3>
              <p className="text-muted-foreground text-sm">No volunteers have been assigned to your models yet.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SNK ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Model</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteers.map((vol, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {vol.snk_id || 'Pending'}
                      </TableCell>
                      <TableCell>{vol.full_name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          vol.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          vol.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {vol.status || 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                        {vol.models?.name || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
