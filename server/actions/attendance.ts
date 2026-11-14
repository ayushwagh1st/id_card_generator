'use server'

import { createClient, checkAuth } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivityAction } from './activity'
import { createHash } from 'node:crypto'
import { requireOperator, applyOperation, signServerOperation } from '@/lib/offline/server'
import { normalizeScan, scanSchema } from '@/web_offline_p2p_sync/core/protocol'

export async function recordAttendanceAction(scanData: string, sessionId: string, mode: 'check-in' | 'check-out', operationId = crypto.randomUUID(), timestamp = new Date().toISOString()) {
  const user = await requireOperator()
  const parsed = scanSchema.safeParse({ scanData: normalizeScan(scanData), sessionId, mode, timestamp })
  if (!parsed.success) return { error: 'Invalid scan data.', success: false }
  const item = signServerOperation({ id: operationId, entity: 'attendance_scans', action: 'CREATE', payload: parsed.data, timestamp: Date.parse(timestamp), status: 'pending', retryCount: 0 }, user.id, user.app_metadata.role)
  const result = await applyOperation(item, user.id)
  if (result.error) return { success: false, error: result.error }
  return { success: true, message: 'Attendance recorded.', volunteer: { name: result.data?.name || scanData }, operationId }
}

export async function getSessionAttendanceAction(sessionId: string) {
  await checkAuth();
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        attendance_status,
        check_in_time,
        check_out_time,
        attendance_date,
        volunteer:volunteer_id ( id, snk_id, full_name, mobile_number )
      `)
      .eq('session_id', sessionId)
      .order('check_in_time', { ascending: false })

    if (error) {
        console.error('Error fetching attendance:', error)
        throw new Error('Could not fetch attendance records.')
    }

    return { data }
}

export async function getLecturerStatsAction() {
  await checkAuth();
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get all sessions (Security sees all)
    const { data: sessions } = await supabase.from('sessions').select('id, name, date, start_time')
    
    const todayStr = new Date().toISOString().split('T')[0]
    let todaySessions = 0
    let totalAssigned = sessions?.length || 0

    if (sessions) {
        todaySessions = sessions.filter(s => s.date === todayStr).length
    }

    return {
        totalAssigned,
        todaySessions
    }
}

export async function bulkCheckoutAllAction(sessionId: string) {
  await checkAuth();
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !['SUPER_ADMIN', 'MODEL_HEAD', 'LECTURER'].includes(user.app_metadata?.role)) {
        return { error: 'Unauthorized.' }
    }

    const now = new Date().toISOString()

    // Update all attendance records for this session where check_out_time is null
    const { error: updateError } = await supabase
        .from('attendance')
        .update({ check_out_time: now })
        .eq('session_id', sessionId)
        .is('check_out_time', null)

    if (updateError) {
        console.error('Error in bulk checkout:', updateError)
        return { error: 'Failed to perform bulk checkout.' }
    }

    const { data: session } = await supabase.from('sessions').select('name').eq('id', sessionId).single()
    await logActivityAction('BULK_CHECKOUT_ALL', `Bulk checkout for session: ${session?.name || sessionId}`)

    revalidatePath('/lecturer/sessions')
    return { success: true, message: 'All checked-in volunteers have been checked out.' }
}

export async function getLiveAttendanceFeedAction(limit = 50) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const todayStr = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        attendance_status,
        check_in_time,
        check_out_time,
        volunteer:volunteer_id ( full_name, snk_id ),
        session:session_id ( name )
      `)
      .eq('attendance_date', todayStr)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching live attendance:', error)
      return { error: 'Failed to fetch live attendance' }
    }

    return { data }
  } catch (err: any) {
    console.error(err)
    return { error: 'Failed to fetch live attendance' }
  }
}
export async function bulkSyncAttendanceAction(scans: any[]) {
  const user = await requireOperator()
  if (!Array.isArray(scans) || scans.length > 200) return { success: false, error: 'Invalid scan batch.', results: [] }
  const results: Array<{ id: string; scanData: string; status: 'success' | 'error'; message: string; retryable?: boolean }> = []
  for (let index = 0; index < scans.length; index++) {
    const scan = scans[index]
    const id = scan.id || 'legacy-action-' + createHash('sha256').update(user.id + ':' + index + ':' + JSON.stringify(scan)).digest('hex')
    try {
      const payload = scanSchema.parse({ ...scan, scanData: normalizeScan(scan.scanData || '') })
      const item = signServerOperation({ id, entity: 'attendance_scans', action: 'CREATE', payload, timestamp: Date.parse(payload.timestamp), status: 'pending', retryCount: 0, legacy: !scan.id }, user.id, user.app_metadata.role)
      const result = await applyOperation(item, user.id)
      results.push({ id, scanData: payload.scanData, status: result.error ? 'error' : 'success', message: result.error || 'Recorded', retryable: result.retryable })
    } catch (error: any) { results.push({ id, scanData: scan.scanData || '', status: 'error', message: error.message, retryable: false }) }
  }
  return { success: results.every(result => result.status === 'success'), results }
}
