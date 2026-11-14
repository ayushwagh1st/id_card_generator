'use server'
import { checkAuth } from '@/lib/supabase/server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function logActivityAction(
  actionType: string,
  target: string,
  details?: Record<string, any>
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value }
        }
      }
    )

    // 1. Get user
    let userId = null
    let userName = 'System'
    let role = 'SYSTEM'

    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user) {
      userId = authData.user.id
      role = authData.user.app_metadata?.role || 'UNKNOWN'
      
      // Try to get name from profile
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
      if (profile?.full_name) {
          userName = profile.full_name
      } else {
          userName = authData.user.email || 'Unknown User'
      }
    } else {
       // Mock User Fallback for dev mode
       const mockCookie = cookieStore.get('mock-user')?.value
       if (mockCookie) {
           try {
               const parsed = JSON.parse(decodeURIComponent(mockCookie))
               userId = parsed.id
               role = parsed.role
               userName = parsed.full_name || parsed.email
           } catch(e) {}
       }
    }

    // 2. Insert into activity_logs
    const { error } = await supabase.from('activity_logs').insert({
        user_id: userId,
        user_name: userName,
        role: role,
        action_type: actionType,
        target: target,
        details: details || {}
    })

    if (error) {
        console.error('Failed to log activity:', error)
    }

  } catch (err) {
    console.error('Activity logger exception:', err)
  }
}

export async function getActivitiesAction(limit = 50, filterRole = 'all') {
  await checkAuth();
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) { return cookieStore.get(name)?.value }
            }
          }
        )
        
        let query = supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(limit)

        if (filterRole !== 'all') {
            query = query.eq('role', filterRole)
        }

        const { data, error } = await query

        if (error) {
            // Check if table doesn't exist yet (for smooth error handling before user runs SQL)
            if (error.code === '42P01') {
                return { data: [], message: 'Activity logs table not created yet.' }
            }
            throw error
        }

        return { data }

    } catch (err: any) {
        console.error('Fetch activities error:', err)
        return { error: err.message }
    }
}
