'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getHeadDashboardDataAction() {
  const supabase = await createClient()

  let profileId = ''
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    profileId = user.id
  } else {
    // Fallback to cookie for mock-user
    const cookieStore = await cookies()
    const mockUserCookie = cookieStore.get('mock-user')
    if (mockUserCookie) {
      try {
        const sessionUser = JSON.parse(decodeURIComponent(mockUserCookie.value))
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', sessionUser.email)
          .single()
        if (profile) profileId = profile.id
      } catch (e) {
        console.error('Error parsing mock-user cookie:', e)
      }
    }
  }

  if (!profileId) profileId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' // fallback testing ID

  const { data: modelsData, error: modelsErr } = await supabase
    .from('models')
    .select('id, name, exhibition_category, status')
    .eq('head_id', profileId)

  if (modelsErr) throw new Error(modelsErr.message)

  let stats = { volunteersCount: 0, approvedCount: 0, pendingCount: 0 }
  
  if (modelsData && modelsData.length > 0) {
    const modelIds = modelsData.map((m: any) => m.id)
    const { data: volData, error: volErr } = await supabase
      .from('volunteers')
      .select('status')
      .in('model_id', modelIds)

    if (volErr) throw new Error(volErr.message)

    stats = {
      volunteersCount: volData?.length || 0,
      approvedCount: volData?.filter((v: any) => v.status === 'Approved').length || 0,
      pendingCount: volData?.filter((v: any) => v.status === 'Pending').length || 0
    }
  }

  return {
    models: modelsData || [],
    stats
  }
}
