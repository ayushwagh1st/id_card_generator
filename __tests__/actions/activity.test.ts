import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logActivityAction, getActivitiesAction } from '../../app/actions/activity'
import { createClient } from '@/lib/supabase/server'

describe('Activity Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
  })

  it('should log activity successfully', async () => {
    mockSupabase.insert.mockReturnThis()
    
    // Simulate getting user role correctly
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { email: 'test@example.com' } },
      error: null
    })
    
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: 'ADMIN' } })
        }
      }
      return mockSupabase
    })

    const result = await logActivityAction('TEST_ACTION', 'Test description')
    expect(result).toBeUndefined() // The function doesn't return anything
    expect(mockSupabase.insert).toHaveBeenCalled()
  })

  it('should get activities', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockReturnThis()
    mockSupabase.limit.mockResolvedValueOnce({ data: [{ id: 1 }], error: null })

    const result = await getActivitiesAction(10)
    expect(result.data).toBeDefined()
    expect(result.data?.length).toBe(1)
  })
})
