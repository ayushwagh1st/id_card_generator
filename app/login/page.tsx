'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!email || !password) {
      toast.error('Please enter both email and password.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        toast.success('Logged in successfully')
        const role = data.user.user_metadata?.role
        if (role === 'SUPER_ADMIN') {
          router.refresh()
          router.push('/admin/dashboard')
        } else if (role === 'MODEL_HEAD') {
          router.refresh()
          router.push('/head/dashboard')
        } else if (role === 'LECTURER') {
          router.refresh()
          router.push('/lecturer/dashboard')
        } else {
          router.refresh()
          router.push('/')
        }
      }
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
        <div className="hidden lg:flex flex-col justify-center items-center h-[90vh] bento-pink pattern-dots relative overflow-hidden group border-ink shadow-hard rounded-[32px]">
          <div className="absolute top-8 left-8 badge-flat bg-white text-ink border-ink transform -rotate-3 z-20">
            <Sparkles className="w-4 h-4 mr-2" />
            Portal Access
          </div>
          
          <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2 w-full max-w-[80%] aspect-square flex items-center justify-center">
            <Image 
              src="/images/login_illustration.png" 
              alt="Magical ID Portal" 
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain drop-shadow-[12px_12px_0_rgba(17,17,17,1)]"
              priority
            />
          </div>
          
          <div className="absolute bottom-8 right-8 bento-yellow p-4 shadow-hard flex items-center gap-3 transform rotate-3 z-20">
             <ShieldCheck className="w-6 h-6 text-ink" />
             <span className="font-display font-bold text-ink">Secure & Fast</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex justify-center items-center h-full w-full">
          <div className="w-full max-w-md card-flat p-8 sm:p-10 bg-white shadow-hard relative">
            <div className="absolute -top-6 -right-6 icon-tile icon-tile-mint w-14 h-14 shadow-hard transform rotate-6 z-10">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-4 pb-8">
              <span className="eyebrow text-ink/70">Welcome Back</span>
              <h1 className="text-4xl font-bold font-display text-ink leading-tight">
                Enter the <br/> <span className="text-[var(--color-pink)]" style={{ textShadow: '2px 2px 0 #111111, -1px -1px 0 #111111, 1px -1px 0 #111111, -1px 1px 0 #111111, 1px 1px 0 #111111' }}>Portal</span>
              </h1>
              <p className="text-muted-foreground text-sm font-sans font-medium leading-relaxed">
                Enter your credentials to access the magical ID portal system. Let's make some magic!
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-display font-bold text-sm text-ink">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink/50 group-focus-within:text-ink transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 border-ink-2 shadow-hard-xs rounded-xl font-medium text-lg focus-visible:ring-0 focus-visible:shadow-hard transition-shadow"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                  <Label htmlFor="password" className="font-display font-bold text-sm text-ink">
                    Password
                  </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink/50 group-focus-within:text-ink transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 border-ink-2 shadow-hard-xs rounded-xl font-medium text-lg focus-visible:ring-0 focus-visible:shadow-hard transition-shadow"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="btn-primary w-full h-14 bg-[var(--color-yellow)] text-ink border-ink shadow-hard hover:bg-[var(--color-lime)] flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <AnimatedLoader className="w-5 h-5 text-ink" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Let's Go!</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
