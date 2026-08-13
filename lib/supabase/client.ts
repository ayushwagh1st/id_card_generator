import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-id.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-supabase-anon-key-placeholder-12345'
  
  return createBrowserClient(url, key, {
    global: {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        if (typeof window !== 'undefined' && !navigator.onLine) {
          return new Response(
            JSON.stringify({ error: 'Offline mode active' }),
            { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'application/json' } }
          );
        }
        try {
          return await fetch(input, init);
        } catch (err) {
          return new Response(
            JSON.stringify({ error: 'Network unavailable' }),
            { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'application/json' } }
          );
        }
      },
    },
  })
}

export async function logoutUser() {
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')

  if (isMockMode) {
    document.cookie = 'mock-user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  } else {
    const supabase = createClient()
    await supabase.auth.signOut()
  }
}
export async function setupGlobalNotifications(tableName: string): Promise<(() => void) | undefined> {
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    
  if (isMockMode) return undefined
  if (typeof window !== 'undefined' && !navigator.onLine) return undefined

  try {
    const supabase = createClient()
    const [
      { toast },
      React,
      { BellRing }
    ] = await Promise.all([
      import('sonner'),
      import('react'),
      import('lucide-react')
    ])
    
    const channel = supabase.channel(`global-notifications-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: tableName },
        (payload: any) => {
          toast('New Scan Recorded!', {
            icon: React.createElement(BellRing, { className: "w-4 h-4 text-emerald-500" }),
            description: `A check-in was just recorded (Session ID: ${payload.new.session_id.slice(0, 8)}...)`,
          })
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  } catch (err) {
    console.error('Failed to initialize global notifications:', err)
    return undefined
  }
}
export async function setupLiveAttendanceNotifications(onUpdate: (payload: any) => void, tableName: string): Promise<(() => void) | undefined> {
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    
  if (isMockMode) return undefined
  if (typeof window !== 'undefined' && !navigator.onLine) return undefined

  try {
    const supabase = createClient()
    const channelName = `live-attendance-${Date.now()}-${Math.random()}`
    
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload: any) => {
          onUpdate(payload)
        }
      )
      .subscribe()
      
    return () => {
      channel.unsubscribe()
    }
  } catch (err) {
    console.error('Failed to initialize live attendance notifications:', err)
    return undefined
  }
}
