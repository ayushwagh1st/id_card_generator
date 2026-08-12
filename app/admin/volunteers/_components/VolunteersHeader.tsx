import { Users } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

export function VolunteersHeader() {
  return (
    <GlassCard className="p-6 md:p-8" glowColor="blue">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
          <Users className="w-3.5 h-3.5" />
          <span>Workforce Management</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Volunteer Directory & Approval Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Approve, manage, and print official badges for all active volunteers. Import workforce datasets securely via CSV.
        </p>
      </div>
    </GlassCard>
  )
}
