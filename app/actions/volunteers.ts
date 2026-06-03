'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function getVolunteersAction(
  page: number = 1,
  limit: number = 10,
  query: string = '',
  statusFilter: string = 'all',
  modelFilter: string = 'all'
) {
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
  const supabase = await createClient()
  
  // Basic Duplicate Check by Mobile Number
  const { data: existing } = await supabase
    .from('volunteers')
    .select('id')
    .eq('mobile_number', formData.mobile_number)
    .single()
    
  if (existing) {
    return { error: 'A volunteer with this mobile number already exists.' }
  }

  // Insert
  const { data, error } = await supabase.from('volunteers').insert([formData]).select().single()
  
  if (error) {
    console.error('[PROD_LOG] Error in addVolunteerAction:', error)
    return { error: 'Failed to add volunteer due to a database error.' }
  }
  
  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  return { success: true, data }
}

export async function updateVolunteerAction(id: string, formData: any) {
  const supabase = await createClient()

  if (formData.mobile_number) {
    const { data: existing } = await supabase
      .from('volunteers')
      .select('id')
      .eq('mobile_number', formData.mobile_number)
      .neq('id', id)
      .single()
      
    if (existing) {
      return { error: 'A volunteer with this mobile number already exists.' }
    }
  }

  const { error } = await supabase.from('volunteers').update(formData).eq('id', id)
  
  if (error) {
    console.error(`[PROD_LOG] Error in updateVolunteerAction for ID ${id}:`, error)
    return { error: 'Failed to update volunteer record.' }
  }
  
  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  return { success: true }
}

export async function deleteVolunteerAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('volunteers').delete().eq('id', id)
  if (error) {
    console.error(`[PROD_LOG] Error in deleteVolunteerAction for ID ${id}:`, error)
    return { error: 'Failed to delete volunteer.' }
  }
  
  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  return { success: true }
}

export async function bulkDeleteVolunteersAction(ids: string[]) {
  const supabase = await createClient()
  const { error } = await supabase.from('volunteers').delete().in('id', ids)
  if (error) {
    console.error('[PROD_LOG] Error in bulkDeleteVolunteersAction:', error)
    return { error: 'Failed to delete selected volunteers.' }
  }
  
  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  return { success: true }
}

export async function bulkApproveVolunteersAction(ids: string[]) {
  const supabase = await createClient()
  const { error } = await supabase.from('volunteers').update({ status: 'Approved' }).in('id', ids)
  if (error) {
    console.error('[PROD_LOG] Error in bulkApproveVolunteersAction:', error)
    return { error: 'Failed to approve selected volunteers.' }
  }
  
  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  return { success: true }
}

export async function bulkImportVolunteersAction(records: any[]) {
  const supabase = await createClient()
  
  // Need to filter out existing mobile numbers
  const mobiles = records.map(r => r.mobile_number)
  const { data: existing } = await supabase.from('volunteers').select('mobile_number').in('mobile_number', mobiles)
  
  const existingSet = new Set((existing || []).map(e => e.mobile_number))
  const newRecords = records.filter(r => !existingSet.has(r.mobile_number))

  if (newRecords.length === 0) {
    return { success: true, count: 0, duplicates: records.length }
  }

  const { error } = await supabase.from('volunteers').insert(newRecords)
  if (error) {
    console.error('[PROD_LOG] Error in bulkImportVolunteersAction:', error)
    return { error: 'Bulk import encountered a database error.' }
  }

  revalidatePath('/admin/volunteers')
  revalidatePath('/head/volunteers')
  
  return { success: true, count: newRecords.length, duplicates: existingSet.size }
}
