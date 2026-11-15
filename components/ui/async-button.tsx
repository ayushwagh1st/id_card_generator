'use client'

import { useRef, useState, type ComponentProps } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from './button'
import { touchFeedback } from '@/lib/touch-feedback'

export function AsyncButton({ onClick, children, disabled, busyLabel = 'Working…', ...props }: Omit<ComponentProps<typeof Button>, 'onClick'> & { onClick: () => Promise<unknown> | void; busyLabel?: string }) {
  const active = useRef(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const run = async () => {
    if (active.current || disabled) return
    active.current = true; setBusy(true); setFailed(false); touchFeedback()
    try { await onClick() } catch { setFailed(true) }
    finally { active.current = false; setBusy(false) }
  }
  return <span className="async-action"><Button {...props} disabled={disabled || busy} aria-busy={busy} onClick={() => { void run() }}><span className="async-button-labels"><span aria-hidden={busy} style={{ visibility: busy ? 'hidden' : 'visible' }}>{children}</span><span aria-hidden={!busy} style={{ visibility: busy ? 'visible' : 'hidden' }}><Loader2 className={busy ? 'operation-spinner' : undefined} size={15} aria-hidden="true" />{busyLabel}</span></span></Button>{failed && <span className="text-destructive text-xs" role="alert">Action failed. Try again.</span>}</span>
}
