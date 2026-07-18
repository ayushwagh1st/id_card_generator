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

export async function bulkCheckOutAction(childIds: string[]) {
  await checkAuth()
  const supabase = await createClient()

  if (!childIds || childIds.length === 0) return { error: 'No children selected' }

  const { error } = await supabase
    .from('children')
    .update({ 
      status: 'Checked Out', 
      checked_out_at: new Date().toISOString() 
    })
    .in('id', childIds)

  if (error) {
    console.error('Bulk checkout error:', error)
    return { error: 'Failed to bulk check out' }
  }

  revalidatePath('/admin/directory')
  return { success: true }
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

  return { data }
}
