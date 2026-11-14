'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, Printer, RefreshCw, ScanLine, Users } from 'lucide-react'
import { getDashboardStatsAction } from '@/server/actions/dashboard'
import { QRScannerDialog } from '@/components/QRScannerDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { LoadError } from '@/components/ui/load-error'
import { Skeleton } from '@/components/ui/skeleton'

const VolunteersChart = dynamic(() => import('@/components/dashboard/VolunteersChart'), { ssr: false })
interface DashboardStats {
  totalVolunteers: number; totalModels: number; approvedCount: number; pendingCount: number
  totalSessions: number; totalLecturers: number; todaySessions: number; attendancePercentage: number
  totalChildren: number; checkedInChildren: number
}
interface DashboardData {
  stats: DashboardStats
  chartData: { name: string; volunteers: number }[]
  activities: { id: string; action: string; user: string; time: string }[]
}

async function fetchDashboardData(): Promise<DashboardData> {
  const result = await getDashboardStatsAction()
  if ('error' in result && result.error) throw new Error(result.error)
  if (!('stats' in result) || !result.stats) throw new Error('The overview response was incomplete. Please try again.')
  return { stats: result.stats, chartData: result.chartData || [], activities: result.activities || [] }
}

function dashboardError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Check your connection and try again.'
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanResult, setScanResult] = useState('')

  useEffect(() => {
    let active = true
    void fetchDashboardData().then(result => { if (active) setData(result) }, cause => { if (active) setError(dashboardError(cause)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const retryDashboard = () => {
    setLoading(true)
    setError(null)
    void fetchDashboardData().then(setData, cause => setError(dashboardError(cause))).finally(() => setLoading(false))
  }

  const stats = data?.stats
  return <div className="task-page dashboard-workspace" aria-busy={loading}>
    <PageHeader title="Event overview" description="Review registrations, approvals, and event attendance." actions={<>
      <Button variant="outline" onClick={() => setScannerOpen(true)}><ScanLine size={16} aria-hidden="true" />Read QR code</Button>
      <Link className={buttonVariants()} href="/admin/print"><Printer size={16} aria-hidden="true" />Print IDs</Link>
      <Button variant="ghost" size="icon" aria-label="Refresh event overview" disabled={loading} onClick={retryDashboard}><RefreshCw size={17} aria-hidden="true" /></Button>
    </>} />
    {error && <LoadError message={error} onRetry={retryDashboard} retrying={loading} />}
    {!data && loading ? <div role="status" aria-label="Loading event overview" className="space-y-5">
      <p className="text-muted-foreground">Loading event overview…</p>
      <div className="overview-metrics">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}</div>
      <Skeleton className="h-28" /><Skeleton className="h-56" />
    </div> : stats && data ? <>
      <div className="overview-metrics">
        <Link href="/admin/volunteers?status=Pending" className="overview-metric"><span><Clock3 size={17} aria-hidden="true" />Pending approvals</span><strong>{stats.pendingCount.toLocaleString()}</strong><small>Review volunteer profiles</small></Link>
        <Link href="/admin/volunteers?status=Approved" className="overview-metric"><span><CheckCircle2 size={17} aria-hidden="true" />Approved volunteers</span><strong>{stats.approvedCount.toLocaleString()}</strong><small>Profiles approved for event IDs</small></Link>
        <Link href="/admin/directory" className="overview-metric"><span><Users size={17} aria-hidden="true" />Children checked in</span><strong>{stats.checkedInChildren.toLocaleString()}</strong><small>Of {stats.totalChildren.toLocaleString()} registered children</small></Link>
      </div>
      <section className="overview-attention" aria-labelledby="overview-attention-title">
        <div><h2 id="overview-attention-title">{stats.pendingCount > 0 ? `${stats.pendingCount} volunteer ${stats.pendingCount === 1 ? 'profile awaits' : 'profiles await'} review` : 'No volunteer profiles awaiting review'}</h2><p>{stats.pendingCount > 0 ? 'Check profile details and photographs before approving event IDs.' : 'Open the roster to manage your registered volunteers.'}</p></div>
        <Link className={buttonVariants({ variant: 'outline' })} href={stats.pendingCount > 0 ? '/admin/volunteers?status=Pending' : '/admin/volunteers'}>Review volunteers<ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
      <dl className="overview-context">
        <div><dt>Registered volunteers</dt><dd>{stats.totalVolunteers.toLocaleString()}</dd></div>
        <div><dt>Exhibition models</dt><dd>{stats.totalModels.toLocaleString()}</dd></div>
        <div><dt>Sessions today</dt><dd>{stats.todaySessions.toLocaleString()}</dd></div>
        <div><dt>Total sessions</dt><dd>{stats.totalSessions.toLocaleString()}</dd></div>
        <div><dt>Attendance across enrollments</dt><dd>{stats.attendancePercentage}%</dd></div>
      </dl>
      {scanResult && <section className="ui-panel p-5 space-y-3" aria-label="QR content" role="status"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">QR content</h2><Button variant="ghost" size="sm" onClick={() => setScanResult('')}>Clear result</Button></div><pre className="whitespace-pre-wrap break-all text-sm">{scanResult}</pre></section>}
      <div className="dashboard-detail-grid">
        <section className="ui-panel task-section"><div className="task-section-heading"><h2>Volunteer allocation</h2><p>Registered volunteers assigned to each exhibition model.</p></div>{data.chartData.length > 0 ? <VolunteersChart data={data.chartData} /> : <div className="task-empty"><p>No exhibition models to display yet.</p><Link className={buttonVariants({ variant: 'outline' })} href="/admin/models">Manage exhibition models</Link></div>}</section>
        <section className="ui-panel task-section"><div className="task-section-heading"><h2>Recent activity</h2><p>Latest recorded registration and attendance changes.</p></div>
          {data.activities.length === 0 ? <p className="task-empty">No activity recorded yet. Registration and check-in updates will appear here.</p> : <ul className="overview-activity">{data.activities.map(activity => <li key={activity.id}><div><strong>{activity.action.charAt(0).toUpperCase() + activity.action.slice(1).toLowerCase()}</strong><span>{activity.user}</span></div><time>{activity.time}</time></li>)}</ul>}
        </section>
      </div>
    </> : null}
    <QRScannerDialog isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScanSuccess={value => { setScanResult(value); setScannerOpen(false) }} />
  </div>
}
