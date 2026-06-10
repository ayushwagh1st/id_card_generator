import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  recordAttendanceAction,
  getSessionAttendanceAction,
  getLecturerStatsAction,
  bulkCheckoutAllAction,
  bulkSyncAttendanceAction
} from '../../app/actions/attendance'
import { createClient } from '@/lib/supabase/server'

describe('Attendance Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
  })

  it('should record attendance', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.or.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'v1', status: 'Approved' }, error: null }) // Volunteer
    
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 's1' }, error: null }) // Session

    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null }) // No existing record
    
    mockSupabase.insert.mockReturnThis()
    mockSupabase.select.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'a1' }, error: null })

    const result = await recordAttendanceAction('s1', 'v1', 'check-in')
    expect(result.success).toBe(true)
  })

  it('should get session attendance', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({ data: [{ id: '1' }], error: null })

    const result = await getSessionAttendanceAction('1')
    expect(result.data).toBeDefined()
  })

  it('should get lecturer stats', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null })
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { email: 'l@example.com' } }, error: null })
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'l1' } })

    const result = await getLecturerStatsAction()
    expect(result.todaySessions).toBeDefined()
  })

  it('should bulk checkout all', async () => {
    mockSupabase.update.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.select.mockResolvedValueOnce({ data: [{ id: '1' }], error: null })

    const result = await bulkCheckoutAllAction('1')
    expect(result.success).toBe(true)
  })

  it('should bulk sync attendance', async () => {
    const scans = [{ session_id: 's1', snk_id: 'v1', scan_type: 'CHECK_IN', timestamp: new Date().toISOString() }]
    
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.or.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'v1', status: 'Approved' }, error: null })
    
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    mockSupabase.insert.mockResolvedValueOnce({ error: null })

    const result = await bulkSyncAttendanceAction(scans)
    expect(result.success).toBe(true)
  })
})
