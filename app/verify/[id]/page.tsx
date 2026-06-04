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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-zinc-200">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <ShieldAlert className="w-16 h-16 text-zinc-500" />
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-500">You do not have permission to view this volunteer's profile. Scanning must be performed by authorized staff.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: volunteer, error } = await supabase
    .rpc('verify_volunteer', { v_id: resolvedParams.id })

  if (error || !volunteer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-rose-100">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <XCircle className="w-16 h-16 text-rose-500" />
            <h1 className="text-2xl font-bold text-gray-900">Invalid ID Card</h1>
            <p className="text-gray-500">This QR code does not match any registered volunteer in our system. It may be forged or deleted.</p>
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded border border-red-200 break-all w-full text-left">
              <strong>Debug Error:</strong> {error ? (error.message || JSON.stringify(error)) : "Volunteer not found in database (0 rows)"}
              <br/>
              <strong>ID Scanned:</strong> {resolvedParams.id}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isApproved = volunteer.status === 'Approved'
  const isPending = volunteer.status === 'Pending'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl overflow-hidden">
        <div className={`h-32 ${isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'} flex items-center justify-center`}>
          {isApproved && <CheckCircle2 className="w-16 h-16 text-white" />}
          {isPending && <AlertTriangle className="w-16 h-16 text-white" />}
          {!isApproved && !isPending && <XCircle className="w-16 h-16 text-white" />}
        </div>
        
        <CardHeader className="text-center -mt-10 pb-2">
          <div className="w-20 h-24 mx-auto rounded-lg overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center">
            {volunteer.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={volunteer.photo_url} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-400">No Photo</span>
            )}
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">{volunteer.full_name}</CardTitle>
          <div className="inline-block px-3 py-1 mt-2 rounded-full text-sm font-bold tracking-wider uppercase bg-gray-100 text-gray-700 border">
            {volunteer.snk_id || volunteer.id.substring(0,8).toUpperCase()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
            isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
            isPending ? 'bg-amber-50 border-amber-200 text-amber-800' : 
            'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span className="text-xs font-bold uppercase opacity-70 mb-1">Current Status</span>
            <span className="text-lg font-black uppercase tracking-widest">{volunteer.status}</span>
            {isApproved && <span className="text-xs mt-1 font-medium">Valid for 60th Maharashtra Samagam 2027</span>}
            {isPending && <span className="text-xs mt-1 font-medium">Card is currently pending approval.</span>}
            {!isApproved && !isPending && <span className="text-xs mt-1 font-medium">This card has been rejected or disabled.</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase"><Building className="w-3.5 h-3.5" /> Model Area</span>
              <span className="text-sm font-bold text-gray-900">{volunteer.models?.name || 'Unassigned'}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase"><Users className="w-3.5 h-3.5" /> Branch</span>
              <span className="text-sm font-bold text-gray-900">{volunteer.branch || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase"><Hash className="w-3.5 h-3.5" /> Designation</span>
              <span className="text-sm font-bold text-gray-900">{volunteer.designation || volunteer.role}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase"><Phone className="w-3.5 h-3.5" /> Mobile</span>
              <span className="text-sm font-bold text-gray-900">{volunteer.mobile_number}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
