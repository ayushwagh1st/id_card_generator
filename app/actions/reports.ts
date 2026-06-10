'use server'

import { createClient } from '@/lib/supabase/server'

export async function getVolunteerReportData() {
  const supabase = await createClient()

  const { data: volunteers, error } = await supabase
    .from('volunteers')
    .select(`id, snk_id, full_name, mobile_number, age, gender, model_id`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching volunteers report:', error)
    return { error: 'Failed to fetch volunteer data' }
  }

  const { data: models } = await supabase.from('models').select('id, name')

  const enrichedVolunteers = volunteers?.map(v => {
    const assignedModel = models?.find(m => m.id === v.model_id)
    return {
      ...v,
      models: { name: assignedModel?.name || 'Unassigned' }
    }
  }) || []

  const total = enrichedVolunteers.length
  const under18 = enrichedVolunteers.filter(v => v.age && v.age < 18).length
  const males = enrichedVolunteers.filter(v => v.gender === 'Male').length
  const females = enrichedVolunteers.filter(v => v.gender === 'Female').length

  return {
    data: enrichedVolunteers,
    stats: [
      { label: 'Total Volunteers', value: total },
      { label: 'Under 18', value: under18 },
      { label: 'Male', value: males },
      { label: 'Female', value: females }
    ]
  }
}

export async function getSessionReportData() {
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
  const totalEnrollments = sessions?.reduce((acc, s) => {
    // volunteer_sessions might be an array with {count: X} or a direct object
    const countArr = s.volunteer_sessions as any;
    const count = Array.isArray(countArr) ? countArr[0]?.count || countArr.length : 0;
    return acc + count;
  }, 0) || 0

  return {
    data: sessions,
    stats: [
      { label: 'Total Sessions', value: total },
      { label: 'Completed', value: completed },
      { label: 'Upcoming', value: upcoming },
      { label: 'Total Enrollments', value: totalEnrollments }
    ]
  }
}

export async function getModelReportData() {
  const supabase = await createClient()

  const { data: models, error } = await supabase
    .from('models')
    .select(`id, name, status, profiles:head_id (full_name)`)

  if (error) {
    console.error('Error fetching model report:', error)
    return { error: 'Failed to fetch model data' }
  }

  const { data: volunteers } = await supabase.from('volunteers').select('model_id')

  const modelCounts: Record<string, number> = {}
  volunteers?.forEach(v => {
    if (v.model_id) {
      modelCounts[v.model_id] = (modelCounts[v.model_id] || 0) + 1
    }
  })

  const enrichedModels = models?.map(m => ({
    ...m,
    volunteers: [{ count: modelCounts[m.id] || 0 }]
  })) || []

  const total = enrichedModels.length
  const active = enrichedModels.filter(m => m.status === 'Active').length
  
  const totalAssigned = enrichedModels.reduce((acc, m) => acc + (m.volunteers[0].count), 0)
  const emptyModels = enrichedModels.filter(m => m.volunteers[0].count === 0).length

  return {
    data: enrichedModels,
    stats: [
      { label: 'Total Models', value: total },
      { label: 'Active', value: active },
      { label: 'Assigned Vols', value: totalAssigned },
      { label: 'Empty Models', value: emptyModels }
    ]
  }
}

export async function getSecurityReportData() {
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

  return {
    data: security,
    stats: [
      { label: 'Total Personnel', value: total },
      { label: 'Active Staff', value: active },
      { label: 'Inactive', value: inactive }
    ]
  }
}
