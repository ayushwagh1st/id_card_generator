'use client'

import { useEffect, useState, useCallback } from 'react'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'
import { getVolunteersAction } from '@/server/actions/volunteers'
import { GlassCard } from '@/components/ui/GlassCard'

export default function HeadReportsPage() {
  const [loading, setLoading] = useState(true)
  const [volunteers, setVolunteers] = useState<any[]>([])

  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
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
      themeColor: [59, 130, 246]
    })
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-8 sm:p-10" glowColor="blue">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500">
              <Activity className="w-4 h-4" />
              <span>Division Analytics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Model Head Reports Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Export PDF and CSV reports for volunteers assigned to your supervised exhibition models.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} className="gap-2 shadow-lg shadow-blue-500/20">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden" glowColor="purple">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Dataset Live Preview</h3>
            <p className="text-xs text-slate-400">Live preview of workforce data ready for export</p>
          </div>
          <div className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            {volunteers.length} Records
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        ) : volunteers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Volunteers Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">No volunteer records match your supervised models.</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SNK ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Model Area</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volunteers.map((vol) => (
                  <TableRow key={vol.id}>
                    <TableCell className="font-mono text-xs font-semibold text-blue-500">
                      {vol.snk_id || 'Pending'}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-white">{vol.full_name}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider ${
                        vol.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        vol.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {vol.status || 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 font-medium text-xs">
                      {vol.models?.name || 'Unassigned'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
