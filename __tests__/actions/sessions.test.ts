import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getSessionsAction,
  addSessionAction,
  updateSessionAction,
  deleteSessionAction,
  getSessionEnrollmentsAction,
  enrollVolunteersAction,
  removeEnrollmentAction
} from '../../server/actions/sessions'
import { createClient } from '@/lib/supabase/server'

describe('Session Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
  })

  it('should get sessions', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockReturnThis()
    mockSupabase.range.mockResolvedValueOnce({ data: [{ id: '1' }], count: 1, error: null })

    const result = await getSessionsAction()
    expect(result.data).toBeDefined()
  })

  it('should add session', async () => {
    mockSupabase.insert.mockReturnThis()
    mockSupabase.select.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: '1' }, error: null })

    const result = await addSessionAction({ name: 'Morning Session', date: '2026-11-14', start_time: '09:00', end_time: '10:00' })
    expect(result.success).toBe(true)
  })

  it('should update session', async () => {
    mockSupabase.update.mockReturnThis()
    mockSupabase.eq.mockResolvedValueOnce({ error: null })

    const result = await updateSessionAction('1', { title: 'Updated Session' })
    expect(result.success).toBe(true)
  })

  it('should delete session', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { title: 'Session' } })
    
    mockSupabase.delete.mockReturnThis()
    mockSupabase.eq.mockReturnThis()

    const result = await deleteSessionAction('1')
    expect(result.success).toBe(true)
  })

  it('should get session enrollments', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockResolvedValueOnce({ data: [{ id: '1' }], error: null })

    const result = await getSessionEnrollmentsAction('1')
    expect(result.data).toBeDefined()
  })

  it('should enroll volunteers', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ error: null })

    const result = await enrollVolunteersAction('1', ['v1', 'v2'])
    expect(result.success).toBe(true)
  })

  it('should remove enrollment', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: '1', volunteers: { full_name: 'V1' } } })

    mockSupabase.delete.mockReturnThis()
    mockSupabase.eq.mockReturnThis()

    const result = await removeEnrollmentAction('1')
    expect(result.success).toBe(true)
  })
})
