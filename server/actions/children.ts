'use server'

import { createClient, checkAuth } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getChildrenDirectoryAction() {
  await checkAuth()
  const supabase = await createClient()

  const { data: children, error } = await supabase
    .from('children')
    .select(`
      id, qr_id, name, contact_number, status, checked_in_at, checked_out_at, created_at,
      session:sessions(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching children directory:', error)
    return { error: 'Failed to fetch directory' }
  }

  const { data: qrCodes } = await supabase.from('qr_codes').select('id, serial_number')
  
  const enrichedChildren = children?.map(c => {
    const qrMatch = qrCodes?.find(q => q.id === c.qr_id)
    return {
      ...c,
      serial_number: qrMatch ? `MSS-2027-${String(qrMatch.serial_number).padStart(3, '0')}` : c.qr_id.substring(0, 8),
      session_name: (c.session as any)?.name || 'N/A'
    }
  }) || []

  return { data: enrichedChildren }
}

export async function bulkCheckOutAction(childIds: string[], checkOutTime?: string) {
  await checkAuth()
  const supabase = await createClient()

  if (!childIds || childIds.length === 0) return { error: 'No children selected' }

  const timeToSet = checkOutTime || new Date().toISOString()
  const { error } = await supabase
    .from('children')
    .update({ 
      status: 'Checked Out', 
      checked_out_at: timeToSet 
    })
    .in('id', childIds)

  if (error) {
    console.error('Bulk checkout error:', error)
    return { error: 'Failed to bulk check out' }
  }

  revalidatePath('/admin/directory')
  return { success: true }
}

export async function bulkCheckInAction(childIds: string[], checkInTime?: string) {
  await checkAuth()
  const supabase = await createClient()

  if (!childIds || childIds.length === 0) return { error: 'No children selected' }

  const timeToSet = checkInTime || new Date().toISOString()
  const { error } = await supabase
    .from('children')
    .update({ 
      status: 'Checked In', 
      checked_in_at: timeToSet 
    })
    .in('id', childIds)

  if (error) {
    console.error('Bulk checkin error:', error)
    return { error: 'Failed to bulk check in' }
  }

  revalidatePath('/admin/directory')
  return { success: true }
}

export async function recordChildCheckInAction(childId: string, checkInTime?: string) {
  await checkAuth()
  const supabase = await createClient()
  
  const now = checkInTime || new Date().toISOString()
  const { data, error } = await supabase
    .from('children')
    .update({
      status: 'Checked In',
      checked_in_at: now
    })
    .eq('id', childId)
    .select()
    .single()

  if (error) {
    console.error('Check-in error:', error)
    return { error: 'Failed to record check in' }
  }

  revalidatePath('/admin/directory')
  return { data }
}

export async function recordChildCheckOutAction(childId: string, checkOutTime?: string) {
  await checkAuth()
  const supabase = await createClient()
  
  const now = checkOutTime || new Date().toISOString()
  const { data, error } = await supabase
    .from('children')
    .update({
      status: 'Checked Out',
      checked_out_at: now
    })
    .eq('id', childId)
    .select()
    .single()

  if (error) {
    console.error('Check-out error:', error)
    return { error: 'Failed to record check out' }
  }

  revalidatePath('/admin/directory')
  return { data }
}

export async function updateChildAttendanceTimesAction(
  childId: string, 
  times: { checked_in_at?: string | null; checked_out_at?: string | null; status?: string }
) {
  await checkAuth()
  const supabase = await createClient()

  let status = times.status
  if (!status) {
    if (times.checked_out_at && (!times.checked_in_at || new Date(times.checked_out_at) >= new Date(times.checked_in_at))) {
      status = 'Checked Out'
    } else if (times.checked_in_at) {
      status = 'Checked In'
    } else {
      status = 'Registered'
    }
  }

  const updates: Record<string, any> = {
    status,
    checked_in_at: times.checked_in_at !== undefined ? times.checked_in_at : null,
    checked_out_at: times.checked_out_at !== undefined ? times.checked_out_at : null,
  }

  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', childId)
    .select()
    .single()

  if (error) {
    console.error('Update attendance times error:', error)
    return { error: 'Failed to update attendance times' }
  }

  revalidatePath('/admin/directory')
  return { data }
}

export async function toggleAttendanceStatusAction(childId: string, currentStatus: string) {
  await checkAuth()
  const supabase = await createClient()
  
  const now = new Date().toISOString()
  let updates: any = {}
  
  if (currentStatus === 'Checked In') {
    updates = { status: 'Checked Out', checked_out_at: now }
  } else {
    updates = { status: 'Checked In', checked_in_at: now }
  }

  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', childId)
    .select()
    .single()

  if (error) {
    console.error('Attendance toggle error:', error)
    return { error: 'Failed to update attendance status' }
  }

  revalidatePath('/admin/directory')
  return { data }
}
