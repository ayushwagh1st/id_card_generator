'use server'

import { createClient, checkAuth } from '@/lib/supabase/server'

export async function getDashboardStatsAction() {
  try {
    let authResult;
    try {
      authResult = await checkAuth();
    } catch (err) {
      return { error: 'Unauthorized' };
    }
    const supabase = await createClient()

  const todayStr = new Date().toISOString().split('T')[0]

  // Run all independent queries concurrently to optimize performance
  const [
    volRes,
    modelsRes,
    approvedRes,
    pendingRes,
    recentActivitiesRes,
    volModelsRes,
    modelsListRes,
    totalSessionsRes,
    totalLecturersRes,
    todaySessionsRes,
    totalEnrollmentsRes,
    totalPresentRes
  ] = await Promise.all([
    supabase.from('volunteers').select('*', { count: 'exact', head: true }),
    supabase.from('models').select('*', { count: 'exact', head: true }),
    supabase.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'Approved'),
    supabase.from('volunteers').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('volunteers').select('model_id'),
    supabase.from('models').select('id, name'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('lecturers').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('date', todayStr),
    supabase.from('volunteer_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).in('attendance_status', ['Present', 'Late'])
  ])

  const { count: totalVolunteers, error: volErr } = volRes
  if (volErr) throw new Error(volErr.message)

  const { count: totalModels, error: modelsErr } = modelsRes
  if (modelsErr) throw new Error(modelsErr.message)

  const { count: approvedCount } = approvedRes
  const { count: pendingCount } = pendingRes
  const { data: recentActivities } = recentActivitiesRes
  const { data: volModels } = volModelsRes
  const { data: models } = modelsListRes
  const { count: totalSessions } = totalSessionsRes
  const { count: totalLecturers } = totalLecturersRes
  const { count: todaySessions } = todaySessionsRes
  const { count: totalEnrollments } = totalEnrollmentsRes
  const { count: totalPresent } = totalPresentRes

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
          id: act.id,
          action: act.action_type.replace(/_/g, ' '),
          user: `${act.user_name} (${act.role})`,
          time: timeString
        }
      })
  } else {
      formattedActivities = []
  }

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
} catch (error: any) {
  console.error("Error in getDashboardStatsAction:", error);
  return { error: error.message || "An unexpected error occurred" };
}
}
