'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import { toast } from 'sonner'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!email || !password) {
      toast.error('Please enter both email and password.')
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
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
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none">
      {/* Slow Ambient Aurora Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] left-[20%] w-[650px] h-[650px] rounded-full bg-blue-500/15 dark:bg-blue-600/20 blur-[140px] animate-aurora-1" />
        <div className="absolute -bottom-[20%] right-[20%] w-[700px] h-[700px] rounded-full bg-indigo-500/15 dark:bg-indigo-600/20 blur-[150px] animate-aurora-2" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side: 3D Showcase Panel */}
        <div className="hidden lg:flex flex-col justify-between h-[520px] p-10 rounded-3xl glass-panel glass-edge-light relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold w-max">
            <Sparkles className="w-4 h-4" />
            <span>Spatial Portal v2027</span>
          </div>

          <div className="relative z-10 my-auto text-center space-y-4">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="relative w-48 h-48 mx-auto"
            >
              <Image
                src="/logo.png"
                alt="Bal Pradarshani Logo"
                fill
                priority
                className="object-contain drop-shadow-2xl"
              />
            </motion.div>

            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bal Pradarshani Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Experience the next-generation spatial credential system for volunteers and model heads.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/60 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Encrypted Authentication</span>
            </div>
            <span className="font-mono">60th Samagam</span>
          </div>
        </div>

        {/* Right Side: Floating Login Glass Form */}
        <GlassCard className="p-8 sm:p-10 shadow-2xl" glowColor="blue">
          <div className="space-y-2 mb-8">
            <span className="text-[11px] font-mono uppercase tracking-widest text-blue-500 font-semibold block">
              Secure Access
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign In to Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your credentials to manage volunteer badges and event rosters.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-[16px] mt-4 text-[15px]"
            >
              {loading ? (
                <>
                  <AnimatedLoader className="w-4 h-4 text-white mr-2" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
