'use client'

import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { touchFeedback } from '@/lib/touch-feedback'

export function ActionForm({ onSubmit, children, className, ...props }: Omit<React.ComponentProps<'form'>, 'onSubmit' | 'children'> & { onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<unknown> | void; children: ReactNode }) {
  const active = useRef(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (active.current) return
    active.current = true
    setBusy(true)
    setFailed(false)
    touchFeedback()
    try { await onSubmit(event) }
    catch { setFailed(true) }
    finally { active.current = false; setBusy(false) }
  }
  return <form {...props} className={className} onSubmit={event => { void submit(event) }} aria-busy={busy}>
    <fieldset disabled={busy} className={`action-form-fields ${className || ''}`}>{children}</fieldset>
    <div className="action-form-feedback" role={failed ? 'alert' : 'status'} aria-live="polite">{busy ? <><Loader2 className="operation-spinner" size={15} aria-hidden="true" />Saving changes…</> : failed ? 'Could not save. Review your details and try again.' : null}</div>
  </form>
}
