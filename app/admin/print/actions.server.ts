'use server'

import { createClient, checkAuth } from '@/lib/supabase/server'

export async function getPrintVolunteersAction(selectedIds?: string[] | null) {
  await checkAuth()
  const supabase = await createClient()

  let query = supabase
    .from('volunteers')
    .select(`
      id,
      snk_id,
      full_name,
      mobile_number,
      gender,
      age,
      emergency_contact,
      address,
      role,
      branch,
      accommodation,
      designation,
      photo_url,
      status,
      models:model_id (
        name,
        profiles:head_id (
          full_name
        )
      )
    `)

  let isFiltered = false

  if (selectedIds && selectedIds.length > 0) {
    query = query.in('id', selectedIds)
    isFiltered = true
  } else {
    query = query.eq('status', 'Approved')
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const mapped = (data || []).map((v: any) => {
    const modelObj = Array.isArray(v.models) ? v.models[0] : v.models
    const headObj = modelObj?.profiles
    const headName = Array.isArray(headObj) ? headObj[0]?.full_name : headObj?.full_name || 'Unassigned'
    
    return {
      id: v.id,
      snk_id: v.snk_id,
      name: v.full_name,
      mobile: v.mobile_number,
      model: modelObj?.name || 'Unassigned',
      branch: v.branch,
      accommodation: v.accommodation,
      headName: headName,
      role: v.designation || v.role || 'Volunteer',
      photoUrl: v.photo_url,
      emergencyContact: v.emergency_contact || 'N/A'
    }
  })

  return { volunteers: mapped, isFiltered }
}
