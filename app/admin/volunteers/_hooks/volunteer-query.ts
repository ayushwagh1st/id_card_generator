export interface VolunteerQuery { searchTerm: string; filterStatus: string; filterModel: string; page: number }
const allowedStatuses = new Set(['Pending', 'Approved', 'Rejected'])

export function readVolunteerQuery(params: Pick<URLSearchParams, 'get'>): VolunteerQuery {
  const status = params.get('status') || 'all'
  const page = Number(params.get('page'))
  return { searchTerm: params.get('q') || '', filterStatus: allowedStatuses.has(status) ? status : 'all', filterModel: params.get('model') || 'all', page: Number.isSafeInteger(page) && page > 0 ? page : 1 }
}

export function updateVolunteerQuery(params: URLSearchParams, field: string, value: unknown) {
  const key = ({ searchTerm: 'q', filterStatus: 'status', filterModel: 'model', page: 'page' } as Record<string, string>)[field]
  if (!key) return false
  if (!value || value === 'all' || (key === 'page' && value === 1)) params.delete(key)
  else params.set(key, String(value))
  return true
}
