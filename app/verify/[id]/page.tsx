import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, XCircle, AlertTriangle, Users, ShieldAlert } from 'lucide-react'
import Image from 'next/image'
import { GlassCard } from '@/components/ui/GlassCard'

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, supabase] = await Promise.all([params, createClient()])

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !['SUPER_ADMIN', 'MODEL_HEAD', 'LECTURER'].includes(user.app_metadata?.role)) {
    return (
      <div className="verification-page app-workspace min-h-dvh flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-8 text-center space-y-4" glowColor="purple">
          <ShieldAlert className="w-14 h-14 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Restricted</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            You do not have authorization to view this profile. QR verification scanning is reserved for authorized staff.
          </p>
        </GlassCard>
      </div>
    )
  }

  const { data: volunteer, error } = await supabase
    .rpc('verify_volunteer', { v_id: resolvedParams.id })

  if (error || !volunteer) {
    return (
      <div className="verification-page app-workspace min-h-dvh flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-8 text-center space-y-4" glowColor="purple">
          <XCircle className="w-14 h-14 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invalid Badge</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            This QR code does not match any registered attendee in our system. It may be expired or deleted.
          </p>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 text-xs font-mono break-all text-left">
            <strong>ID Scanned:</strong> {error ? "Invalid Code" : resolvedParams.id.substring(0, 8) + '...'}
          </div>
        </GlassCard>
      </div>
    )
  }

  const isApproved = volunteer.status === 'Approved'
  const isPending = volunteer.status === 'Pending'

  return (
    <div className="verification-page app-workspace min-h-dvh flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-8 relative overflow-hidden" glowColor={isApproved ? 'blue' : 'purple'}>
        {/* Status Top Banner */}
        <div className={`py-2 px-4 rounded-2xl mb-6 text-center flex items-center justify-center gap-2 text-xs font-semibold ${
          isApproved ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
          isPending ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
          'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
        }`}>
          {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {isPending && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          {!isApproved && !isPending && <XCircle className="w-4 h-4 text-rose-500" />}
          <span>{isApproved ? 'Official Verified Credential' : isPending ? 'Pending Verification' : 'Invalid Credential'}</span>
        </div>

        {/* Profile Avatar & Info */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-24 h-28 mx-auto rounded-2xl overflow-hidden glass-panel border border-white/40 dark:border-slate-700/50 shadow-xl bg-slate-900 flex items-center justify-center">
            {volunteer.photo_url ? (
              <Image src={volunteer.photo_url} alt={`${volunteer.full_name}'s profile photo`} width={96} height={112} unoptimized className="w-full h-full object-cover" />
            ) : (
              <Users aria-hidden="true" className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {volunteer.full_name}
          </h1>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            {volunteer.snk_id || volunteer.id.substring(0, 8).toUpperCase()}
          </div>
        </div>

        {/* Attribute Details Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
          <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-0.5">Model Area</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">{volunteer.models?.name || 'Unassigned'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-0.5">Branch</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">{volunteer.branch || 'N/A'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-0.5">Role</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">{volunteer.designation || volunteer.role}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-0.5">Mobile</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">{volunteer.mobile_number}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
