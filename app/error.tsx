'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // In production, this would securely ship logs to Datadog / Sentry
    console.error('[PROD_LOG] Global Error Caught:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString()
    })
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 shadow-inner">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">System Error Occurred</h1>
          <p className="text-zinc-400 text-sm">
            Our automated monitoring has logged this issue. Please try refreshing or return to the dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button onClick={() => reset()} className="bg-rose-600 hover:bg-rose-500 text-white w-full sm:w-auto font-bold rounded-xl shadow-md h-11">
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 w-full sm:w-auto font-bold h-11">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
