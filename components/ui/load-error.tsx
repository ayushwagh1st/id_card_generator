'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'

export function LoadError({ message, onRetry, retrying = false }: { message: string; onRetry: () => void; retrying?: boolean }) {
  return <div className="load-error" role="alert">
    <AlertCircle size={20} aria-hidden="true" />
    <div><strong>Couldn’t load this information</strong><p>{message}</p></div>
    <Button variant="outline" onClick={onRetry} disabled={retrying}><RefreshCw size={16} aria-hidden="true" />{retrying ? 'Retrying…' : 'Retry'}</Button>
  </div>
}
