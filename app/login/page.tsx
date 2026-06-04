'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tent, Mail, Lock, Rocket, Palette, Sparkles, Smile, Star } from 'lucide-react'
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-cyan-400 via-yellow-300 to-pink-400 p-4 sm:p-6 relative overflow-hidden select-none font-sans">
      {/* Decorative Vector Art (Floating Icons) */}
      <Rocket className="absolute top-10 left-10 w-24 h-24 text-pink-500/80 animate-bounce -rotate-12 drop-shadow-xl" strokeWidth={1.5} />
      <Palette className="absolute bottom-20 left-20 w-32 h-32 text-purple-500/80 animate-pulse drop-shadow-xl rotate-12" strokeWidth={1.5} />
      <Sparkles className="absolute top-20 right-20 w-20 h-20 text-yellow-600/90 drop-shadow-lg" strokeWidth={1.5} />
      <Star className="absolute bottom-32 right-32 w-16 h-16 text-cyan-600/70 animate-bounce drop-shadow-xl" strokeWidth={2} />
      <Smile className="absolute top-1/2 left-1/4 w-12 h-12 text-orange-500/80 -rotate-12 drop-shadow-md" strokeWidth={2} />

      {/* Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white/40 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-400/30 blur-3xl -z-10" />
      
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl border-4 border-white shadow-2xl rounded-[2.5rem] p-4 sm:p-6 animate-in zoom-in-95 fade-in duration-500 relative z-10">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto bg-gradient-to-tr from-pink-500 to-orange-400 p-5 rounded-[2rem] w-fit shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Tent className="w-10 h-10 text-white drop-shadow-md" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 drop-shadow-sm">
              Bal Pradarshani
            </CardTitle>
            <p className="text-sm font-bold text-gray-500 tracking-wide uppercase">ID Generation Portal</p>
          </div>
          <CardDescription className="text-gray-500 text-sm font-medium">
            Welcome to the magical exhibition! Please login to issue volunteer passes.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black text-gray-700 uppercase tracking-wider pl-1">Email ID</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@exhibition.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-white border-2 border-gray-200 text-gray-800 placeholder-gray-400 focus-visible:ring-pink-500/50 focus-visible:border-pink-500 rounded-2xl transition-all duration-300 shadow-sm font-medium text-lg"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between pl-1">
                <Label htmlFor="password" className="text-xs font-black text-gray-700 uppercase tracking-wider">Password</Label>
                <Link href="/forgot-password" className="text-[11px] font-bold text-cyan-600 hover:text-cyan-500 hover:underline transition-all uppercase tracking-wide">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 bg-white border-2 border-gray-200 text-gray-800 placeholder-gray-400 focus-visible:ring-pink-500/50 focus-visible:border-pink-500 rounded-2xl transition-all duration-300 shadow-sm font-medium text-lg"
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-6 flex flex-col gap-3">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-black text-lg h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <AnimatedLoader className="w-5 h-5" />
                  Entering...
                </>
              ) : 'Hop In! 🚀'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
