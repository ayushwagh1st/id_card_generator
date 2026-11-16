'use server'

import { createClient, checkAuth } from '@/lib/supabase/server'

export async function getVolunteerReportData() {
  await checkAuth();
  const supabase = await createClient()

  const { data: volunteers, error } = await supabase
    .from('volunteers')
    .select(`id, snk_id, full_name, mobile_number, age, gender, model_id, status, designation, branch, accommodation, duty_timing, created_at`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching volunteers report:', error)
    return { error: 'Failed to fetch volunteer data' }
  }

  const { data: models } = await supabase.from('models').select('id, name')

  const enrichedVolunteers = volunteers?.map(v => {
    const assignedModel = Array.isArray(models) ? models.find(m => m.id === v.model_id) : undefined
    return {
      ...v,
      status: v.status || 'Pending',
      designation: v.designation || 'Volunteer',
      branch: v.branch || 'General',
      models: { name: assignedModel?.name || 'Unassigned' }
    }
  }) || []

  const total = enrichedVolunteers.length
  const approved = enrichedVolunteers.filter(v => v.status === 'Approved').length
  const pending = enrichedVolunteers.filter(v => v.status === 'Pending').length
  const assigned = enrichedVolunteers.filter(v => v.model_id).length
  const accommodation = enrichedVolunteers.filter(v => v.accommodation === true || String(v.accommodation).toLowerCase() === 'yes').length
  const under18 = enrichedVolunteers.filter(v => v.age && v.age < 18).length

  return {
    data: enrichedVolunteers,
    stats: [
      { label: 'Total Volunteers', value: total },
      { label: 'Approved', value: approved },
      { label: 'Pending Review', value: pending },
      { label: 'Assigned to Model', value: assigned },
      { label: 'Accommodation', value: accommodation },
      { label: 'Minors (Under 18)', value: under18 }
    ]
  }
}

export async function getSessionReportData() {
  await checkAuth();
  const supabase = await createClient()

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id, name, category, date, start_time, end_time, status, venue, lecturer_name, capacity,
      volunteer_sessions(count)
    `)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching session report:', error)
    return { error: 'Failed to fetch session data' }
  }

  const total = sessions?.length || 0
  const completed = sessions?.filter(s => s.status === 'Completed').length || 0
  const upcoming = sessions?.filter(s => s.status === 'Scheduled').length || 0
  
  // Calculate total enrollments safely based on Supabase response type
  let totalCapacity = 0
  const totalEnrollments = sessions?.reduce((acc, s) => {
    const countArr = s.volunteer_sessions as any;
    const count = Array.isArray(countArr) ? countArr[0]?.count || countArr.length : (countArr?.count || 0);
    if (s.capacity && typeof s.capacity === 'number') {
      totalCapacity += s.capacity
    }
    return acc + count;
  }, 0) || 0

  const capacityRate = totalCapacity > 0 ? `${Math.round((totalEnrollments / totalCapacity) * 100)}%` : 'N/A'

  return {
    data: sessions,
    stats: [
      { label: 'Total Sessions', value: total },
      { label: 'Completed', value: completed },
      { label: 'Scheduled', value: upcoming },
      { label: 'Total Enrollments', value: totalEnrollments },
      { label: 'Capacity Filled', value: capacityRate }
    ]
  }
}

export async function getModelReportData() {
  await checkAuth();
  const supabase = await createClient()

  const { data: models, error } = await supabase
    .from('models')
    .select(`id, name, status, profiles:head_id (full_name)`)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching model report:', error)
    return { error: 'Failed to fetch model data' }
  }

  const { data: volunteers } = await supabase.from('volunteers').select('model_id')

  const modelCounts: Record<string, number> = {}
  if (Array.isArray(volunteers)) {
    volunteers.forEach(v => {
      if (v.model_id) {
        modelCounts[v.model_id] = (modelCounts[v.model_id] || 0) + 1
      }
    })
  }

  const enrichedModels = models?.map(m => {
    const count = modelCounts[m.id] || 0
    let staffingStatus = 'Unstaffed'
    if (count >= 4) staffingStatus = 'Fully Staffed'
    else if (count > 0) staffingStatus = 'Understaffed'

    return {
      ...m,
      staffing_status: staffingStatus,
      volunteers: [{ count }]
    }
  }) || []

  const total = enrichedModels.length
  const active = enrichedModels.filter(m => m.status === 'Active').length
  const totalAssigned = enrichedModels.reduce((acc, m) => acc + (m.volunteers[0].count), 0)
  const emptyModels = enrichedModels.filter(m => m.volunteers[0].count === 0).length
  const fullyStaffed = enrichedModels.filter(m => m.volunteers[0].count >= 4).length

  return {
    data: enrichedModels,
    stats: [
      { label: 'Total Models', value: total },
      { label: 'Active Models', value: active },
      { label: 'Assigned Vols', value: totalAssigned },
      { label: 'Fully Staffed', value: fullyStaffed },
      { label: 'Unstaffed Models', value: emptyModels }
    ]
  }
}

export async function getSecurityReportData() {
  await checkAuth();
  const supabase = await createClient()

  const { data: security, error } = await supabase
    .from('lecturers')
    .select('id, name, email, mobile, status')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching security report:', error)
    return { error: 'Failed to fetch security data' }
  }

  const total = security?.length || 0
  const active = security?.filter(s => s.status === 'Active').length || 0
  const inactive = total - active
  const readinessRate = total > 0 ? `${Math.round((active / total) * 100)}%` : '0%'

  return {
    data: security,
    stats: [
      { label: 'Total Personnel', value: total },
      { label: 'Active Staff', value: active },
      { label: 'Inactive', value: inactive },
      { label: 'Deployment Readiness', value: readinessRate }
    ]
  }
}

export async function getRegisteredChildrenReportData() {
  await checkAuth();
  const supabase = await createClient()

  const { data: children, error } = await supabase
    .from('children')
    .select(`id, qr_id, name, contact_number, status, checked_in_at, checked_out_at, created_at, session:sessions(name)`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching children report:', error)
    return { error: 'Failed to fetch children data' }
  }

  const { data: qrCodes } = await supabase.from('qr_codes').select('id, serial_number')
  
  const enrichedChildren = children?.map(c => {
    const qrMatch = Array.isArray(qrCodes) ? qrCodes.find(q => q.id === c.qr_id) : undefined
    return {
      ...c,
      serial_number: qrMatch ? `MSS-2027-${String(qrMatch.serial_number).padStart(3, '0')}` : (c.qr_id ? c.qr_id.substring(0, 8) : 'N/A'),
      session_name: (c.session as any)?.name || 'N/A'
    }
  }) || []

  const total = enrichedChildren.length
  const checkedIn = enrichedChildren.filter(c => c.status === 'Checked In').length
  const checkedOut = enrichedChildren.filter(c => c.status === 'Checked Out').length
  const registeredOnly = enrichedChildren.filter(c => !c.checked_in_at && c.status !== 'Checked In').length
  const attendanceRate = total > 0 ? `${Math.round(((checkedIn + checkedOut) / total) * 100)}%` : '0%'
  
  return {
    data: enrichedChildren,
    stats: [
      { label: 'Total Registered', value: total },
      { label: 'Currently On-Site', value: checkedIn },
      { label: 'Checked Out', value: checkedOut },
      { label: 'Not Arrived Yet', value: registeredOnly },
      { label: 'Attendance Rate', value: attendanceRate }
    ]
  }
}
