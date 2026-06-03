'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, Shield, Database, Calendar, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedLoader } from '@/components/ui/animated-loader'

export default function ReportsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  
  const supabase = createClient()

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          details,
          created_at,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(30)
      
      if (error) throw error
      setLogs(data || [])
    } catch (err: any) {
      toast.error(err.message || 'Error loading audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  // Helper to trigger CSV downloads
  const downloadCSV = async (type: 'all-volunteers' | 'approved-volunteers' | 'models' | 'model-heads') => {
    setDownloading(type)
    try {
      let csvContent = ''
      let filename = ''

      if (type === 'all-volunteers' || type === 'approved-volunteers') {
        let query = supabase
          .from('volunteers')
          .select(`
            id,
            full_name,
            gender,
            age,
            mobile_number,
            emergency_contact,
            address,
            role,
            status,
            models:model_id (
              name
            )
          `)

        if (type === 'approved-volunteers') {
          query = query.eq('status', 'Approved')
        }

        const { data, error } = await query
        if (error) throw error

        if (!data || data.length === 0) {
          toast.error('No records found to download')
          return
        }

        // Generate headers
        const headers = ['Volunteer ID', 'Full Name', 'Gender', 'Age', 'Mobile Number', 'Emergency Contact', 'Address', 'Role', 'Status', 'Assigned Model']
        const rows = data.map(v => [
          v.id,
          `"${v.full_name.replace(/"/g, '""')}"`,
          v.gender,
          v.age || '',
          v.mobile_number,
          v.emergency_contact,
          `"${(v.address || '').replace(/"/g, '""')}"`,
          v.role || '',
          v.status,
          v.models ? `"${(Array.isArray(v.models) ? (v.models[0] as any)?.name : (v.models as any)?.name || '').replace(/"/g, '""')}"` : 'Unassigned'
        ])

        csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        filename = `${type}_report_${Date.now()}.csv`

      } else if (type === 'models') {
        const { data, error } = await supabase
          .from('models')
          .select(`
            name,
            exhibition_category,
            description,
            status,
            profiles:head_id (
              full_name,
              email
            )
          `)
        if (error) throw error

        if (!data || data.length === 0) {
          toast.error('No models found to download')
          return
        }

        const headers = ['Model Name', 'Category', 'Description', 'Status', 'Head Name', 'Head Email']
        const rows = data.map(m => [
          `"${m.name.replace(/"/g, '""')}"`,
          `"${(m.exhibition_category || '').replace(/"/g, '""')}"`,
          `"${(m.description || '').replace(/"/g, '""')}"`,
          m.status,
          m.profiles ? `"${(Array.isArray(m.profiles) ? (m.profiles[0] as any)?.full_name : (m.profiles as any)?.full_name || '').replace(/"/g, '""')}"` : 'Unassigned',
          m.profiles ? (Array.isArray(m.profiles) ? (m.profiles[0] as any)?.email : (m.profiles as any)?.email) || 'N/A' : 'N/A'
        ])

        csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        filename = `models_list_${Date.now()}.csv`
      } else if (type === 'model-heads') {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            full_name,
            email,
            temp_password
          `)
          .eq('role', 'MODEL_HEAD')
          .order('full_name')
        if (error) throw error

        if (!data || data.length === 0) {
          toast.error('No model heads found to download')
          return
        }

        const headers = ['Full Name', 'Login Email ID', 'Temporary Password']
        const rows = data.map(h => [
          `"${h.full_name.replace(/"/g, '""')}"`,
          `"${h.email.replace(/"/g, '""')}"`,
          `"${(h.temp_password || 'N/A').replace(/"/g, '""')}"`
        ])

        csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        filename = `model_heads_credentials_${Date.now()}.csv`
      }

      // Trigger download in browser
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Report downloaded successfully')

      // Log report download audit trail
      const sessionUserStr = document.cookie
        .split('; ')
        .find(row => row.startsWith('mock-user='))
        ?.split('=')[1]
      
      if (sessionUserStr) {
        const sessionUser = JSON.parse(decodeURIComponent(sessionUserStr))
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', sessionUser.email)
          .single()

        if (userProfile) {
          await supabase.from('audit_logs').insert({
            user_id: userProfile.id,
            action: 'Report Exported',
            details: `Downloaded ${type} CSV dataset.`
          })
          fetchAuditLogs()
        }
      }

    } catch (err: any) {
      toast.error(err.message || 'Error generating export file')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Reports & System Audits</h1>
          <p className="text-violet-100 mt-2 text-sm max-w-xl">
            Export volunteer databases, extract printable lists, and trace admin modification logs.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Reports Download Card */}
        <Card className="md:col-span-1 shadow-lg border-primary/10 bg-card overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-primary/5">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Download Dataset Reports
            </CardTitle>
            <CardDescription className="text-xs">Select data boundaries to save as CSV</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">Volunteer Registry</h3>
              <p className="text-xs text-muted-foreground">Complete master list of all registered workers.</p>
              <Button 
                onClick={() => downloadCSV('all-volunteers')} 
                disabled={downloading !== null}
                className="w-full gap-2 rounded-xl"
              >
                {downloading === 'all-volunteers' ? <AnimatedLoader className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                Export All Volunteers
              </Button>
            </div>

            <hr className="border-primary/5" />

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">Approved Print Registry</h3>
              <p className="text-xs text-muted-foreground">Clean, approved profiles ready for card printing.</p>
              <Button 
                onClick={() => downloadCSV('approved-volunteers')} 
                disabled={downloading !== null}
                variant="secondary" 
                className="w-full gap-2 rounded-xl"
              >
                {downloading === 'approved-volunteers' ? <AnimatedLoader className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                Export Approved Only
              </Button>
            </div>

            <hr className="border-primary/5" />

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">Exhibition Divisions</h3>
              <p className="text-xs text-muted-foreground">Active models, assignments, and structural logs.</p>
              <Button 
                onClick={() => downloadCSV('models')} 
                disabled={downloading !== null}
                variant="outline" 
                className="w-full gap-2 rounded-xl"
              >
                {downloading === 'models' ? <AnimatedLoader className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                Export Model Matrix
              </Button>
            </div>
            <hr className="border-primary/5" />

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">Model Head Credentials</h3>
              <p className="text-xs text-muted-foreground">Supervisors' login credentials and temporary passwords.</p>
              <Button 
                onClick={() => downloadCSV('model-heads')} 
                disabled={downloading !== null}
                variant="outline" 
                className="w-full gap-2 rounded-xl border-purple-500/20 text-purple-650 hover:bg-purple-50/70"
              >
                {downloading === 'model-heads' ? <AnimatedLoader className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                Export Credentials Matrix
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Card */}
        <Card className="md:col-span-2 shadow-lg border-primary/10 bg-card overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-primary/5 flex flex-row items-center justify-between py-4 px-6">
            <div>
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Security Audit Log
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Trace recent administrative and export behaviors</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchAuditLogs} className="hover:bg-primary/10 rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                <div className="rounded-md border">
                  <div className="border-b px-6 py-3 flex gap-4 bg-muted/40">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4 border-b last:border-0">
                      <Skeleton className="h-4 w-32" />
                      <div className="space-y-2 w-40">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-4 w-full max-w-[200px]" />
                    </div>
                  ))}
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm font-semibold">
                No system audit events recorded yet.
              </div>
            ) : (
              <div className="max-h-[450px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/10 sticky top-0 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3 px-6">Timestamp</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">Actor</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3">Action</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3 px-6">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/20 transition-colors duration-150">
                        <TableCell className="text-xs text-muted-foreground font-semibold py-3 px-6 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.profiles ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">{log.profiles.full_name}</span>
                              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{log.profiles.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">System Process</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className={`inline-block font-extrabold px-2 py-0.5 rounded-full border text-[10px] uppercase ${
                            log.action === 'Report Exported'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400'
                          }`}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-700 dark:text-zinc-300 py-3 px-6 max-w-[200px] truncate">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
