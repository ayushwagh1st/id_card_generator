'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, KeyRound, CheckCircle2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Ensure user is logged in (auth callback should have established session)
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        toast.error('Session expired or invalid link.')
        router.push('/login')
      }
    }
    checkSession()
  }, [supabase.auth, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters.')
    }
    
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.')
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // Also update the profiles table if they are a MODEL_HEAD to keep temp_password sync, 
      // but typically we don't need to do that for self-service resets. We'll just update auth.
      
      setIsSuccess(true)
      toast.success('Password updated successfully!')
      
      // Auto redirect to login
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (err: any) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-950 via-zinc-900 to-emerald-950 p-4 sm:p-6 relative overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#10B981]/10 blur-3xl -z-10" />
      
      <Card className="w-full max-w-md backdrop-blur-md bg-white/5 border border-white/10 text-white shadow-2xl rounded-2xl p-2 sm:p-4 animate-in zoom-in-95 fade-in duration-500">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="mx-auto bg-emerald-500/20 p-4 rounded-2xl w-fit border border-emerald-500/30 shadow-inner">
            {isSuccess ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <KeyRound className="w-8 h-8 text-emerald-500" />}
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-300">
            {isSuccess ? 'Password Updated' : 'Set New Password'}
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs sm:text-sm">
            {isSuccess ? 'Your password has been successfully updated.' : 'Enter your new secure password below.'}
          </CardDescription>
        </CardHeader>
        
        {isSuccess ? (
          <CardContent className="space-y-4 text-center pb-6">
            <p className="text-sm text-zinc-300">Redirecting to login securely...</p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
          </CardContent>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">New Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-zinc-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 rounded-xl transition-all duration-300"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    type="password"
                    placeholder="Repeat new password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-zinc-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 rounded-xl transition-all duration-300"
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : 'Update Password'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
