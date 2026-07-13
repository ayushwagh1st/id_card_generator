'use server'

import { createClient, checkAuth } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivityAction } from './activity'
import { sessionSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

// Session CRUD
export async function getSessionsAction(
  page: number = 1,
  limit: number = 20,
  query: string = '',
  statusFilter: string = 'all',
  lecturerFilter: string = 'all'
) {
  await checkAuth();
  const supabase = await createClient()

  let dbQuery = supabase
    .from('sessions')
    .select(`
      *,
      lecturer:lecturer_id ( id, name )
    `, { count: 'exact' })

  if (statusFilter && statusFilter !== 'all') {
    dbQuery = dbQuery.eq('status', statusFilter)
  }
  if (lecturerFilter && lecturerFilter !== 'all') {
    dbQuery = dbQuery.eq('lecturer_id', lecturerFilter)
  }

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,category.ilike.%${query}%`)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await dbQuery.order('date', { ascending: true }).order('start_time', { ascending: true }).range(from, to)

  if (error) {
    console.error('Error fetching sessions:', error)
    throw new Error('Could not fetch sessions.')
  }

  return { data, count }
}

export async function addSessionAction(formData: any) {
  await checkAuth();
  const { headers } = await import('next/headers')
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rateLimit = await checkRateLimit(`add_session_${ip}`, 10, 60000)
  if (!rateLimit.success) return { error: 'Too many requests. Please try again later.' }

  const parsed = sessionSchema.safeParse(formData)
  if (!parsed.success) return { error: 'Invalid input data', details: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()

  const { data, error } = await supabase.from('sessions').insert([parsed.data]).select().single()

  if (error) {
    console.error('Error creating session:', error)
    return { error: 'Failed to create session.' }
  }

  revalidatePath('/admin/sessions')
  
  await logActivityAction('CREATE_SESSION', `Session: ${formData.name}`, formData)
  
  return { success: true, data }
}

export async function updateSessionAction(id: string, formData: any) {
  await checkAuth();
  const { headers } = await import('next/headers')
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rateLimit = await checkRateLimit(`update_session_${ip}`, 20, 60000)
  if (!rateLimit.success) return { error: 'Too many requests. Please try again later.' }

  const parsed = sessionSchema.partial().safeParse(formData)
  if (!parsed.success) return { error: 'Invalid input data', details: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()

  const { error } = await supabase.from('sessions').update(parsed.data).eq('id', id)

  if (error) {
    console.error('Error updating session:', error)
    return { error: 'Failed to update session.' }
  }

  revalidatePath('/admin/sessions')
  revalidatePath('/lecturer/dashboard')
  
  const sessionName = formData.name || id
  await logActivityAction('UPDATE_SESSION', `Session: ${sessionName}`, formData)
  
  return { success: true }
}

export async function deleteSessionAction(id: string) {
  await checkAuth();
  const supabase = await createClient()
  
  const { data: session, error } = await supabase.from('sessions').delete().eq('id', id).select('name').single()
  
  if (error) {
    console.error('Error deleting session:', error)
    return { error: 'Failed to delete session.' }
  }

  revalidatePath('/admin/sessions')
  
  await logActivityAction('DELETE_SESSION', `Session: ${session?.name || id}`)
  
  return { success: true }
}

// Session Enrollment (Volunteer Assignment)
export async function getSessionEnrollmentsAction(sessionId: string) {
  await checkAuth();
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('volunteer_sessions')
    .select(`
      id,
      session_id,
      volunteer:volunteer_id ( id, snk_id, full_name, mobile_number, photo_url )
    `)
    .eq('session_id', sessionId)

  if (error) {
    console.error('Error fetching enrollments:', error)
    throw new Error('Could not fetch session enrollments.')
  }

  return { data }
}

export async function enrollVolunteersAction(sessionId: string, volunteerIds: string[]) {
  await checkAuth();
  const supabase = await createClient()

  const records = volunteerIds.map(id => ({
    session_id: sessionId,
    volunteer_id: id
  }))

  // The DB has a UNIQUE constraint on (volunteer_id, session_id).
  // Using upsert with onConflict to ignore duplicates.
  const { error } = await supabase
    .from('volunteer_sessions')
    .upsert(records, { onConflict: 'volunteer_id,session_id', ignoreDuplicates: true })

  if (error) {
    console.error('Error enrolling volunteers:', error)
    return { error: 'Failed to enroll volunteers.' }
  }

  revalidatePath('/admin/session-enrollment')
  revalidatePath('/lecturer/sessions')
  
  const { data: session } = await supabase.from('sessions').select('name').eq('id', sessionId).single()
  await logActivityAction('ENROLL_VOLUNTEERS', `${volunteerIds.length} volunteers enrolled in session: ${session?.name || sessionId}`)
  
  return { success: true }
}

export async function removeEnrollmentAction(enrollmentId: string) {
  await checkAuth();
  const supabase = await createClient()

  const { data: enrollment, error } = await supabase
    .from('volunteer_sessions')
    .delete()
    .eq('id', enrollmentId)
    .select('session:sessions(name), volunteer:volunteers(full_name)')
    .single()

  if (error) {
    console.error('Error removing enrollment:', error)
    return { error: 'Failed to remove volunteer from session.' }
  }

  revalidatePath('/admin/session-enrollment')
  
  const sessionName = (enrollment?.session as any)?.name || 'Unknown Session'
  const volName = (enrollment?.volunteer as any)?.full_name || 'Unknown Volunteer'
  await logActivityAction('REMOVE_ENROLLMENT', `Removed ${volName} from ${sessionName}`)
  
  return { success: true }
}
