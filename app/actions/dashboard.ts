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

  // 5. Fetch recent 5 registrations
  const { data: recentVolunteers } = await supabase
    .from('volunteers')
    .select('created_at, full_name, role')
    .order('created_at', { ascending: false })
    .limit(5)

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

  const formattedActivities = (recentVolunteers || []).map(rv => {
    const timeString = new Date(rv.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    return {
      action: `Volunteer Registered`,
      user: `${rv.full_name} (${rv.role || 'Volunteer'})`,
      time: timeString
    }
  })

  return {
    stats: {
      totalVolunteers: totalVolunteers || 0,
      totalModels: totalModels || 0,
      approvedCount: approvedCount || 0,
      pendingCount: pendingCount || 0
    },
    chartData: formattedChart,
    activities: formattedActivities
  }
}
