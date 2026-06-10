import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertTriangle, Building, Users, Phone, Hash, ShieldAlert } from 'lucide-react'
import Image from 'next/image'

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Authentication Check (Block Outsiders)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !['SUPER_ADMIN', 'MODEL_HEAD', 'LECTURER'].includes(user.user_metadata?.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <ShieldAlert className="w-16 h-16 text-primary" />
            <h1 className="text-2xl font-bold font-display text-ink">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to view this volunteer's profile. Scanning must be performed by authorized staff.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: volunteer, error } = await supabase
    .rpc('verify_volunteer', { v_id: resolvedParams.id })

  if (error || !volunteer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <XCircle className="w-16 h-16 text-destructive" />
            <h1 className="text-2xl font-bold font-display text-ink">Invalid ID Card</h1>
            <p className="text-muted-foreground">This QR code does not match any registered volunteer in our system. It may be forged or deleted.</p>
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded-[10px] border-3 border-ink shadow-hard-xs break-all w-full text-left font-semibold">
              <strong>ID Scanned:</strong> {error ? "Invalid Code" : resolvedParams.id.substring(0, 8) + '...'}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isApproved = volunteer.status === 'Approved'
  const isPending = volunteer.status === 'Pending'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full overflow-hidden">
        <div className={`h-32 ${isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-destructive'} flex items-center justify-center border-b-3 border-ink`}>
          {isApproved && <CheckCircle2 className="w-16 h-16 text-white" />}
          {isPending && <AlertTriangle className="w-16 h-16 text-white" />}
          {!isApproved && !isPending && <XCircle className="w-16 h-16 text-white" />}
        </div>

        <CardHeader className="text-center -mt-10 pb-2 relative z-10">
          <div className="w-20 h-24 mx-auto rounded-[10px] overflow-hidden border-3 border-ink shadow-hard-xs bg-card flex items-center justify-center">
            {volunteer.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={volunteer.photo_url} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">No Photo</span>
            )}
          </div>
          <CardTitle className="mt-4 text-2xl font-bold font-display text-ink">{volunteer.full_name}</CardTitle>
          <div className="inline-block px-3 py-1 mt-2 rounded-full text-sm font-bold tracking-wider uppercase bg-secondary text-secondary-foreground border-2 border-ink shadow-hard-xs">
            {volunteer.snk_id || volunteer.id.substring(0, 8).toUpperCase()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className={`p-4 rounded-xl border-3 border-ink shadow-hard-xs flex flex-col items-center justify-center text-center ${isApproved ? 'bg-emerald-50 text-emerald-800' :
              isPending ? 'bg-amber-50 text-amber-800' :
                'bg-rose-50 text-rose-800'
            }`}>
            <span className="text-xs font-bold uppercase opacity-70 mb-1">Current Status</span>
            <span className="text-lg font-black uppercase tracking-widest">{volunteer.status}</span>
            {isApproved && <span className="text-xs mt-1 font-semibold">Valid for 60th Nirankari Sant Samagam Maharashtra 2027</span>}
            {isPending && <span className="text-xs mt-1 font-semibold">Card is currently pending approval.</span>}
            {!isApproved && !isPending && <span className="text-xs mt-1 font-semibold">This card has been rejected or disabled.</span>}
          </div>

          <div className="grid grid-cols-2 gap-4 pb-2">
            <div className="flex flex-col gap-1 p-3 bg-card rounded-xl border-3 border-ink shadow-hard-xs">
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase"><Building className="w-3.5 h-3.5" /> Model Area</span>
              <span className="text-sm font-bold text-ink truncate">{volunteer.models?.name || 'Unassigned'}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-card rounded-xl border-3 border-ink shadow-hard-xs">
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase"><Users className="w-3.5 h-3.5" /> Branch</span>
              <span className="text-sm font-bold text-ink truncate">{volunteer.branch || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-card rounded-xl border-3 border-ink shadow-hard-xs">
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase"><Hash className="w-3.5 h-3.5" /> Designation</span>
              <span className="text-sm font-bold text-ink truncate">{volunteer.designation || volunteer.role}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-card rounded-xl border-3 border-ink shadow-hard-xs">
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase"><Phone className="w-3.5 h-3.5" /> Mobile</span>
              <span className="text-sm font-bold text-ink truncate">{volunteer.mobile_number}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
