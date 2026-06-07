'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardStatsAction() {
  const supabase = await createClient()

  // 1. Fetch count of volunteers
  const { count: totalVolunteers, error: volErr } = await supabase
    .from('volunteers')
    .select('*', { count: 'exact', head: true })
    
  if (volErr) throw new Error(volErr.message)

  // 2. Fetch count of models
  const { count: totalModels, error: modelsErr } = await supabase
    .from('models')
    .select('*', { count: 'exact', head: true })
    
  if (modelsErr) throw new Error(modelsErr.message)

  // 3. Fetch count of approved volunteers
  const { count: approvedCount } = await supabase
    .from('volunteers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Approved')

  // 4. Fetch count of pending volunteers
  const { count: pendingCount } = await supabase
    .from('volunteers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending')

  // 5. Fetch recent 8 activities from activity_logs
  const { data: recentActivities } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)

  // 6. Fetch stats per model (we need to aggregate or just fetch all for chart, wait we can't fetch 5000 rows. We should use rpc or fetch grouped data. Since we don't have rpc, we'll fetch only model_id from volunteers to group manually, which is lighter than fetching everything)
  const { data: volModels } = await supabase
    .from('volunteers')
    .select('model_id')

  const { data: models } = await supabase.from('models').select('id, name')

  const modelCounts: Record<string, number> = {}
  models?.forEach(m => {
    modelCounts[m.name] = 0
  })

  volModels?.forEach(v => {
    const matchingModel = models?.find(m => m.id === v.model_id)
    if (matchingModel) {
      modelCounts[matchingModel.name] = (modelCounts[matchingModel.name] || 0) + 1
    }
  })

  const formattedChart = Object.keys(modelCounts).map(name => ({
    name,
    volunteers: modelCounts[name]
  }))

  let formattedActivities: any[] = []
  if (recentActivities && recentActivities.length > 0) {
      formattedActivities = recentActivities.map(act => {
        const timeString = new Date(act.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        return {
          action: act.action_type.replace(/_/g, ' '),
          user: `${act.user_name} (${act.role})`,
          time: timeString
        }
      })
  } else {
      // Fallback if table is empty or missing (graceful degradation)
      formattedActivities = []
  }

  // Fetch Sessions count
  const { count: totalSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true })

  // Fetch Lecturers count
  const { count: totalLecturers } = await supabase.from('lecturers').select('*', { count: 'exact', head: true })

  // Today's sessions
  const todayStr = new Date().toISOString().split('T')[0]
  const { count: todaySessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('date', todayStr)

  // Total enrollments
  const { count: totalEnrollments } = await supabase.from('volunteer_sessions').select('*', { count: 'exact', head: true })

  // Total attendances marked Present or Late
  const { count: totalPresent } = await supabase.from('attendance')
    .select('*', { count: 'exact', head: true })
    .in('attendance_status', ['Present', 'Late'])

  const attendancePercentage = totalEnrollments ? Math.round(((totalPresent || 0) / totalEnrollments) * 100) : 0

  return {
    stats: {
      totalVolunteers: totalVolunteers || 0,
      totalModels: totalModels || 0,
      approvedCount: approvedCount || 0,
      pendingCount: pendingCount || 0,
      totalSessions: totalSessions || 0,
      totalLecturers: totalLecturers || 0,
      todaySessions: todaySessions || 0,
      attendancePercentage
    },
    chartData: formattedChart,
    activities: formattedActivities
  }
}
