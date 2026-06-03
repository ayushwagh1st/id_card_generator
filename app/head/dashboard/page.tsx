'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, CheckCircle, Clock, Database, TrendingUp, AlertTriangle, ScanLine } from 'lucide-react'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { QRScannerDialog } from '@/components/QRScannerDialog'
import { Button } from '@/components/ui/button'

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
      // 1. Get logged in user from supabase auth or cookie
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
          // Look up profile ID by email
          const { data: profile, error: pErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', sessionUser.email)
            .single()
          if (!pErr && profile) {
            profileId = profile.id
          }
        }
      }

      if (!profileId) {
        // Fallback to seeded head
        profileId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'
      }

      // 2. Fetch models supervised by this head
      const { data: modelsData, error: modelsErr } = await supabase
        .from('models')
        .select('id, name, exhibition_category, status')
        .eq('head_id', profileId)
      
      if (modelsErr) throw modelsErr
      setMyModels(modelsData || [])

      if (modelsData && modelsData.length > 0) {
        const modelIds = modelsData.map(m => m.id)
        
        // 3. Fetch volunteers count
        const { data: volData, error: volErr } = await supabase
          .from('volunteers')
          .select('status')
          .in('model_id', modelIds)
        
        if (volErr) throw volErr

        const volunteersCount = volData?.length || 0
        const approvedCount = volData?.filter(v => v.status === 'Approved').length || 0
        const pendingCount = volData?.filter(v => v.status === 'Pending').length || 0

        setStats({
          volunteersCount,
          approvedCount,
          pendingCount
        })
      } else {
        setStats({
          volunteersCount: 0,
          approvedCount: 0,
          pendingCount: 0
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
    { title: 'My Volunteers', value: stats.volunteersCount, icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
    { title: 'Approved Cards', value: stats.approvedCount, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    { title: 'Pending Approval', value: stats.pendingCount, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground gap-3">
        <AnimatedLoader className="w-8 h-8" />
        <p className="text-sm font-semibold">Generating your dashboard stats...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-pink-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Supervisor Center</h1>
            <p className="text-orange-100 mt-2 text-sm max-w-xl">
              Live overview of volunteer registries and card validation states for your assigned models.
            </p>
          </div>
          <Button 
            onClick={() => setScannerOpen(true)}
            variant="secondary" 
            className="w-full md:w-auto bg-white/20 hover:bg-white/30 text-white border-0 shadow-sm backdrop-blur-md font-bold"
          >
            <ScanLine className="w-4 h-4 mr-2" />
            Scan ID Card
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {statItems.map((stat, i) => (
          <Card key={i} className="shadow-md hover:shadow-lg transition-all duration-300 border-primary/10 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-black text-foreground tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Models & Guidance Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Supervised Models list */}
        <Card className="shadow-lg border-primary/10 bg-card overflow-hidden">
          <CardHeader className="border-b border-primary/5 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              My Supervised Divisions
            </CardTitle>
            <CardDescription className="text-xs">Exhibition sectors assigned to your credentials</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {myModels.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No assigned models found.</p>
            ) : (
              <ul className="space-y-3">
                {myModels.map((model) => (
                  <li key={model.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-primary/5 hover:bg-muted/65 transition-colors duration-150">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{model.name}</span>
                      <span className="text-[11px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">{model.exhibition_category || 'General Area'}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/55 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {model.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Supervisor guidelines */}
        <Card className="shadow-lg border-primary/10 bg-card overflow-hidden">
          <CardHeader className="border-b border-primary/5 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              Duty Guidelines
            </CardTitle>
            <CardDescription className="text-xs">Protocol details for model supervisors</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-xs font-semibold text-muted-foreground leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p>Approved volunteer card profiles are immediately locked from head modifications. Review entries carefully before submission.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p>For bulk uploads, make sure the CSV has the correct headers and matches your supervised models specifically.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <QRScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />
    </div>
  )
}
