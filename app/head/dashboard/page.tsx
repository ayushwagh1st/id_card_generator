'use client'

import { useState, useEffect } from 'react'
import { 
  Users, CheckCircle2, Clock, 
  ScanLine, Database, TrendingUp, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/button'
import { QRScannerDialog } from '@/components/QRScannerDialog'
import { getHeadDashboardDataAction } from './actions.server'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function HeadDashboardPage() {
  const router = useRouter()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [stats, setStats] = useState({
    volunteersCount: 0,
    approvedCount: 0,
    pendingCount: 0,
  })
  const [myModels, setMyModels] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getHeadDashboardDataAction()
        setStats(res.stats)
        setMyModels(res.models)
      } catch (err: any) {
        toast.error('Failed to load dashboard data')
      }
    }
    loadData()
  }, [])

  const handleScanSuccess = (decodedText: string) => {
    toast.success(`Scanned ID Code: ${decodedText}`)
    router.push(`/verify/${encodeURIComponent(decodedText)}`)
  }

  const statItems = [
    { title: 'My Volunteers', value: stats.volunteersCount, icon: Users, glow: 'blue' as const },
    { title: 'Approved Cards', value: stats.approvedCount, icon: CheckCircle2, glow: 'cyan' as const },
    { title: 'Pending Approval', value: stats.pendingCount, icon: Clock, glow: 'purple' as const },
  ]

  return (
    <div className="space-y-6">
      {/* Scanner Dialog */}
      <QRScannerDialog 
        isOpen={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />

      {/* Hero Banner */}
      <GlassCard className="p-8 sm:p-10" glowColor="blue">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500">
              <ShieldCheck className="w-4 h-4" />
              <span>Your assigned models</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Your team, ready to serve.
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Real-time overview of volunteer rosters and card verification states for your assigned models.
            </p>
            <div className="pt-2">
              <Button onClick={() => setScannerOpen(true)} className="gap-2 shadow-lg shadow-blue-500/20">
                <ScanLine className="w-4 h-4" />
                Scan Volunteer QR
              </Button>
            </div>
          </div>

        </div>
      </GlassCard>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {statItems.map((stat) => {
          const Icon = stat.icon
          return (
            <GlassCard key={stat.title} className="p-6" glowColor={stat.glow}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">{stat.title}</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.value}</div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Models + Guidelines */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Supervised Models */}
        <GlassCard className="p-6" glowColor="cyan">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-200/50 dark:border-slate-800/60">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Your exhibition models</h2>
              <p className="text-xs text-slate-400">Exhibition sectors assigned to your supervisor credentials</p>
            </div>
          </div>

          {myModels.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No models assigned yet. Contact the organizing team to confirm your assignments.</p>
          ) : (
            <ul className="space-y-3">
              {myModels.map((model) => (
                <li
                  key={model.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60"
                >
                  <div>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white block">{model.name}</span>
                    <span className="text-[11px] text-slate-400 block uppercase tracking-wider mt-0.5">{model.exhibition_category || 'General Area'}</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase">
                    {model.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Guidelines */}
        <GlassCard className="p-6" glowColor="purple">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-200/50 dark:border-slate-800/60">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Before you register your team</h2>
              <p className="text-xs text-slate-400">Protocols for model supervisors</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">Approved volunteer card profiles are immediately locked from head modifications. Review entries carefully before submission.</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-3">
              <Users className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">For bulk imports, ensure CSV files match assigned model column identifiers.</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
