'use client'

import { useEffect } from 'react'

export function PWAInstaller() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        void navigator.serviceWorker.getRegistrations().then(async registrations => {
          const appWorker = new URL('/sw.js', window.location.origin).href
          let removed = false
          for (const registration of registrations) {
            const worker = registration.active || registration.waiting || registration.installing
            if (worker?.scriptURL === appWorker) removed = await registration.unregister() || removed
          }
          if (removed && navigator.serviceWorker.controller?.scriptURL === appWorker) window.location.reload()
        }).catch(error => console.error('[PWA] Development worker cleanup failed:', error))
        return
      }
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope)
        })
        .catch((err) => {
          console.error('[PWA] Service Worker registration failed:', err)
        })
    }
  }, [])
  return null
}
