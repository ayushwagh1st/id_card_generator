'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Mail, KeyRound, ArrowLeft, Send } from 'lucide-react'
import { AnimatedLoader } from '@/components/ui/animated-loader'
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
    <div className="flex min-h-screen bg-background relative overflow-hidden select-none p-4 sm:p-8">
      {/* Container */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Illustration / Brand */}
        <div className="hidden lg:flex flex-col justify-center items-center h-[90vh] bento-blue pattern-grid relative overflow-hidden group border-ink shadow-hard rounded-[32px]">
          <div className="absolute top-8 left-8 badge-flat bg-white text-ink border-ink transform rotate-2 z-20">
            <KeyRound className="w-4 h-4 mr-2" />
            Recovery Mode
          </div>
          
          <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2 w-full max-w-[80%] aspect-square flex items-center justify-center">
            <Image 
              src="/images/forgot_pwd_illustration.png" 
              alt="Password Recovery" 
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain drop-shadow-[12px_12px_0_rgba(17,17,17,1)]"
              priority
            />
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex justify-center items-center h-full w-full">
          <div className="w-full max-w-md card-flat p-8 sm:p-10 bg-white shadow-hard relative">
            <div className="absolute -top-6 -left-6 icon-tile icon-tile-peach w-14 h-14 shadow-hard transform -rotate-6 z-10">
              <KeyRound className="w-7 h-7" />
            </div>

            <div className="space-y-4 pb-8 text-right">
              <span className="eyebrow text-ink/70">Reset Password</span>
              <h1 className="text-4xl font-bold font-display text-ink leading-tight">
                Lost the <br/> <span className="text-[var(--color-blue)]" style={{ textShadow: '2px 2px 0 #111111, -1px -1px 0 #111111, 1px -1px 0 #111111, -1px 1px 0 #111111, 1px 1px 0 #111111' }}>Key?</span>
              </h1>
              <p className="text-muted-foreground text-sm font-sans font-medium leading-relaxed">
                Enter your email address and we'll send you a magical link to reset your password.
              </p>
            </div>
            
            {isSent ? (
              <div className="space-y-6 text-center animate-in slide-in-from-bottom-4">
                <div className="bento-mint p-6 shadow-hard-xs transform rotate-1">
                  <p className="text-ink text-base font-bold">
                    We've sent a recovery link to:
                  </p>
                  <p className="text-ink text-lg font-display bg-white px-3 py-1 rounded-lg border-ink-2 mt-2 shadow-hard-xs inline-block">
                    {email}
                  </p>
                  <p className="text-ink/80 text-sm mt-3 font-medium">
                    Please check your inbox and spam folder.
                  </p>
                </div>
                <Link href="/login" className="btn-secondary w-full h-14 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Return to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2 text-right">
                  <Label htmlFor="email" className="font-display font-bold text-sm text-ink">
                    Email Address
                  </Label>
                  <div className="relative group text-left">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink/50 group-focus-within:text-ink transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@voluntrack.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 border-ink-2 shadow-hard-xs rounded-xl font-medium text-lg focus-visible:ring-0 focus-visible:shadow-hard transition-shadow"
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <button
                    type="submit"
                    className="btn-primary w-full h-14 bg-[var(--color-peach)] text-ink border-ink shadow-hard hover:bg-[var(--color-yellow)] flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <AnimatedLoader className="w-5 h-5 text-ink" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Magic Link</span>
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  
                  <Link href="/login" className="flex items-center justify-center font-display font-bold text-sm text-ink/60 hover:text-ink transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
