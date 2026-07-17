'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import { BellRing } from 'lucide-react'

export function GlobalNotificationProvider() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  useEffect(() => {
    // Only run if we actually have env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return
    }

    const channel = supabase.channel('global-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance' },
        (payload) => {
          toast('New Scan Recorded!', {
            icon: <BellRing className="w-4 h-4 text-emerald-500" />,
            description: `A check-in was just recorded (Session ID: ${payload.new.session_id.slice(0, 8)}...)`,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return null
}
