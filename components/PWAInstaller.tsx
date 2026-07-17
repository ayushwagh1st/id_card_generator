'use client'

import { useEffect } from 'react'

export function PWAInstaller() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleLoad = () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.error('Service Worker registration failed:', err)
        })
      }
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])
  return null
}
