'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface InstallEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
const InstallContext = createContext({ installed: false, install: () => {} })

export function AppInstallProvider({ children }: { children: ReactNode }) {
  const prompt = useRef<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [guide, setGuide] = useState<'ios' | 'browser' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const media = window.matchMedia?.('(display-mode: standalone)')
    let active = true
    const update = () => { if (active) setInstalled(!!media?.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone) }
    const capture = (event: Event) => { event.preventDefault(); prompt.current = event as InstallEvent }
    const complete = () => { prompt.current = null; setInstalled(true); setGuide(null) }
    queueMicrotask(update)
    media?.addEventListener?.('change', update)
    window.addEventListener('beforeinstallprompt', capture)
    window.addEventListener('appinstalled', complete)
    return () => { active = false; media?.removeEventListener?.('change', update); window.removeEventListener('beforeinstallprompt', capture); window.removeEventListener('appinstalled', complete) }
  }, [])

  const showGuide = () => setGuide(/iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 ? 'ios' : 'browser')
  const install = () => {
    if (installed) return
    setError('')
    const event = prompt.current
    if (!event) { showGuide(); return }
    prompt.current = null
    void (async () => {
      try { await event.prompt(); await event.userChoice }
      catch { setError('The browser could not open the install prompt. Use its menu instead.'); showGuide() }
    })()
  }

  return <InstallContext.Provider value={{ installed, install }}>
    {children}
    <Dialog open={guide !== null} onOpenChange={open => { if (!open) setGuide(null) }}>
      <DialogContent className="max-h-[calc(100dvh-32px)] overflow-y-auto">
        <DialogHeader><DialogTitle>Install Bal Pradarshani</DialogTitle><DialogDescription>Add the portal to your home screen for quick access.</DialogDescription></DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {guide === 'ios' ? <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          <li>Open this page in Safari on your iPhone or iPad.</li><li>Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>, then open the app from your home screen.</li>
        </ol> : <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          <li>Open your browser menu, usually the three dots at the top.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, then confirm.</li><li>If the option is unavailable, open this site in Chrome or Edge and try again.</li>
        </ol>}
        <p className="text-sm leading-relaxed text-muted-foreground">Installing the app does not prepare offline access. While connected, use Preparation and saved records to save the event data and verify app files on this device.</p>
        <Button onClick={() => setGuide(null)}>Got it</Button>
      </DialogContent>
    </Dialog>
  </InstallContext.Provider>
}

export const useAppInstall = () => useContext(InstallContext)
