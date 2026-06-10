'use client'

import { useEffect, useState } from 'react'
import { Users, CheckCircle, Clock, Database, TrendingUp, AlertTriangle, ScanLine } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { QRScannerDialog } from '@/components/QRScannerDialog'
import Image from 'next/image'

export default function HeadDashboard() {
  const [loading, setLoading] = useState(true)
  const [myModels, setMyModels] = useState<any[]>([])
  const [stats, setStats] = useState({
    volunteersCount: 0,
    approvedCount: 0,
    pendingCount: 0
  })
  const [scannerOpen, setScannerOpen] = useState(false)
  const supabase = createClient()

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      let profileId = ''
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        profileId = user.id
      } else {
        const sessionUserStr = document.cookie
          .split('; ')
          .find(row => row.startsWith('mock-user='))
          ?.split('=')[1]
        if (sessionUserStr) {
          const sessionUser = JSON.parse(decodeURIComponent(sessionUserStr))
          const { data: profile, error: pErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', sessionUser.email)
            .single()
          if (!pErr && profile) profileId = profile.id
        }
      }

      if (!profileId) profileId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'

      const { data: modelsData, error: modelsErr } = await supabase
        .from('models')
        .select('id, name, exhibition_category, status')
        .eq('head_id', profileId)
      if (modelsErr) throw modelsErr
      setMyModels(modelsData || [])

      if (modelsData && modelsData.length > 0) {
        const modelIds = modelsData.map(m => m.id)
        const { data: volData, error: volErr } = await supabase
          .from('volunteers')
          .select('status')
          .in('model_id', modelIds)
        if (volErr) throw volErr

        setStats({
          volunteersCount: volData?.length || 0,
          approvedCount: volData?.filter(v => v.status === 'Approved').length || 0,
          pendingCount: volData?.filter(v => v.status === 'Pending').length || 0
        })
      }
    } catch (err: any) {
      toast.error(err.message || 'Error compiling head dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const statItems = [
    { title: 'My Volunteers', value: stats.volunteersCount, iconSrc: '/images/icons/icon_users.png', tileClass: 'icon-tile-pink' },
    { title: 'Approved Cards', value: stats.approvedCount, iconSrc: '/images/icons/icon_check.png', tileClass: 'icon-tile-mint' },
    { title: 'Pending Approval', value: stats.pendingCount, iconSrc: '/images/icons/icon_clock.png', tileClass: 'icon-tile-blue' },
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Banner */}
      <div className="rounded-[32px] bg-[var(--color-yellow)] p-6 md:p-10 text-ink border-ink shadow-hard pattern-grid relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-flex badge-flat bg-white text-ink border-ink transform rotate-2">
            <Users className="w-4 h-4 mr-2" /> Supervisor Mode
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight">
            Team <span className="text-white" style={{ textShadow: '2px 2px 0 #111111' }}>Command</span>
          </h1>
          <p className="font-sans font-medium text-ink/80 text-lg">
            Live overview of volunteer registries and card validation states for your assigned models.
          </p>
          <button
            onClick={() => setScannerOpen(true)}
            className="btn-primary bg-[var(--color-peach)] text-ink border-ink shadow-hard hover:bg-[var(--color-lavender)] mt-4 w-full sm:w-auto"
          >
            <ScanLine className="w-5 h-5" />
            Quick Scan ID
          </button>
        </div>

        <div className="hidden md:block relative z-10 w-full max-w-[300px] aspect-square transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
          <Image 
            src="/images/head_dashboard_illustration.png" 
            alt="Supervisor Command" 
            fill
            className="object-contain drop-shadow-[8px_8px_0_rgba(17,17,17,1)]"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {statItems.map((stat, i) => (
          <div
            key={i}
            className="bento-white flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-150 shadow-hard-sm !p-5 !rounded-2xl"
          >
            <div className={`icon-tile ${stat.tileClass} w-14 h-14 shadow-hard-xs transform rotate-2 overflow-hidden bg-white`}>
              <Image src={stat.iconSrc} alt={stat.title} width={56} height={56} className="object-cover" />
            </div>
            <div className="mt-2">
              <div className="font-display font-bold text-3xl text-ink leading-none">{stat.value}</div>
              <div className="font-display text-xs font-bold uppercase tracking-wider text-ink/60 mt-1.5">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Models + Guidelines */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Supervised Models */}
        <div
          className="bg-card rounded-2xl overflow-hidden"
          style={{ border: '3px solid #111111', boxShadow: '8px 8px 0 #111111' }}
        >
          <div className="flex items-center gap-3 p-5" style={{ borderBottom: '3px solid #111111' }}>
            <div className="icon-tile icon-tile-lime w-10 h-10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-base text-foreground">My Supervised Divisions</div>
              <div className="font-display text-xs text-foreground/50">Exhibition sectors assigned to your credentials</div>
            </div>
          </div>
          <div className="p-5">
            {myModels.length === 0 ? (
              <p className="text-sm text-foreground/40 font-display py-6 text-center">No assigned models found.</p>
            ) : (
              <ul className="space-y-3">
                {myModels.map((model) => (
                  <li
                    key={model.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                    style={{ border: '2px solid #11111120' }}
                  >
                    <div>
                      <span className="font-display font-bold text-sm text-foreground">{model.name}</span>
                      <span className="block font-display text-[11px] text-foreground/50 uppercase tracking-wider mt-0.5">{model.exhibition_category || 'General Area'}</span>
                    </div>
                    <span
                      className="font-display text-[11px] font-bold bg-secondary text-foreground px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ border: '2px solid #111111' }}
                    >
                      {model.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Duty Guidelines */}
        <div
          className="bg-card rounded-2xl overflow-hidden"
          style={{ border: '3px solid #111111', boxShadow: '8px 8px 0 #111111' }}
        >
          <div className="flex items-center gap-3 p-5" style={{ borderBottom: '3px solid #111111' }}>
            <div className="icon-tile icon-tile-lavender w-10 h-10">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-base text-foreground">Duty Guidelines</div>
              <div className="font-display text-xs text-foreground/50">Protocol for model supervisors</div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="bento-lime flex items-start gap-3 !p-4">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-foreground" />
              <p className="text-sm font-sans font-semibold leading-relaxed">Approved volunteer card profiles are immediately locked from head modifications. Review entries carefully before submission.</p>
            </div>
            <div className="bento-pastel flex items-start gap-3 !p-4">
              <Users className="w-5 h-5 shrink-0 mt-0.5 text-foreground" />
              <p className="text-sm font-sans font-semibold leading-relaxed">For bulk uploads, make sure the CSV has correct headers and matches your supervised models specifically.</p>
            </div>
          </div>
        </div>
      </div>

      <QRScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />
    </div>
  )
}
