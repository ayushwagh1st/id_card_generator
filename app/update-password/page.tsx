'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { KeyRound, CheckCircle2, Lock } from 'lucide-react'
import { AnimatedLoader } from '@/components/ui/animated-loader'
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ghost letter */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-bold text-foreground select-none pointer-events-none"
        style={{ fontSize: 'clamp(220px, 45vw, 480px)', opacity: 0.04, lineHeight: 1 }}
        aria-hidden="true"
      >
        U
      </div>
      
      <Card className="w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="mx-auto icon-tile icon-tile-lavender w-14 h-14 shadow-hard-sm">
            {isSuccess ? <CheckCircle2 className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold font-display text-ink">
            {isSuccess ? 'Password Updated' : 'Set New Password'}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm font-sans">
            {isSuccess ? 'Your password has been successfully updated.' : 'Enter your new secure password below.'}
          </CardDescription>
        </CardHeader>
        
        {isSuccess ? (
          <CardContent className="space-y-4 text-center pb-6">
            <p className="text-sm text-foreground/60 font-sans">Redirecting to login securely...</p>
            <AnimatedLoader className="w-6 h-6 mx-auto" />
          </CardContent>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-display font-semibold text-sm text-foreground">New Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="font-display font-semibold text-sm text-foreground">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
                  <Input
                    type="password"
                    placeholder="Repeat new password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <AnimatedLoader className="w-4 h-4" />
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
