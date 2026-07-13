'use server'

import { createClient, checkAuth } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivityAction } from './activity'

// Process QR scan for attendance
export async function recordAttendanceAction(
  scanData: string, // could be uuid or snk_id
  sessionId: string,
  mode: 'check-in' | 'check-out'
) {
  await checkAuth();
  const supabase = await createClient()

  // 1. Get Logged in User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !['SUPER_ADMIN', 'MODEL_HEAD', 'LECTURER'].includes(user.user_metadata?.role)) {
    return { error: 'Unauthorized. You do not have permission to mark attendance.' }
  }
  const lecturerId = user.id

  // 2. Identify Volunteer
  // Clean scanData in case it's a verify URL
  let parsedScanData = scanData
  if (parsedScanData && parsedScanData.includes('/verify/')) {
      const split = parsedScanData.split('/verify/')
      if (split.length > 1) {
          parsedScanData = split[1]
      }
  }
  // Strip trailing slashes or whitespace
  parsedScanData = parsedScanData.trim().replace(/\/$/, '').split('?')[0]

  // Check if parsedScanData is a valid UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsedScanData)
  
  let query = supabase.from('volunteers').select('id, full_name, snk_id, photo_url')
  if (isUuid) {
      query = query.eq('id', parsedScanData)
  } else {
      query = query.or(`id.eq.${parsedScanData},snk_id.eq.${parsedScanData}`)
  }

  const { data: volunteerData, error: volunteerError } = await query.single()

  if (volunteerError || !volunteerData) {
      return { error: `Volunteer not found. Searched for: ${parsedScanData}` }
  }

  const volunteerId = volunteerData.id

  // 3. Verify Enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from('volunteer_sessions')
    .select('id')
    .eq('volunteer_id', volunteerId)
    .eq('session_id', sessionId)
    .single()

  if (enrollError || !enrollment) {
      return { error: '❌ Volunteer Not Assigned To This Session' }
  }

  // 4. Get Session details for time rules
  const { data: session } = await supabase.from('sessions').select('date, start_time, end_time').eq('id', sessionId).single()
  
  if (!session) {
      return { error: 'Session not found.' }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  // Ideally, compare session.date with todayStr, but ignoring for strictness if they scan on another day for some reason (or if we want to enforce it):
  // if (session.date !== todayStr) return { error: 'Session is not scheduled for today.' }

  // 5. Check if attendance already exists for today
  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('volunteer_id', volunteerId)
    .eq('session_id', sessionId)
    .eq('attendance_date', todayStr)
    .single()

  const now = new Date().toISOString()

  if (mode === 'check-in') {
      if (existingAttendance && existingAttendance.check_in_time) {
          return { error: '⚠ Attendance Already Marked for Check-in' }
      }

      // Calculate Present vs Late
      // Assuming session.start_time is 'HH:mm:ss'
      const sessionStartStr = `${session.date}T${session.start_time}`
      const sessionStartTime = new Date(sessionStartStr).getTime()
      const currentTime = new Date().getTime()
      
      // 15 minutes grace period
      const gracePeriodMs = 15 * 60 * 1000
      
      let status = 'Present'
      if (currentTime > sessionStartTime + gracePeriodMs) {
          status = 'Late'
      }

      const { error: insertError } = await supabase.from('attendance').insert([{
          volunteer_id: volunteerId,
          session_id: sessionId,
          lecturer_id: lecturerId,
          attendance_status: status,
          check_in_time: now,
          attendance_date: todayStr
      }])

      if (insertError) {
          console.error('Error recording check-in:', insertError)
          return { error: 'Database error recording attendance.' }
      }

      await logActivityAction('ATTENDANCE_SCAN', `Check-in (${status}) for ${volunteerData.full_name}`)

      return { 
          success: true, 
          message: `✅ Attendance Marked Successfully (${status}) for ${volunteerData.full_name}`,
          volunteer: {
              name: volunteerData.full_name,
              photo: volunteerData.photo_url
          }
      }

  } else if (mode === 'check-out') {
      if (!existingAttendance) {
          return { error: 'Volunteer has not checked in yet.' }
      }
      if (existingAttendance.check_out_time) {
          return { error: '⚠ Attendance Already Marked for Check-out' }
      }

      const { error: updateError } = await supabase.from('attendance')
        .update({ check_out_time: now })
        .eq('id', existingAttendance.id)

      if (updateError) {
          console.error('Error recording check-out:', updateError)
          return { error: 'Database error recording check-out.' }
      }

      await logActivityAction('ATTENDANCE_SCAN', `Check-out for ${volunteerData.full_name}`)

      return { 
          success: true, 
          message: `✅ Check-out Marked Successfully for ${volunteerData.full_name}`,
          volunteer: {
              name: volunteerData.full_name,
              photo: volunteerData.photo_url
          }
      }
  }

  return { error: 'Invalid mode.' }
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
    if (!user || !['SUPER_ADMIN', 'MODEL_HEAD', 'LECTURER'].includes(user.user_metadata?.role)) {
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
    await checkAuth();
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !['SUPER_ADMIN', 'MODEL_HEAD', 'LECTURER'].includes(user.user_metadata?.role)) {
        return { error: 'Unauthorized.' }
    }
    const lecturerId = user.id

    const results = []

    for (const scan of scans) {
        try {
            const { scanData, sessionId, mode, timestamp } = scan
            
            let parsedScanData = scanData
            // oxlint-disable-next-line react-doctor/js-set-map-lookups -- false positive: parsedScanData is a string, not an array
            if (parsedScanData && parsedScanData.includes('/verify/')) {
                const split = parsedScanData.split('/verify/')
                if (split.length > 1) {
                    parsedScanData = split[1]
                }
            }
            parsedScanData = parsedScanData.trim().replace(/\/$/, '').split('?')[0]

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsedScanData)
            let query = supabase.from('volunteers').select('id, full_name')
            if (isUuid) {
                query = query.eq('id', parsedScanData)
            } else {
                query = query.or(`id.eq.${parsedScanData},snk_id.eq.${parsedScanData}`)
            }

            const { data: volunteerData, error: volErr } = await query.single()

            if (volErr || !volunteerData) {
                results.push({ scanData, status: 'error', message: `Volunteer not found. Searched for: ${parsedScanData}` })
                continue
            }
            
            const volunteerId = volunteerData.id
            
            // Verify Enrollment
            const { data: enrollment } = await supabase
                .from('volunteer_sessions')
                .select('id')
                .eq('volunteer_id', volunteerId)
                .eq('session_id', sessionId)
                .single()

            if (!enrollment) {
                results.push({ scanData, status: 'error', message: 'Not assigned to session' })
                continue
            }
            
            // Get session rules
            const { data: session } = await supabase.from('sessions').select('date, start_time').eq('id', sessionId).single()
            if (!session) {
                results.push({ scanData, status: 'error', message: 'Session not found' })
                continue
            }

            const scanDate = new Date(timestamp)
            const scanDateStr = scanDate.toISOString().split('T')[0]

            // Check existing
            const { data: existingAttendance } = await supabase
                .from('attendance')
                .select('*')
                .eq('volunteer_id', volunteerId)
                .eq('session_id', sessionId)
                .eq('attendance_date', scanDateStr)
                .single()

            if (mode === 'check-in') {
                if (existingAttendance && existingAttendance.check_in_time) {
                    results.push({ scanData, status: 'error', message: 'Already checked in' })
                    continue
                }

                const sessionStartStr = `${session.date}T${session.start_time}`
                const sessionStartTime = new Date(sessionStartStr).getTime()
                const scanTimeMs = scanDate.getTime()
                const gracePeriodMs = 15 * 60 * 1000
                
                const status = (scanTimeMs > sessionStartTime + gracePeriodMs) ? 'Late' : 'Present'

                const { error: insertError } = await supabase.from('attendance').insert([{
                    volunteer_id: volunteerId,
                    session_id: sessionId,
                    lecturer_id: lecturerId,
                    attendance_status: status,
                    check_in_time: timestamp,
                    attendance_date: scanDateStr
                }])

                if (insertError) {
                    results.push({ scanData, status: 'error', message: 'Database error.' })
                } else {
                    results.push({ scanData, status: 'success', message: `✅ Check-in (${status}) for ${volunteerData.full_name}` })
                    await logActivityAction('BULK_ATTENDANCE_SCAN', `Bulk check-in (${status}) for ${volunteerData.full_name}`)
                }

            } else if (mode === 'check-out') {
                if (!existingAttendance) {
                    results.push({ scanData, status: 'error', message: 'No check-in found' })
                    continue
                }
                if (existingAttendance.check_out_time) {
                    results.push({ scanData, status: 'error', message: 'Already checked out' })
                    continue
                }

                const { error: updateError } = await supabase.from('attendance')
                    .update({ check_out_time: timestamp })
                    .eq('id', existingAttendance.id)
                
                if (updateError) {
                    results.push({ scanData, status: 'error', message: 'Database error.' })
                } else {
                    results.push({ scanData, status: 'success', message: `✅ Check-out for ${volunteerData.full_name}` })
                    await logActivityAction('BULK_ATTENDANCE_SCAN', `Bulk check-out for ${volunteerData.full_name}`)
                }
            }
        } catch (err: any) {
            results.push({ scanData: scan.scanData, status: 'error', message: err.message })
        }
    }

    return { success: true, results }
}
