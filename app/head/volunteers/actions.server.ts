'use server'

import { createClient, checkAuth } from '@/lib/supabase/server'

export async function getHeadVolunteersDataAction() {
  const supabase = await createClient()

  let profileId = ''
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    profileId = user.id
  } else {
    // Fallback to cookie for mock-user
    const { cookies } = await import('next/headers')
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
    .select('id, name')
    .eq('head_id', profileId)

  if (modelsErr) throw new Error(modelsErr.message)

  let volData = []
  
  if (modelsData && modelsData.length > 0) {
    const modelIds = modelsData.map((m: any) => m.id)
    const { data: vData, error: volErr } = await supabase
      .from('volunteers')
      .select(`
        *,
        models:model_id (
          name
        )
      `)
      .in('model_id', modelIds)
      .order('created_at', { ascending: false })

    if (volErr) throw new Error(volErr.message)
    volData = vData || []
  }

  return {
    models: modelsData || [],
    volunteers: volData
  }
}

export async function createVolunteerAction(payload: any) {
  await checkAuth()
  const supabase = await createClient()
  const { data, error } = await supabase.from('volunteers').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return { data }
}

export async function updateVolunteerAction(id: string, payload: any) {
  await checkAuth()
  const supabase = await createClient()
  const { data, error } = await supabase.from('volunteers').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return { data }
}

export async function bulkImportVolunteersAction(records: any[]) {
  await checkAuth()
  const supabase = await createClient()
  const { data, error } = await supabase.from('volunteers').insert(records)
  if (error) throw new Error(error.message)
  return { data }
}

export async function uploadVolunteerPhotoAction(formData: FormData) {
  await checkAuth()
  const supabase = await createClient()
  const file = formData.get('file') as File
  const filePath = formData.get('filePath') as string
  
  if (!file || !filePath) throw new Error('Missing file or file path')
  
  const { data, error } = await supabase.storage.from('volunteer-photos').upload(filePath, file)
  if (error) throw new Error(error.message)
  
  const { data: urlData } = supabase.storage.from('volunteer-photos').getPublicUrl(filePath)
  return { publicUrl: urlData.publicUrl }
}
