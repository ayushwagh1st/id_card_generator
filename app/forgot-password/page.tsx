'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, KeyRound, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!email) {
      toast.error('Please enter your email address.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setIsSent(true)
      toast.success('Password reset email sent!')
    } catch (err: any) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-950 via-zinc-900 to-orange-950 p-4 sm:p-6 relative overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#E65100]/10 blur-3xl -z-10" />
      
      <Card className="w-full max-w-md backdrop-blur-md bg-white/5 border border-white/10 text-white shadow-2xl rounded-2xl p-2 sm:p-4 animate-in zoom-in-95 fade-in duration-500">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="mx-auto bg-amber-500/20 p-4 rounded-2xl w-fit border border-amber-500/30 shadow-inner">
            <KeyRound className="w-8 h-8 text-amber-500" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-300">
            Reset Password
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs sm:text-sm">
            Enter your email to receive a password reset link.
          </CardDescription>
        </CardHeader>
        
        {isSent ? (
          <CardContent className="space-y-4 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm font-medium">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
            </div>
            <Link href="/login" className="text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors inline-block mt-2">
              Return to Login
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email ID</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@voluntrack.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-zinc-500 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 rounded-xl transition-all duration-300"
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-11 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Link...
                  </>
                ) : 'Send Reset Link'}
              </Button>
              <Link href="/login" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mt-2">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
