'use client'

import { useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
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
    // Ignore Next.js devtools simulated errors
    if (error.message === 'NEXT_DEVTOOLS_SIMULATED_ERROR') return;

    if (navigator.onLine) {
      console.error('[PROD_LOG] Global Error Caught:', {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString()
      })
    }
  }, [error])

  const isOfflineError = typeof navigator !== 'undefined' && !navigator.onLine;
  const displayTitle = isOfflineError ? 'This page needs a connection.' : 'This page couldn’t load.';
  const displayMessage = isOfflineError 
    ? 'This specific page was not saved to your offline cache. Please reconnect to the internet to view it.'
    : 'Try loading the page again. If the problem continues, return home and contact support.';

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
          <AlertTriangle aria-hidden="true" className="w-7 h-7 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-normal font-serif tracking-tight">{displayTitle}</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            {displayMessage}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button onClick={() => reset()} className="w-full sm:w-auto">
            Try Again
          </Button>
          <a href="/offline" className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })}>Open saved event tools</a>
          <Link href="/" className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })}>
              <Home aria-hidden="true" className="w-4 h-4 mr-2" />
              Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
