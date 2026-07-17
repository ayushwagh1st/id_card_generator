'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { BellRing } from 'lucide-react'

export function GlobalNotificationProvider() {
  useEffect(() => {
    let cleanup: (() => void) | undefined

    const init = async () => {
      const { setupGlobalNotifications } = await import('@/lib/supabase/client')
      cleanup = await setupGlobalNotifications('attendance')
    }

    init()

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  return null
}
