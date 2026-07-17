'use server'

import { createClient, checkAuth } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { logActivityAction } from './activity'
import { volunteerSchema, bulkImportVolunteerSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

export async function getVolunteersAction(
  page: number = 1,
  limit: number = 20,
  query: string = '',
  statusFilter: string = 'all',
  modelFilter: string = 'all'
) {
  await checkAuth();
  const supabase = await createClient()

  // Get user role for RLS / manual filtering
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Support Mock User
  const cookieStore = await cookies()
  const mockUserStr = cookieStore.get('mock-user')?.value
  let role = user.user_metadata?.role
  let headEmail = user.email

  if (mockUserStr) {
    try {
      const mockUser = JSON.parse(mockUserStr)
      role = mockUser.role
      headEmail = mockUser.email
    } catch(e) {}
  }

  // Model Head can only see their own assigned models
  let allowedModelIds: string[] = []
  if (role === 'MODEL_HEAD' && headEmail) {
    const { data: headProfile } = await supabase.from('profiles').select('id').eq('email', headEmail).single()
    if (headProfile) {
      const { data: models } = await supabase.from('models').select('id').eq('head_id', headProfile.id)
      allowedModelIds = (models || []).map(m => m.id)
    }
  }

  let dbQuery = supabase
    .from('volunteers')
    .select(`
      *,
      models:model_id ( name, profiles:head_id ( full_name ) )
    `, { count: 'exact' })

  if (role === 'MODEL_HEAD') {
    if (allowedModelIds.length === 0) {
      return { data: [], count: 0 }
    }
    dbQuery = dbQuery.in('model_id', allowedModelIds)
  }

  if (statusFilter && statusFilter !== 'all') {
    dbQuery = dbQuery.eq('status', statusFilter)
  }
  if (modelFilter && modelFilter !== 'all') {
    dbQuery = dbQuery.eq('model_id', modelFilter)
  }

  if (query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query}%,mobile_number.ilike.%${query}%,snk_id.ilike.%${query}%`)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await dbQuery.order('created_at', { ascending: false }).range(from, to)

  if (error) {
    console.error('[PROD_LOG] Error in getVolunteersAction:', error)
    throw new Error('Could not fetch volunteers at this time.')
  }

  return { data, count }
}

export async function addVolunteerAction(formData: any) {
  await checkAuth();
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rateLimit = await checkRateLimit(`add_vol_${ip}`, 10, 60000)
  if (!rateLimit.success) return { error: 'Too many requests. Please try again later.' }

  const parsed = volunteerSchema.safeParse(formData)
  if (!parsed.success) return { error: 'Invalid input data', details: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  // Insert
  const { data, error } = await supabase.from('volunteers').insert([parsed.data]).select().single()
  
  if (error) {
    console.error('[PROD_LOG] Error in addVolunteerAction:', error)
    return { error: 'Failed to add volunteer due to a database error.' }
  }
  
  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  
  await logActivityAction('CREATE_VOLUNTEER', `Volunteer: ${formData.full_name}`, formData)
  
  return { success: true, data }
}

export async function updateVolunteerAction(id: string, formData: any) {
  await checkAuth();
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rateLimit = await checkRateLimit(`update_vol_${ip}`, 20, 60000)
  if (!rateLimit.success) return { error: 'Too many requests. Please try again later.' }

  const parsed = volunteerSchema.partial().safeParse(formData)
  if (!parsed.success) return { error: 'Invalid input data', details: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()

  const { error } = await supabase.from('volunteers').update(parsed.data).eq('id', id)
  
  if (error) {
    console.error(`[PROD_LOG] Error in updateVolunteerAction for ID ${id}:`, error)
    return { error: 'Failed to update volunteer record.' }
  }
  
  const volName = formData.full_name || id
  await logActivityAction('UPDATE_VOLUNTEER', `Volunteer: ${volName}`, formData)

  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  return { success: true }
}

export async function deleteVolunteerAction(id: string) {
  await checkAuth();
  const supabase = await createClient()
  const { data: volunteer, error } = await supabase.from('volunteers').delete().eq('id', id).select('full_name').single()
  if (error) {
    console.error(`[PROD_LOG] Error in deleteVolunteerAction for ID ${id}:`, error)
    return { error: 'Failed to delete volunteer.' }
  }
  
  await logActivityAction('DELETE_VOLUNTEER', `Volunteer: ${volunteer?.full_name || id}`)

  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  return { success: true }
}

export async function bulkDeleteVolunteersAction(ids: string[]) {
  await checkAuth();
  const supabase = await createClient()
  const { error } = await supabase.from('volunteers').delete().in('id', ids)
  if (error) {
    console.error('[PROD_LOG] Error in bulkDeleteVolunteersAction:', error)
    return { error: 'Failed to delete selected volunteers.' }
  }
  
  await logActivityAction('BULK_DELETE', `${ids.length} volunteers deleted`)

  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  return { success: true }
}

export async function bulkApproveVolunteersAction(ids: string[]) {
  await checkAuth();
  const supabase = await createClient()
  const { error } = await supabase.from('volunteers').update({ status: 'Approved' }).in('id', ids)
  if (error) {
    console.error('[PROD_LOG] Error in bulkApproveVolunteersAction:', error)
    return { error: 'Failed to approve selected volunteers.' }
  }
  
  await logActivityAction('BULK_STATUS_UPDATE', `${ids.length} volunteers updated to Approved`)

  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  return { success: true }
}

export async function bulkImportVolunteersAction(records: any[]) {
  await checkAuth();
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rateLimit = await checkRateLimit(`bulk_vol_${ip}`, 5, 60000)
  if (!rateLimit.success) return { error: 'Too many requests. Please try again later.' }

  const parsed = bulkImportVolunteerSchema.safeParse(records)
  if (!parsed.success) return { error: 'Invalid input data format in bulk import.', details: parsed.error.flatten() }

  if (parsed.data.length === 0) {
    return { success: true, count: 0, duplicates: 0 }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('volunteers').insert(parsed.data)
  if (error) {
    console.error('[PROD_LOG] Error in bulkImportVolunteersAction:', error)
    return { error: 'Bulk import encountered a database error.' }
  }

  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  
  return { success: true, count: records.length, duplicates: 0 }
}

export async function uploadVolunteerPhotoAction(formData: FormData) {
  await checkAuth()
  const file = formData.get('file') as File | null
  if (!file) throw new Error('No file provided')

  const fileExt = 'jpg'
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${fileName}`

  const supabase = await createClient()
  const { data, error: uploadError } = await supabase.storage
    .from('volunteer-photos')
    .upload(filePath, file)

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = supabase.storage
    .from('volunteer-photos')
    .getPublicUrl(filePath)

  return { publicUrl: urlData.publicUrl }
}
