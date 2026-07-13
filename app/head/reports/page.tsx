'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, Activity, CheckCircle, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'
import { getVolunteersAction } from '@/server/actions/volunteers'

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
      themeColor: [188, 166, 255] // Lavender theme for Head
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-[32px] bg-[var(--color-purple)] p-6 md:p-10 text-white border-ink shadow-hard pattern-dots relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between w-full md:items-end gap-4">
          <div className="space-y-3">
            <div className="inline-flex badge-flat bg-white text-ink border-ink transform -rotate-2">
              <Activity className="w-4 h-4 mr-2 text-ink" /> Reports
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-white">Division Reports</h1>
            <p className="font-sans font-medium text-white/80 text-lg max-w-xl">
              Generate PDF and CSV reports for volunteers assigned to your exhibition models.
            </p>
          </div>
          <div className="flex gap-2">
             <Button onClick={handleExportCSV} className="bg-white text-ink border-ink shadow-hard-xs hover:bg-muted font-bold h-11 px-5 rounded-xl transform transition-transform hover:-translate-y-1">
               <FileText className="w-4 h-4 mr-2" />
               Export CSV
             </Button>
             <Button onClick={handleExportPDF} className="bg-white text-ink border-ink shadow-hard-xs hover:bg-muted font-bold h-11 px-5 rounded-xl transform transition-transform hover:-translate-y-1">
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
            Report Preview
          </CardTitle>
          <CardDescription>
            Preview of the data that will be exported.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : volunteers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-primary opacity-80" />
              </div>
              <h3 className="text-lg font-bold mb-1">No Data Available</h3>
              <p className="text-muted-foreground text-sm font-medium">No volunteers have been assigned to your models yet.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>SNK ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Model</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteers.map((vol, idx) => (
                    <TableRow key={vol.id}>
                      <TableCell className="font-bold text-xs whitespace-nowrap">
                        {vol.snk_id || 'Pending'}
                      </TableCell>
                      <TableCell className="font-semibold text-ink">{vol.full_name}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          vol.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          vol.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {vol.status || 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium text-sm max-w-xs truncate">
                        {vol.models?.name || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  )
}
